-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    department TEXT NOT NULL,
    course TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    status TEXT DEFAULT 'pending'::text,
    remarks TEXT
);

-- Create verification_admins table
CREATE TABLE IF NOT EXISTS public.verification_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create student_assignments table
CREATE TABLE IF NOT EXISTS public.student_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    verification_admin_id UUID REFERENCES public.verification_admins(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id)
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending'::text,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create student_documents table
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Students table policies
CREATE POLICY "Enable read access for all users" ON public.students
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.students
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for verification officers" ON public.students
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT verification_admin_id 
            FROM public.student_assignments 
            WHERE student_id = students.id
        )
        OR 
        auth.jwt()->>'role' = 'super_admin'
    );

-- Verification admins policies
CREATE POLICY "Enable read access for all users" ON public.verification_admins
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for super admin" ON public.verification_admins
    USING (auth.jwt()->>'role' = 'super_admin');

-- Student assignments policies
CREATE POLICY "Enable read access for all users" ON public.student_assignments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert/update for super admin" ON public.student_assignments
    USING (auth.jwt()->>'role' = 'super_admin');

-- Applications policies
CREATE POLICY "Enable read access for all users" ON public.applications
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.applications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for verification officers" ON public.applications
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT verification_admin_id 
            FROM public.student_assignments 
            WHERE student_id = applications.student_id
        )
        OR 
        auth.jwt()->>'role' = 'super_admin'
    );

-- Student documents policies
CREATE POLICY "Enable read for own documents" ON public.student_documents
    FOR SELECT USING (
        auth.uid()::text = student_id::text
        OR
        auth.uid() IN (
            SELECT verification_admin_id 
            FROM public.student_assignments 
            WHERE student_id = student_documents.student_id
        )
        OR 
        auth.jwt()->>'role' = 'super_admin'
    );

CREATE POLICY "Enable insert for own documents" ON public.student_documents
    FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS students_email_idx ON public.students(email);
CREATE INDEX IF NOT EXISTS verification_admins_email_idx ON public.verification_admins(email);
CREATE INDEX IF NOT EXISTS student_assignments_student_id_idx ON public.student_assignments(student_id);
CREATE INDEX IF NOT EXISTS student_assignments_verification_admin_id_idx ON public.student_assignments(verification_admin_id);

-- Set up triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verification_admins_updated_at
    BEFORE UPDATE ON public.verification_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_assignments_updated_at
    BEFORE UPDATE ON public.student_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_documents_updated_at
    BEFORE UPDATE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 