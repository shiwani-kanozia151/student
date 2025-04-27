import { supabase } from './supabase';

export interface VerificationOfficer {
  id: string;
  name: string;
  email: string;
}

export interface AssignmentRange {
  startIndex: number;
  endIndex: number;
  verificationOfficerId: string;
}

export async function getVerificationOfficers(courseId: string): Promise<VerificationOfficer[]> {
  try {
    console.log('Fetching verification officers for course:', courseId);
    
    const { data, error } = await supabase
      .from('verification_admins')
      .select('id, email, course_id, course_name')
      .eq('course_id', courseId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Raw data from database:', data);

    // Transform the data to match our interface
    return (data || []).map(officer => ({
      id: officer.id,
      name: officer.email.split('@')[0], // Using email username as name since we don't have a separate name field
      email: officer.email
    }));
  } catch (error) {
    console.error('Error in getVerificationOfficers:', error);
    throw new Error('Failed to fetch verification officers');
  }
}

export async function getStudentCount(courseId: string): Promise<number> {
  try {
    console.log('Getting student count for course:', courseId);
    
    // First get all student IDs from applications for this course
    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('student_id')
      .eq('course_id', courseId)
      .eq('status', 'pending');

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      throw applicationsError;
    }

    console.log('Found applications:', applications);

    if (!applications || applications.length === 0) {
      console.log('No applications found for course:', courseId);
      return 0;
    }

    // Get the student IDs array
    const studentIds = applications.map(app => app.student_id);
    console.log('Student IDs to fetch:', studentIds);

    // Now get the actual students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      throw studentsError;
    }

    console.log('Found students:', students);
    return students?.length || 0;
  } catch (error) {
    console.error('Error getting student count:', error);
    throw new Error('Failed to get student count');
  }
}

export async function assignStudentsToOfficers(courseId: string, assignments: AssignmentRange[]): Promise<void> {
  try {
    // Begin a batch operation
    for (const assignment of assignments) {
      // Get students within the range
      const { data: students, error: studentsError } = await supabase
        .from('applications')
        .select('id, student_id')
        .eq('course_id', courseId)
        .eq('status', 'pending')
        .range(assignment.startIndex - 1, assignment.endIndex - 1)
        .order('created_at');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }
      
      if (!students || students.length === 0) {
        console.log('No students found in range:', assignment);
        continue;
      }

      console.log('Found students to assign:', students);

      // Create assignment records
      const assignmentRecords = students.map(student => ({
        student_id: student.student_id,
        verification_officer_id: assignment.verificationOfficerId,
        course_id: courseId,
        assigned_at: new Date().toISOString()
      }));

      // Insert assignments
      const { error: assignmentError } = await supabase
        .from('student_assignments')
        .upsert(assignmentRecords, {
          onConflict: 'student_id,course_id'
        });

      if (assignmentError) {
        console.error('Error creating assignments:', assignmentError);
        throw assignmentError;
      }
    }
  } catch (error) {
    console.error('Error assigning students:', error);
    throw new Error('Failed to assign students');
  }
} 