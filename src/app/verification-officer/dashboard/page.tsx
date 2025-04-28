'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface StudentData {
  id: string;
  name: string;
  email: string;
}

interface ApplicationData {
  id: string;
  course_name: string;
  course_type: string;
  status: string;
}

interface Assignment {
  student_id: string;
  application_id: string;
  range_start: number;
  range_end: number;
  total_in_range: number;
  students: StudentData[];
  applications: ApplicationData[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  status: string;
  course_name: string;
  course_type: string;
  range_start: number;
  range_end: number;
}

export default function VerificationOfficerDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in as verification officer
    const verificationOfficerId = localStorage.getItem('verificationOfficerId');
    const verificationOfficerEmail = localStorage.getItem('verificationOfficerEmail');
    
    if (!verificationOfficerId || !verificationOfficerEmail) {
      router.push('/verification-officer/login');
      return;
    }

    // Set up auto-refresh interval (every 30 seconds)
    const refreshInterval = setInterval(() => {
      fetchAssignedStudents();
    }, 30000);

    fetchAssignedStudents();

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchAssignedStudents = async () => {
    try {
      setLoading(true);
      const verificationOfficerId = localStorage.getItem('verificationOfficerId');
      
      if (!verificationOfficerId) {
        throw new Error('Verification officer ID not found');
      }

      // Check session validity
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Your session has expired. Please refresh the page to log in again.');
        router.push('/verification-officer/login');
        return;
      }

      // Get assigned students from student_assignments table with proper joins
      const { data: assignments, error: assignmentError } = await supabase
        .from('student_assignments')
        .select(`
          student_id,
          application_id,
          range_start,
          range_end,
          total_in_range,
          students!inner (
            id,
            name,
            email
          ),
          applications!inner (
            id,
            course_name,
            course_type,
            status
          )
        `)
        .eq('verification_officer_id', verificationOfficerId)
        .order('created_at', { ascending: false });

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        throw assignmentError;
      }

      if (!assignments || assignments.length === 0) {
        setStudents([]);
        return;
      }

      console.log('Fetched assignments:', assignments);

      // Transform the data
      const transformedStudents: Student[] = assignments.map((assignment: Assignment) => ({
        id: assignment.students[0]?.id || '',
        name: assignment.students[0]?.name || '',
        email: assignment.students[0]?.email || '',
        status: assignment.applications[0]?.status || '',
        course_name: assignment.applications[0]?.course_name || '',
        course_type: assignment.applications[0]?.course_type || '',
        range_start: assignment.range_start,
        range_end: assignment.range_end
      }));

      console.log('Transformed students:', transformedStudents);
      setStudents(transformedStudents);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      toast.error('Failed to fetch assigned students');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAssignedStudents();
  };

  const handleViewDetails = (studentId: string) => {
    router.push(`/verification-officer/student/${studentId}`);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Assigned Students
            </h1>
            {students.length > 0 && (
              <p className="text-gray-600 mt-1">
                Managing students {students[0].range_start} to {students[0].range_end}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course Type</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No students assigned.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.course_type}</TableCell>
                    <TableCell>{student.course_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(student.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 