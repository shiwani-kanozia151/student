import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS public.verification_admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR NOT NULL UNIQUE,
        password VARCHAR NOT NULL,
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

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error creating table:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Table created successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 