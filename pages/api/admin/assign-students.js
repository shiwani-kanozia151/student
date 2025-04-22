import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ error: 'Missing course_id' });
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. First create the student_assignments table if it doesn't exist
    await createStudentAssignmentsTable(supabase);

    // 2. Get all applications for this course first
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('student_id, course_id, course_name, course_type')
      .eq('course_id', course_id);
      
    if (appError) {
      console.error('Error fetching applications:', appError);
      return res.status(500).json({ error: `Error fetching applications: ${appError.message}` });
    }
    
    if (!applications || applications.length === 0) {
      return res.status(200).json({ message: 'No applications found for this course' });
    }
    
    // 3. Get student details for these applications
    const studentIds = applications.map(app => app.student_id);
    
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, name, email')
      .in('id', studentIds);
      
    if (studentError) {
      console.error('Error fetching students:', studentError);
      return res.status(500).json({ error: `Error fetching students: ${studentError.message}` });
    }
    
    if (!students || students.length === 0) {
      return res.status(200).json({ message: 'No students found for the applications' });
    }
    
    // 4. Create student records with their applications
    const courseStudents = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      applications: applications.filter(app => app.student_id === student.id)
    }));

    // 5. Get all verification officers for this course
    const { data: verificationOfficers, error: officersError } = await supabase
      .from('verification_admins')
      .select('id, email, course_id')
      .eq('course_id', course_id);

    if (officersError) {
      return res.status(500).json({ error: `Error fetching verification officers: ${officersError.message}` });
    }

    if (!verificationOfficers || verificationOfficers.length === 0) {
      return res.status(400).json({ error: 'No verification officers found for this course' });
    }

    // 6. Delete existing assignments for this course
    const { error: deleteError } = await supabase
      .from('student_assignments')
      .delete()
      .eq('course_id', course_id);

    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.error('Error deleting existing assignments:', deleteError);
      return res.status(500).json({ error: `Error clearing existing assignments: ${deleteError.message}` });
    }

    // 7. Distribute students among verification officers
    const assignmentsToInsert = [];
    const officerCount = verificationOfficers.length;
    const studentsPerOfficer = Math.floor(courseStudents.length / officerCount);
    const extraStudents = courseStudents.length % officerCount;

    for (let i = 0; i < officerCount; i++) {
      // Calculate how many students this officer gets
      const studentCount = i < extraStudents ? studentsPerOfficer + 1 : studentsPerOfficer;
      
      // Determine which students to assign (based on position in the array)
      const startIndex = i < extraStudents 
        ? i * (studentsPerOfficer + 1) 
        : (extraStudents * (studentsPerOfficer + 1)) + ((i - extraStudents) * studentsPerOfficer);
      
      // Create assignment records for each student
      for (let j = 0; j < studentCount; j++) {
        const studentIndex = startIndex + j;
        if (studentIndex < courseStudents.length) {
          assignmentsToInsert.push({
            student_id: courseStudents[studentIndex].id,
            verification_officer_id: verificationOfficers[i].id,
            course_id: course_id,
            assigned_at: new Date().toISOString(),
            assigned_by: 'system'
          });
        }
      }
    }

    // 8. Insert the new assignments
    if (assignmentsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('student_assignments')
        .insert(assignmentsToInsert);

      if (insertError) {
        console.error('Error creating assignments:', insertError);
        return res.status(500).json({ error: `Error creating assignments: ${insertError.message}` });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${assignmentsToInsert.length} students to ${verificationOfficers.length} verification officers`,
      stats: {
        totalStudents: courseStudents.length,
        officerCount: officerCount,
        baseStudentsPerOfficer: studentsPerOfficer,
        officersWithExtraStudent: extraStudents
      }
    });
  } catch (error) {
    console.error('Error in assign-students API:', error);
    return res.status(500).json({ error: `Server error: ${error.message}` });
  }
}

async function createStudentAssignmentsTable(supabase) {
  try {
    // Try to select from the table to check if it exists
    await supabase.from('student_assignments').select('id').limit(1);
  } catch (error) {
    // If the table doesn't exist, create it
    if (error.message.includes('relation "student_assignments" does not exist')) {
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
      
      try {
        await supabase.rpc('exec_sql', { sql_query: sql });
      } catch (rpcError) {
        console.error('RPC error, trying direct SQL instead:', rpcError);
        // For direct SQL execution, you might need a service role key
        // This is a fallback and might not work without proper permissions
      }
    }
  }
} 