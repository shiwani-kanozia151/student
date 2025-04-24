import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating table:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Table created successfully' });
  } catch (error: any) {
    console.error('Error in create-verification-admins-table:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 