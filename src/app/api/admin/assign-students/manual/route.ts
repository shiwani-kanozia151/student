import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { courseId, verificationOfficerId, startIndex, endIndex } = await request.json();

    if (!courseId || !verificationOfficerId || !startIndex || !endIndex) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // First, get all students for this course ordered by creation date
    const { data: allStudents, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        student_id,
        created_at,
        course_id,
        course_name,
        course_type,
        status
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!allStudents || allStudents.length === 0) {
      return NextResponse.json(
        { error: 'No students found for this course' },
        { status: 404 }
      );
    }

    // Validate the range
    if (startIndex < 1 || endIndex > allStudents.length) {
      return NextResponse.json(
        { 
          error: `Invalid range. Please specify a range between 1 and ${allStudents.length}`,
          totalStudents: allStudents.length 
        },
        { status: 400 }
      );
    }

    // Get the students within the specified range (1-based indexing)
    const selectedStudents = allStudents.slice(startIndex - 1, endIndex);

    if (selectedStudents.length === 0) {
      return NextResponse.json(
        { error: 'No students found in the specified range' },
        { status: 404 }
      );
    }

    // Check if any students in the range are already assigned to other officers
    const selectedStudentIds = selectedStudents.map(s => s.student_id);

    const { data: existingAssignments, error: checkError } = await supabase
      .from('student_assignments')
      .select('student_id, verification_officer_id')
      .in('student_id', selectedStudentIds)
      .neq('verification_officer_id', verificationOfficerId);

    if (checkError) {
      throw checkError;
    }

    if (existingAssignments && existingAssignments.length > 0) {
      return NextResponse.json({
        error: 'Some students in this range are already assigned to other verification officers',
        conflictingAssignments: existingAssignments
      }, { status: 409 });
    }

    // Begin transaction
    const { error: beginError } = await supabase.rpc('begin_transaction');
    if (beginError) throw beginError;

    try {
      // Delete any existing assignments for these students
      const { error: deleteError } = await supabase
        .from('student_assignments')
        .delete()
        .in('student_id', selectedStudentIds)
        .eq('verification_officer_id', verificationOfficerId);

      if (deleteError) throw deleteError;

      // Create assignments in the student_assignments table
      const assignments = selectedStudents.map((student) => ({
        student_id: student.student_id,
        verification_officer_id: verificationOfficerId,
        course_id: courseId,
        assigned_at: new Date().toISOString(),
        status: 'pending',
        range_start: startIndex,
        range_end: endIndex,
        total_in_range: endIndex - startIndex + 1,
        application_id: student.id, // Add application_id to link with the application
        course_name: student.course_name,
        course_type: student.course_type
      }));

      // Insert new assignments
      const { error: insertError } = await supabase
        .from('student_assignments')
        .insert(assignments);

      if (insertError) throw insertError;

      // Commit the transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

      return NextResponse.json({
        success: true,
        message: `Successfully assigned ${selectedStudents.length} students to verification officer`,
        assignedRange: {
          start: startIndex,
          end: endIndex,
          total: selectedStudents.length
        },
        totalStudents: allStudents.length,
        assignedStudents: selectedStudents.map(s => ({
          student_id: s.student_id,
          application_id: s.id,
          course_name: s.course_name
        }))
      });
    } catch (error) {
      // Rollback the transaction on any error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Error assigning students:', error);
    return NextResponse.json(
      { error: 'Failed to assign students' },
      { status: 500 }
    );
  }
} 