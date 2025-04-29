import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Make sure to set SUPABASE_SERVICE_ROLE_KEY in your environment variables
// This is a privileged key with admin rights - keep it secure!
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // SQL to create the verification_admins table if it doesn't exist
    const sql = `
      CREATE TABLE IF NOT EXISTS public.verification_admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR NOT NULL,
        course_id VARCHAR NOT NULL,
        course_name VARCHAR NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
      
      CREATE INDEX IF NOT EXISTS idx_verification_admins_email 
      ON public.verification_admins(email);
      
      CREATE INDEX IF NOT EXISTS idx_verification_admins_course_id 
      ON public.verification_admins(course_id);
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating verification_admins table:', error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Verification admins table created or already exists' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in create-verification-admins-table API route:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 