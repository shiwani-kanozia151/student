-- Enable RLS on the students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own data" ON public.students;
DROP POLICY IF EXISTS "Students can insert their own data" ON public.students;
DROP POLICY IF EXISTS "Students can update their own data" ON public.students;
DROP POLICY IF EXISTS "Admins can manage all student data" ON public.students;

-- Drop application policies if they exist
DROP POLICY IF EXISTS "Students can insert their own application" ON public.applications;
DROP POLICY IF EXISTS "Students can view their own application" ON public.applications;
DROP POLICY IF EXISTS "Students can update their own application" ON public.applications;
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.applications;

-- Create policies for the students table
-- Allow students to view their own data
CREATE POLICY "Students can view their own data" ON public.students
    FOR SELECT
    USING (auth.uid() = id);

-- Allow students to insert their own data during registration
CREATE POLICY "Students can insert their own data" ON public.students
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow students to update their own data
CREATE POLICY "Students can update their own data" ON public.students
    FOR UPDATE
    USING (auth.uid() = id);

-- Allow admins full access to students
CREATE POLICY "Admins can manage all student data" ON public.students
    FOR ALL
    USING (
        auth.jwt()->>'role' = 'super_admin' OR 
        EXISTS (
            SELECT 1 FROM public.verification_admins 
            WHERE verification_admins.id = auth.uid()
        )
    );

-- Create policies for the applications table
-- Allow students to insert their own application
CREATE POLICY "Students can insert their own application" ON public.applications
    FOR INSERT
    WITH CHECK (auth.uid() = student_id::uuid);

-- Allow students to view their own application
CREATE POLICY "Students can view their own application" ON public.applications
    FOR SELECT
    USING (auth.uid() = student_id::uuid);

-- Allow students to update their own application
CREATE POLICY "Students can update their own application" ON public.applications
    FOR UPDATE
    USING (auth.uid() = student_id::uuid);

-- Allow admins full access to applications
CREATE POLICY "Admins can manage all applications" ON public.applications
    FOR ALL
    USING (
        auth.jwt()->>'role' = 'super_admin' OR 
        EXISTS (
            SELECT 1 FROM public.verification_admins 
            WHERE verification_admins.id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.applications TO authenticated;

-- Create a function to handle student registration
CREATE OR REPLACE FUNCTION public.handle_student_registration()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow the insert if the user is registering themselves
    IF NEW.id = auth.uid() THEN
        RETURN NEW;
    END IF;
    
    -- Allow the insert if the user is an admin
    IF EXISTS (
        SELECT 1 
        FROM auth.jwt() 
        WHERE jwt->>'role' = 'super_admin'
    ) THEN
        RETURN NEW;
    END IF;
    
    -- Otherwise, deny the insert
    RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS handle_student_registration_trigger ON public.students;
CREATE TRIGGER handle_student_registration_trigger
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION handle_student_registration();

-- Function to initialize user metadata on sign-up
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Set the role as 'student' for new users
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object('role', 'student')
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create the trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_created(); 