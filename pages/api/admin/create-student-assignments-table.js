import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // SQL to create the student_assignments table
    const sql = `
      CREATE TABLE IF NOT EXISTS public.student_assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        student_id UUID NOT NULL,
        verification_officer_id UUID NOT NULL,
        course_id VARCHAR NOT NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_by VARCHAR,
        UNIQUE(student_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_student_assignments_student_id 
      ON public.student_assignments(student_id);
      
      CREATE INDEX IF NOT EXISTS idx_student_assignments_verification_officer_id 
      ON public.student_assignments(verification_officer_id);
      
      CREATE INDEX IF NOT EXISTS idx_student_assignments_course_id 
      ON public.student_assignments(course_id);
    `;

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Error creating student_assignments table:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Error creating table: ${error.message}` 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student assignments table created or already exists'
    });
    
  } catch (error) {
    console.error('Error in create-student-assignments-table API:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    });
  }
} 