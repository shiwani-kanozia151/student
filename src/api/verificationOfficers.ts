import { supabase } from '@/lib/supabase';

export async function getVerificationOfficers(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('verification_admins')
      .select('id, name, email')
      .eq('course_id', courseId);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching verification officers:', error);
    throw error;
  }
}

export async function assignStudentsToOfficers(courseId: string, assignments: Array<{
  startIndex: number;
  endIndex: number;
  verificationOfficerId: string;
}>) {
  try {
    // First, get all students for this course
    const { data: students, error: studentsError } = await supabase
      .from('applications')
      .select('id, student_id')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (studentsError) throw studentsError;
    if (!students) throw new Error('No students found');

    // Create assignments
    const assignmentPromises = assignments.flatMap(assignment => {
      const studentsToAssign = students.slice(assignment.startIndex - 1, assignment.endIndex);
      return studentsToAssign.map(student => ({
        student_id: student.student_id,
        verification_officer_id: assignment.verificationOfficerId,
        course_id: courseId,
        assigned_at: new Date().toISOString()
      }));
    });

    // Insert all assignments
    const { error: assignmentError } = await supabase
      .from('student_assignments')
      .upsert(assignmentPromises, {
        onConflict: 'student_id,course_id'
      });

    if (assignmentError) throw assignmentError;

    return true;
  } catch (error) {
    console.error('Error assigning students:', error);
    throw error;
  }
}

export async function getStudentCount(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('student_id')
      .eq('course_id', courseId);

    if (error) {
      throw error;
    }

    // Count unique student IDs
    const uniqueStudentIds = new Set(data?.map(app => app.student_id) || []);
    return uniqueStudentIds.size;
  } catch (error) {
    console.error('Error counting students:', error);
    throw error;
  }
} 