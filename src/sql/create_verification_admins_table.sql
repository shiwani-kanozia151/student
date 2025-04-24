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
      id UUID PRIMARY KEY,
      email VARCHAR NOT NULL UNIQUE,
      password_text VARCHAR NOT NULL, -- Store plain password for admin reference
      course_id VARCHAR NOT NULL,
      course_name VARCHAR NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ,
      CONSTRAINT fk_user
        FOREIGN KEY (id)
        REFERENCES auth.users (id)
        ON DELETE CASCADE
    );
    
    -- Create indexes for better performance
    CREATE INDEX idx_verification_admins_email 
    ON public.verification_admins(email);
    
    CREATE INDEX idx_verification_admins_course_id 
    ON public.verification_admins(course_id);

    -- Add RLS policies
    ALTER TABLE public.verification_admins ENABLE ROW LEVEL SECURITY;

    -- Policy to allow users to read their own record
    CREATE POLICY "Users can view own record"
      ON public.verification_admins
      FOR SELECT
      USING (auth.uid() = id);

    -- Policy to allow verification admins to be created
    CREATE POLICY "Allow insert for new verification admins"
      ON public.verification_admins
      FOR INSERT
      WITH CHECK (true);
    
    RAISE NOTICE 'verification_admins table created successfully';
  ELSE
    RAISE NOTICE 'verification_admins table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the table
SELECT create_verification_admins_table(); 