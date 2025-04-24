-- First, disable RLS temporarily
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_admins DISABLE ROW LEVEL SECURITY;

-- Clean up the students table
TRUNCATE TABLE public.students CASCADE;

-- Clean up the verification_admins table
DELETE FROM public.verification_admins WHERE email != 'mcaadmin@nitt.edu';

-- Clean up auth.users table (preserve only super admin)
DELETE FROM auth.users 
WHERE email != 'mcaadmin@nitt.edu' 
AND email NOT LIKE '%@supabase.io' 
AND email NOT LIKE '%@supabase.co';

-- Re-enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_admins ENABLE ROW LEVEL SECURITY;

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Database cleanup completed successfully.';
END $$; 