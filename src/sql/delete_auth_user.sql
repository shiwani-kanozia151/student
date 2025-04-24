-- Delete the auth user
DELETE FROM auth.users
WHERE email = 'mcaverify1@nitt.edu';

-- Raise notice about the deletion
DO $$
BEGIN
    RAISE NOTICE 'Auth user with email mcaverify1@nitt.edu has been deleted.';
END $$; 