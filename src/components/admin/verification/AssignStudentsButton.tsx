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

      // 1. Fetch all verification officers for this course
      const { data: officers, error: officersError } = await supabase
        .from('verification_admins')
        .select('id, email')
        .eq('course_id', courseId);
      if (officersError) throw new Error(officersError.message);
      if (!officers?.length) throw new Error(`No officers found for ${courseName}`);

      // 2. Fetch all applications for this course
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select('student_id, status')
        .eq('course_id', courseId);
      if (appsError) throw new Error(appsError.message);
      
      // Filter out students who are already verified/rejected
      const pendingStudentIds = apps
        ?.filter(app => app.status !== 'approved' && app.status !== 'rejected')
        .map(a => a.student_id) || [];
      
      if (!pendingStudentIds.length) throw new Error(`No pending applications for ${courseName}`);

      // 3. Delete existing assignments for this course
      const { error: deleteError } = await supabase
        .from('student_assignments')
        .delete()
        .eq('course_id', courseId);
      if (deleteError) throw new Error(deleteError.message);

      // 4. Distribute pending students evenly among officers
      const total = pendingStudentIds.length;
      const per = Math.floor(total / officers.length);
      const extra = total % officers.length;
      const toInsert: any[] = [];

      // Shuffle the student IDs array for random distribution
      const shuffledStudentIds = pendingStudentIds.sort(() => Math.random() - 0.5);

      for (let i = 0; i < officers.length; i++) {
        const count = i < extra ? per + 1 : per;
        const offset = i * per + Math.min(i, extra);
        for (let j = 0; j < count; j++) {
          const sid = shuffledStudentIds[offset + j];
          if (sid) {
            toInsert.push({
              student_id: sid,
              verification_officer_id: officers[i].id,
              course_id: courseId,
              assigned_at: new Date().toISOString(),
              assigned_by: localStorage.getItem('adminEmail') || 'admin'
            });
          }
        }
      }

      // 5. Bulk insert new assignments
      if (toInsert.length) {
        const { error: insertError } = await supabase
          .from('student_assignments')
          .insert(toInsert);
        if (insertError) throw new Error(insertError.message);
      }

      setSuccess({
        message: `Assigned ${toInsert.length} students`,
        stats: {
          totalStudents: total,
          officerCount: officers.length,
          baseStudentsPerOfficer: per,
          officersWithExtraStudent: extra
        }
      });
    } catch (err: any) {
      console.error('assignStudents error:', err);
      setError(err.message || 'Failed to assign');
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