import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AssignStudentsButtonProps {
  courseId: string;
  courseName: string;
}

const AssignStudentsButton: React.FC<AssignStudentsButtonProps> = ({ courseId, courseName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    stats: {
      totalStudents: number;
      officerCount: number;
      baseStudentsPerOfficer: number;
      officersWithExtraStudent: number;
    } | null;
  } | null>(null);

  const assignStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Get count of verification officers for this course
      const { data: officers, error: officersError } = await supabase
        .from('verification_admins')
        .select('id, email')
        .eq('course_id', courseId);

      if (officersError) {
        throw new Error(`Error checking verification officers: ${officersError.message}`);
      }

      if (!officers || officers.length === 0) {
        throw new Error(`No verification officers found for ${courseName}. Please add at least one verification officer before assigning students.`);
      }

      // Directly implement the assignment logic in the component:

      // 1. Create the student_assignments table if it doesn't exist
      try {
        // Check if the table exists by attempting to select from it
        await supabase.from('student_assignments').select('id').limit(1);
      } catch (error) {
        // If the table doesn't exist, create it
        if (error.message.includes('does not exist')) {
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
            const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
            if (sqlError) throw sqlError;
          } catch (rpcError) {
            console.error('Table creation error:', rpcError);
            throw new Error(`Failed to create student_assignments table: ${rpcError.message}`);
          }
        } else {
          throw error;
        }
      }
      
      // 2. Get all applications for this course
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('student_id, course_id, course_name, course_type')
        .eq('course_id', courseId);
      
      if (appError) {
        throw new Error(`Error fetching applications: ${appError.message}`);
      }
      
      if (!applications || applications.length === 0) {
        throw new Error(`No applications found for ${courseName}.`);
      }
      
      // 3. Get student details from these applications
      const studentIds = applications.map(app => app.student_id);
      
      const { data: students, error: studentError } = await supabase
        .from('students')
        .select('id, name, email')
        .in('id', studentIds);
      
      if (studentError) {
        throw new Error(`Error fetching students: ${studentError.message}`);
      }
      
      if (!students || students.length === 0) {
        throw new Error(`No student records found for the applications.`);
      }
      
      // 4. Create combined student records with their applications
      const courseStudents = students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        applications: applications.filter(app => app.student_id === student.id)
      }));
      
      // 5. Delete existing assignments for this course
      const { error: deleteError } = await supabase
        .from('student_assignments')
        .delete()
        .eq('course_id', courseId);
      
      if (deleteError && !deleteError.message.includes('does not exist')) {
        throw new Error(`Error clearing existing assignments: ${deleteError.message}`);
      }
      
      // 6. Distribute students among verification officers
      const officerCount = officers.length;
      const studentsPerOfficer = Math.floor(courseStudents.length / officerCount);
      const extraStudents = courseStudents.length % officerCount;
      
      const assignmentsToInsert = [];
      
      for (let i = 0; i < officerCount; i++) {
        // Calculate how many students this officer gets
        const studentCount = i < extraStudents ? studentsPerOfficer + 1 : studentsPerOfficer;
        
        // Determine which students to assign
        const startIndex = i < extraStudents 
          ? i * (studentsPerOfficer + 1) 
          : (extraStudents * (studentsPerOfficer + 1)) + ((i - extraStudents) * studentsPerOfficer);
        
        // Create assignments for each student
        for (let j = 0; j < studentCount; j++) {
          const studentIndex = startIndex + j;
          if (studentIndex < courseStudents.length) {
            assignmentsToInsert.push({
              student_id: courseStudents[studentIndex].id,
              verification_officer_id: officers[i].id,
              course_id: courseId,
              assigned_at: new Date().toISOString(),
              assigned_by: 'system'
            });
          }
        }
      }
      
      // 7. Insert the new assignments
      if (assignmentsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('student_assignments')
          .insert(assignmentsToInsert);
          
        if (insertError) {
          throw new Error(`Error creating assignments: ${insertError.message}`);
        }
      } else {
        throw new Error("No student assignments could be created.");
      }
      
      // 8. Set success response
      setSuccess({
        message: `Successfully assigned ${assignmentsToInsert.length} students to ${officers.length} verification officers`,
        stats: {
          totalStudents: courseStudents.length,
          officerCount: officerCount,
          baseStudentsPerOfficer: studentsPerOfficer,
          officersWithExtraStudent: extraStudents
        }
      });
    } catch (err: any) {
      console.error('Error assigning students:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={assignStudents} 
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Assigning Students...
          </>
        ) : (
          'Distribute Students to Verification Officers'
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p>{success.message}</p>
            {success.stats && (
              <div className="text-sm">
                <p>Total Students: {success.stats.totalStudents}</p>
                <p>Number of Verification Officers: {success.stats.officerCount}</p>
                <p>Base Students Per Officer: {success.stats.baseStudentsPerOfficer}</p>
                <p>Officers With Extra Student: {success.stats.officersWithExtraStudent}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AssignStudentsButton; 