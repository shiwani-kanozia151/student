import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { getVerificationOfficers } from '@/app/api/admin/verification-officers';
import { assignStudentsManually } from '@/app/api/admin/assign-students/manual';
import { supabase } from '@/lib/supabase';

interface AssignStudentsButtonProps {
  courseId: string;
  courseName: string;
}

interface VerificationOfficer {
  id: string;
  email: string;
  course_id: string;
  course_name: string;
}

interface Assignment {
  officerEmail: string;
  startIndex: number;
  endIndex: number;
  timestamp: Date;
}

const AssignStudentsButton: React.FC<AssignStudentsButtonProps> = ({ courseId, courseName }) => {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [verificationOfficers, setVerificationOfficers] = useState<VerificationOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [startIndex, setStartIndex] = useState('');
  const [endIndex, setEndIndex] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  const fetchTotalStudents = async () => {
    try {
      // First get all students with their applications for this course
      const { data, error } = await supabase
        .from('applications')
        .select('student_id', { count: 'exact' })
        .eq('course_id', courseId);

      if (error) throw error;

      console.log('Total students query result:', { data, count: data?.length });
      setTotalStudents(data?.length || 0);
    } catch (error) {
      console.error('Error fetching total students:', error);
      toast.error('Failed to fetch total students count');
    }
  };

  const fetchVerificationOfficers = async () => {
    try {
      console.log('Fetching verification officers for course:', courseId);
      const officers = await getVerificationOfficers(courseId);
      console.log('Received verification officers:', officers);
      const transformedOfficers: VerificationOfficer[] = officers.map(officer => ({
        id: officer.id,
        email: officer.email,
        course_id: courseId,
        course_name: courseName
      }));
      setVerificationOfficers(transformedOfficers);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching verification officers:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch verification officers');
      toast.error('Failed to fetch verification officers');
    }
  };

  useEffect(() => {
    if (isOpen && courseId) {
      fetchVerificationOfficers();
      fetchTotalStudents();
    }
  }, [isOpen, courseId]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedOfficer('');
    setStartIndex('');
    setEndIndex('');
    setFetchError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficer || !startIndex || !endIndex) {
      toast.error('Please fill in all fields');
      return;
    }

    const start = parseInt(startIndex);
    const end = parseInt(endIndex);

    if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
      toast.error('Please enter valid start and end indices');
      return;
    }

    if (start < 1 || end > totalStudents) {
      toast.error(`Please enter indices between 1 and ${totalStudents}`);
      return;
    }

    setLoading(true);
    try {
      const result = await assignStudentsManually(
        courseId,
        selectedOfficer,
        start,
        end
      );

      if (result.success) {
        const officer = verificationOfficers.find(o => o.id === selectedOfficer);
        if (officer) {
          const newAssignment: Assignment = {
            officerEmail: officer.email,
            startIndex: start,
            endIndex: end,
            timestamp: new Date()
          };
          setAssignments(prev => [newAssignment, ...prev]);

          toast.success(
            <div className="space-y-2">
              <p>Students assigned successfully!</p>
              <p className="text-sm">
                Officer: {officer.email}<br />
                Range: {start} to {end} of {totalStudents} students
              </p>
            </div>
          );
        }
        handleClose();
      } else {
        toast.error(result.error || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Error assigning students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div>
        <Button 
          onClick={handleOpen}
          className="bg-blue-900 text-white hover:bg-blue-800"
        >
          Manual Assignment
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Manual Assignment</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Verification Officer
                </label>
                {fetchError ? (
                  <div className="text-red-500 text-sm mb-2">{fetchError}</div>
                ) : verificationOfficers.length === 0 ? (
                  <div className="text-gray-500 text-sm mb-2">No verification officers found for this course</div>
                ) : (
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose an officer</option>
                    {verificationOfficers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  Total students in this course: {totalStudents}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Index (1-{totalStudents})
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={totalStudents}
                    value={startIndex}
                    onChange={(e) => setStartIndex(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Index (1-{totalStudents})
                  </label>
                  <Input
                    type="number"
                    min={startIndex || 1}
                    max={totalStudents}
                    value={endIndex}
                    onChange={(e) => setEndIndex(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedOfficer || !startIndex || !endIndex || verificationOfficers.length === 0}
                  className="bg-blue-900 text-white hover:bg-blue-800 px-6"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Students'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length > 0 && (
        <div className="mt-8 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assignment History</h2>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2"
              onClick={fetchVerificationOfficers}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          <div className="space-y-2">
            {assignments.map((assignment, index) => {
              const officer = verificationOfficers.find(o => o.email === assignment.officerEmail);
              return (
                <div key={index} className="flex items-center justify-between py-3 px-4 bg-white rounded-sm hover:bg-gray-50 border">
                  <div className="text-blue-900 font-medium">
                    {officer?.email || assignment.officerEmail}
                  </div>
                  <div className="flex items-center gap-8">
                    <span className="text-gray-600">
                      Students {assignment.startIndex} - {assignment.endIndex} of {totalStudents}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(assignment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignStudentsButton; 