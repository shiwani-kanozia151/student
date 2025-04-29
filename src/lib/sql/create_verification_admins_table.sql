-- Function to create the verification_admins table if it doesn't exist
CREATE OR REPLACE FUNCTION create_verification_admins_table()
RETURNS TEXT AS $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if the table already exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'verification_admins'
    ) INTO table_exists;

    -- If the table doesn't exist, create it
    IF NOT table_exists THEN
        EXECUTE '
            CREATE TABLE public.verification_admins (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR NOT NULL UNIQUE,
                password_hash VARCHAR NOT NULL,
                course_id VARCHAR NOT NULL,
                course_name VARCHAR NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ
            );
            
            CREATE INDEX idx_verification_admins_email 
            ON public.verification_admins(email);
            
            CREATE INDEX idx_verification_admins_course_id 
            ON public.verification_admins(course_id);
        ';
        RETURN 'Verification admins table created successfully.';
    ELSE
        RETURN 'Verification admins table already exists.';
    END IF;
END;
$$ LANGUAGE plpgsql; 