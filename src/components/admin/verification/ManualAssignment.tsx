'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Alert } from '../../ui/alert';
import { toast } from 'react-hot-toast';

interface ManualAssignmentProps {
  courseId: string;
  courseName: string;
}

interface VerificationOfficer {
  id: string;
  email: string;
  name: string;
}

interface Assignment {
  officerId: string;
  officerEmail: string;
  startIndex: number;
  endIndex: number;
}

interface VerificationAdminRow {
  id: string;
  email: string;
  admin_name: string | null;
  course_id: string;
}

interface ApplicationRow {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
}

const ManualAssignment = ({ courseId, courseName }: ManualAssignmentProps) => {
  const [verificationOfficers, setVerificationOfficers] = useState<VerificationOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [startIndex, setStartIndex] = useState('1');
  const [endIndex, setEndIndex] = useState('10');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetchVerificationOfficers();
  }, [courseId]);

  const fetchVerificationOfficers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('verification_admins')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No verification officers found for this course');
      }

      const officers: VerificationOfficer[] = (data as VerificationAdminRow[]).map(officer => ({
        id: officer.id,
        email: officer.email,
        name: officer.admin_name || officer.email
      }));

      setVerificationOfficers(officers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch verification officers';
      setError(errorMessage);
      console.error('Error fetching officers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async () => {
    setError('');
    setSuccess(false);

    if (!selectedOfficer) {
      setError('Please select a verification officer');
      return;
    }

    const start = parseInt(startIndex);
    const end = parseInt(endIndex);

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
      setError('Please enter valid start and end indices');
      return;
    }

    try {
      setAssigning(true);

      const { data: students, error: studentsError } = await supabase
        .from('applications')
        .select('id, student_id')
        .eq('course_id', courseId)
        .eq('status', 'pending')
        .range(start - 1, end - 1);

      if (studentsError) throw studentsError;
      
      if (!students || students.length === 0) {
        throw new Error('No students found in the selected range');
      }

      // First, delete any existing assignments for these students in this course
      const studentIds = (students as ApplicationRow[]).map(student => student.student_id);
      const { error: deleteError } = await supabase
        .from('student_assignments')
        .delete()
        .eq('course_id', courseId)
        .in('student_id', studentIds);

      if (deleteError) throw deleteError;

      // Now create the new assignments
      const assignments = (students as ApplicationRow[]).map(student => ({
        student_id: student.student_id,
        verification_officer_id: selectedOfficer,
        course_id: courseId,
        assigned_at: new Date().toISOString(),
        assigned_by: 'manual'
      }));

      const { error: assignError } = await supabase
        .from('student_assignments')
        .insert(assignments);

      if (assignError) throw assignError;

      const officer = verificationOfficers.find(o => o.id === selectedOfficer);
      setAssignments(prev => [...prev, {
        officerId: selectedOfficer,
        officerEmail: officer?.email || 'Unknown',
        startIndex: start,
        endIndex: end
      }]);

      setSuccess(true);
      setSelectedOfficer('');
      setStartIndex((end + 1).toString());
      setEndIndex((end + 10).toString());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign students';
      setError(errorMessage);
      console.error('Error assigning students:', err);
    } finally {
      setAssigning(false);
    }
  };

  if (loading && verificationOfficers.length === 0) {
    return <div>Loading verification officers...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Manual Assignment - {courseName}</h3>
      
      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <p>Students assigned successfully!</p>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Verification Officer
          </label>
          <Select 
            value={selectedOfficer} 
            onValueChange={(value) => setSelectedOfficer(value)}
            disabled={loading || assigning}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an officer" />
            </SelectTrigger>
            <SelectContent>
              {verificationOfficers.map((officer) => (
                <SelectItem key={officer.id} value={officer.id}>
                  {officer.name} ({officer.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Index
            </label>
            <Input
              type="number"
              min="1"
              value={startIndex}
              onChange={(e) => setStartIndex(e.target.value)}
              disabled={loading || assigning}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              End Index
            </label>
            <Input
              type="number"
              min={startIndex}
              value={endIndex}
              onChange={(e) => setEndIndex(e.target.value)}
              disabled={loading || assigning}
            />
          </div>
        </div>

        <Button 
          onClick={handleAssignment} 
          disabled={loading || assigning || !selectedOfficer}
        >
          {assigning ? 'Assigning...' : 'Assign Students'}
        </Button>
      </div>

      {assignments.length > 0 && (
        <div className="mt-8">
          <h4 className="text-md font-medium mb-4">Recent Assignments</h4>
          <div className="space-y-2">
            {assignments.map((assignment, index) => (
              <div key={index} className="text-sm">
                Assigned students {assignment.startIndex}-{assignment.endIndex} to {assignment.officerEmail}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualAssignment; 