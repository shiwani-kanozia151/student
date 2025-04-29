-- Function to create verification_admins table
CREATE OR REPLACE FUNCTION create_verification_admins_table()
RETURNS void AS $$
BEGIN
  -- Check if the table exists first
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'verification_admins' AND schemaname = 'public'
  ) THEN
    -- Create the table
    CREATE TABLE public.verification_admins (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR NOT NULL UNIQUE,
      password_hash VARCHAR NOT NULL,
      course_id VARCHAR NOT NULL,
      course_name VARCHAR NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );
    
    -- Create indexes for better performance
    CREATE INDEX idx_verification_admins_email 
    ON public.verification_admins(email);
    
    CREATE INDEX idx_verification_admins_course_id 
    ON public.verification_admins(course_id);
    
    RAISE NOTICE 'verification_admins table created successfully';
  ELSE
    RAISE NOTICE 'verification_admins table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the table
SELECT create_verification_admins_table(); 