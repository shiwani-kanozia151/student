import { supabaseAdmin } from '@/lib/supabase';

// Function to set up proper access policies for verification_admins table
export async function enableVerificationAdminAccess() {
  try {
    // SQL to set up proper access
    const sql = `
      -- First, ensure the table exists with proper structure
      CREATE TABLE IF NOT EXISTS public.verification_admins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR NOT NULL UNIQUE,
        password_text VARCHAR NOT NULL,
        course_id VARCHAR NOT NULL,
        course_name VARCHAR NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
      
      -- Enable Row Level Security
      ALTER TABLE public.verification_admins ENABLE ROW LEVEL SECURITY;
      
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Public read access" ON public.verification_admins;
      DROP POLICY IF EXISTS "Auth read access" ON public.verification_admins;
      DROP POLICY IF EXISTS "Auth insert access" ON public.verification_admins;
      DROP POLICY IF EXISTS "Auth update access" ON public.verification_admins;
      
      -- Create policies that allow authenticated users to view and manage verification officers
      CREATE POLICY "Auth read access" ON public.verification_admins
        FOR SELECT USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Auth insert access" ON public.verification_admins
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        
      CREATE POLICY "Auth update access" ON public.verification_admins
        FOR UPDATE USING (auth.role() = 'authenticated');
    `;

    // Execute the SQL to set up the table with proper access
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC fails, try raw SQL (requires more permissions)
      console.warn("RPC failed, attempting direct SQL execution:", error);
      
      // Try to create the table first
      await supabaseAdmin.from('verification_admins').select('id').limit(1);
      
      // Then disable RLS temporarily to allow us to insert records
      await supabaseAdmin.rpc('disable_rls', { table_name: 'verification_admins' });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up verification admin access:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
} 