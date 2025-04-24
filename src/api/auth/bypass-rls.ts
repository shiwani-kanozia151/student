import { supabaseAdmin } from '@/lib/supabase';

export async function bypassRLS() {
  try {
    console.log("Attempting to bypass RLS for verification_admins table");
    
    // Create table if it doesn't exist - with no RLS
    const createTableSQL = `
      -- Create or replace the table
      CREATE TABLE IF NOT EXISTS public.verification_admins (
        id UUID PRIMARY KEY,
        email VARCHAR NOT NULL UNIQUE,
        password_text VARCHAR NOT NULL,
        course_id VARCHAR NOT NULL,
        course_name VARCHAR NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
      
      -- Ensure RLS is disabled
      ALTER TABLE public.verification_admins DISABLE ROW LEVEL SECURITY;
      
      -- Grant all permissions
      GRANT ALL ON public.verification_admins TO anon, authenticated, service_role;
    `;
    
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: createTableSQL });
    
    if (error) {
      console.warn("Failed to bypass RLS through SQL:", error);
      return { success: false };
    }
    
    console.log("Successfully executed RLS bypass using custom function");
    return { success: true };
  } catch (error) {
    console.error("Error in bypassRLS:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 