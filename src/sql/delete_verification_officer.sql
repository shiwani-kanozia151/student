-- First disable RLS to avoid permission issues
ALTER TABLE IF EXISTS public.verification_admins DISABLE ROW LEVEL SECURITY;

-- Delete the verification officer record
DELETE FROM public.verification_admins
WHERE email = 'mcaverify1@nitt.edu';

-- Re-enable RLS
ALTER TABLE IF EXISTS public.verification_admins ENABLE ROW LEVEL SECURITY;

-- Raise notice about the deletion
DO $$
BEGIN
    RAISE NOTICE 'Verification officer with email mcaverify1@nitt.edu has been deleted.';
END $$; 