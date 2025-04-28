import { supabaseAdmin } from '@/lib/supabase';

export async function assignStudentsManually(
  courseId: string,
  verificationOfficerId: string,
  startIndex: number,
  endIndex: number
) {
  try {
    console.log('Assigning students manually:', {
      courseId,
      verificationOfficerId,
      startIndex,
      endIndex
    });

    // First, get the students for this course within the index range
    const { data: students, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, student_id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
      .range(startIndex - 1, endIndex - 1);

    if (fetchError) {
      console.error('Error fetching students:', fetchError);
      throw fetchError;
    }

    if (!students || students.length === 0) {
      console.log('No students found in the specified range');
      return { success: false, error: 'No students found in the specified range' };
    }

    console.log('Found students to assign:', students);

    // Update the verification_officer_id for these students
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ 
        verification_officer_id: verificationOfficerId,
        verification_status: 'pending'
      })
      .in('id', students.map(s => s.id));

    if (updateError) {
      console.error('Error updating students:', updateError);
      throw updateError;
    }

    return { 
      success: true, 
      message: `Successfully assigned ${students.length} students to verification officer`
    };
  } catch (error) {
    console.error('Error in manual assignment:', error);
    throw error;
  }
} 