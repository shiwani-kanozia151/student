import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Extract data from request body
    const { email, password, course_id, course_name } = await request.json();

    // Validate required fields
    if (!email || !password || !course_id) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, course_id)' },
        { status: 400 }
      );
    }

    // Get Supabase credentials from request cookies or headers
    const supabaseUrl = request.cookies.get('supabaseUrl')?.value || 
                        request.headers.get('X-Supabase-URL') || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const supabaseKey = request.cookies.get('supabaseKey')?.value || 
                       request.headers.get('X-Supabase-Key') || 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if the verification_admins table exists, create it if it doesn't
    await createTableIfNotExists(supabase);
    
    // Check if admin with this email already exists for this course
    const { data: existingAdmin } = await supabase
      .from('verification_admins')
      .select('id')
      .eq('email', email)
      .eq('course_id', course_id)
      .single();
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Verification admin already exists for this course' },
        { status: 409 }
      );
    }

    // Hash the password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;

    // Add new verification admin
    const { data, error } = await supabase
      .from('verification_admins')
      .insert([
        {
          email,
          password_hash: passwordHash,
          course_id,
          course_name: course_name || null,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      return NextResponse.json(
        { error: 'Error adding verification admin: ' + error.message },
        { status: 500 }
      );
    }

    // Return success response with the created admin (excluding password hash)
    const admin = data[0];
    return NextResponse.json(
      {
        id: admin.id,
        email: admin.email,
        course_id: admin.course_id,
        course_name: admin.course_name,
        created_at: admin.created_at
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error adding verification admin:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}

// Function to create the verification_admins table if it doesn't exist
async function createTableIfNotExists(supabase: any) {
  try {
    // Try to select from the table to check if it exists
    await supabase.from('verification_admins').select('id').limit(1);
  } catch (error: any) {
    // If the table doesn't exist, create it
    if (error.message.includes('relation "verification_admins" does not exist')) {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS verification_admins (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          course_id TEXT NOT NULL,
          course_name TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_login TIMESTAMP WITH TIME ZONE,
          UNIQUE(email, course_id)
        );
        CREATE INDEX IF NOT EXISTS verification_admins_email_idx ON verification_admins(email);
        CREATE INDEX IF NOT EXISTS verification_admins_course_id_idx ON verification_admins(course_id);
      `;
      
      await supabase.rpc('exec', { query: createTableSQL });
    } else {
      // If it's a different error, throw it
      throw error;
    }
  }
} 