-- Function to create student_assignments table
CREATE OR REPLACE FUNCTION create_student_assignments_table()
RETURNS void AS $$
BEGIN
  -- Check if the table exists first
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE tablename = 'student_assignments' AND schemaname = 'public'
  ) THEN
    -- Create the table
    CREATE TABLE public.student_assignments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      student_id UUID NOT NULL,
      verification_officer_id UUID NOT NULL,
      course_id VARCHAR NOT NULL,
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      assigned_by VARCHAR,
      UNIQUE(student_id)
    );
    
    -- Create indexes for better performance
    CREATE INDEX idx_student_assignments_student_id 
    ON public.student_assignments(student_id);
    
    CREATE INDEX idx_student_assignments_verification_officer_id 
    ON public.student_assignments(verification_officer_id);
    
    CREATE INDEX idx_student_assignments_course_id 
    ON public.student_assignments(course_id);
    
    RAISE NOTICE 'student_assignments table created successfully';
  ELSE
    RAISE NOTICE 'student_assignments table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create the table
SELECT create_student_assignments_table(); 