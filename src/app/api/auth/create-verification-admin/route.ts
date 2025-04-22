import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { email, password, course_id, course_name } = await request.json();

    // Validate required fields
    if (!email || !password || !course_id || !course_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if email already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('verification_admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: 'Error checking for existing admin: ' + checkError.message },
        { status: 500 }
      );
    }

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create the verification admin
    const newAdmin = {
      id: uuidv4(),
      email,
      password_hash,
      course_id,
      course_name,
      created_at: new Date().toISOString(),
      last_login: null
    };

    const { data, error } = await supabase
      .from('verification_admins')
      .insert(newAdmin)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error creating verification admin: ' + error.message },
        { status: 500 }
      );
    }

    // Return the newly created admin (excluding the password hash)
    const { password_hash: _, ...safeAdminData } = data;
    
    return NextResponse.json(safeAdminData, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating verification admin:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
} 