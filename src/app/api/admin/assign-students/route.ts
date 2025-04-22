import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { course_id } = await request.json();

    if (!course_id) {
      return NextResponse.json(
        { error: 'Missing course_id' },
        { status: 400 }
      );
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. First create the student_assignments table if it doesn't exist
    await createStudentAssignmentsTable(supabase);

    // 2. Get all students for the specified course
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select(`
        id,
        applications (
          course_id,
          course_name,
          course_type
        )
      `)
      .eq('applications.course_id', course_id);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json(
        { error: `Error fetching students: ${studentsError.message}` },
        { status: 500 }
      );
    }

    // Alternative approach in case the join doesn't work
    let courseStudents = students || [];
    
    if (!students || students.length === 0) {
      // First get all applications for this course
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('student_id, course_id, course_name, course_type')
        .eq('course_id', course_id);
        
      if (appError) {
        console.error('Error fetching applications:', appError);
        return NextResponse.json(
          { error: `Error fetching applications: ${appError.message}` },
          { status: 500 }
        );
      }
      
      if (!applications || applications.length === 0) {
        return NextResponse.json(
          { message: 'No applications found for this course' },
          { status: 200 }
        );
      }
      
      // Then get all student IDs
      const studentIds = applications.map(app => app.student_id);
      
      // Fetch student details
      const { data: studentDetails, error: detailsError } = await supabase
        .from('students')
        .select('id')
        .in('id', studentIds);
        
      if (detailsError) {
        console.error('Error fetching student details:', detailsError);
        return NextResponse.json(
          { error: `Error fetching student details: ${detailsError.message}` },
          { status: 500 }
        );
      }
      
      // Create a combined student record with application details
      courseStudents = studentDetails.map(student => ({
        id: student.id,
        applications: applications.filter(app => app.student_id === student.id)
      }));
      
      if (courseStudents.length === 0) {
        return NextResponse.json(
          { message: 'No students found for this course' },
          { status: 200 }
        );
      }
    }
    
    // Filter to only include students who applied for this course
    // and have complete course details
    const filteredCourseStudents = courseStudents.filter(student => 
      student.applications && 
      student.applications.some((app: any) => 
        app.course_id === course_id && 
        app.course_name && 
        app.course_type
      )
    );

    if (filteredCourseStudents.length === 0) {
      return NextResponse.json(
        { message: 'No students found for this course' },
        { status: 200 }
      );
    }

    // 3. Get all verification officers for this course
    const { data: verificationOfficers, error: officersError } = await supabase
      .from('verification_admins')
      .select('id, email, course_id')
      .eq('course_id', course_id);

    if (officersError) {
      return NextResponse.json(
        { error: `Error fetching verification officers: ${officersError.message}` },
        { status: 500 }
      );
    }

    if (!verificationOfficers || verificationOfficers.length === 0) {
      return NextResponse.json(
        { error: 'No verification officers found for this course' },
        { status: 400 }
      );
    }

    // 4. Delete existing assignments for this course
    const { error: deleteError } = await supabase
      .from('student_assignments')
      .delete()
      .eq('course_id', course_id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Error clearing existing assignments: ${deleteError.message}` },
        { status: 500 }
      );
    }

    // 5. Distribute students among verification officers
    const assignmentsToInsert = [];
    const officerCount = verificationOfficers.length;
    const studentsPerOfficer = Math.floor(filteredCourseStudents.length / officerCount);
    const extraStudents = filteredCourseStudents.length % officerCount;

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
        if (studentIndex < filteredCourseStudents.length) {
          assignmentsToInsert.push({
            student_id: filteredCourseStudents[studentIndex].id,
            verification_officer_id: verificationOfficers[i].id,
            course_id: course_id,
            assigned_at: new Date().toISOString(),
            assigned_by: 'system' // or you could pass in the admin email who triggered this
          });
        }
      }
    }

    // 6. Insert the new assignments
    if (assignmentsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('student_assignments')
        .insert(assignmentsToInsert);

      if (insertError) {
        return NextResponse.json(
          { error: `Error creating assignments: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignmentsToInsert.length} students to ${verificationOfficers.length} verification officers`,
      stats: {
        totalStudents: filteredCourseStudents.length,
        officerCount: officerCount,
        baseStudentsPerOfficer: studentsPerOfficer,
        officersWithExtraStudent: extraStudents
      }
    });
  } catch (error: any) {
    console.error('Error in assign-students API:', error);
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

async function createStudentAssignmentsTable(supabase: any) {
  try {
    // Try to select from the table to check if it exists
    await supabase.from('student_assignments').select('id').limit(1);
  } catch (error: any) {
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
      
      await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
        // If RPC fails, try via REST API
        await fetch('/api/admin/create-student-assignments-table', {
          method: 'POST'
        });
      });
    }
  }
} 