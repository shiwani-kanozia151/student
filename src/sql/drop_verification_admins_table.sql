-- First disable row level security to avoid any permission issues
ALTER TABLE IF EXISTS public.verification_admins DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own record" ON public.verification_admins;
DROP POLICY IF EXISTS "Allow insert for new verification admins" ON public.verification_admins;

-- Drop the table if it exists
DROP TABLE IF EXISTS public.verification_admins CASCADE;

-- Verify the table is dropped
DO $$
BEGIN
    RAISE NOTICE 'verification_admins table has been dropped successfully';
END $$; 