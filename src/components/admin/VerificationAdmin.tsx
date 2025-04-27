'use client';

import * as React from "react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { cn } from "../../lib/utils";
import { Check, ChevronDown, ChevronUp, Eye, RefreshCw, Search, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import ManualAssignment from './verification/ManualAssignment';
import { sendStatusEmail } from "../../lib/emailService";

interface Document {
  id?: string;
  type: string;
  url: string;
  name?: string;
  uploaded_at?: string;
  student_id?: string;
  application_id?: string;
}

interface StatusHistoryItem {
  status: string;
  changed_at: string;
  changed_by?: string;
  remarks?: string;
  document_verification?: {
    photo: boolean;
    signature: boolean;
    caste_certificate: boolean;
    tenth_marksheet: boolean;
    twelfth_marksheet: boolean;
    entrance_scorecard: boolean;
    ug_marksheet?: boolean;
    pg_marksheet?: boolean;
  };
}

interface ApplicationStudent {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  department?: string;
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  document_verification?: any;
  remarks?: string;
  student_documents: Document[];
}

interface Application {
  id: string;
  student_id: string;
  personal_details: any;
  academic_details: any;
  course_id: string;
  course_type: string;
  course_name: string;
  status: string;
  remarks?: string;
  status_history: StatusHistoryItem[];
  document_verification: any;
  created_at: string;
  students: ApplicationStudent[];
}

interface AcademicDetails {
  tenth: {
    percentage?: number;
    year?: string;
    board?: string;
  };
  twelfth: {
    percentage?: number;
    year?: string;
    board?: string;
  };
  graduation: {
    percentage?: number;
    year?: string;
    university?: string;
    course?: string;
  };
  entrance_score?: number;
}

interface BaseStudent {
  id: string;
  created_at: string;
  name: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  department?: string | null;
  admin_remarks?: string | null;
  document_verification?: Record<string, boolean>;
}

interface StudentResponse extends BaseStudent {
  is_verified: boolean;
  updated_at?: string | null;
  gender?: string | null;
  dob?: string | null;
  nationality?: string | null;
  registration_number?: string | null;
  batch_year?: string | null;
  course_id?: string;
  course_name?: string;
  status?: string;
}

interface Student extends BaseStudent {
  status: 'pending' | 'approved' | 'rejected';
  documents: Document[];
  status_history: StatusHistoryItem[];
  academic_details?: AcademicDetails;
  course_id: string | null;
  course_name: string | null;
  course_type: string | null;
  course_level: string | null;
  personal_details?: {
    dob?: string | null;
    gender?: string | null;
    nationality?: string | null;
    category?: string | null;
    father_name?: string | null;
    mother_name?: string | null;
    address?: string | null;
    contact_number?: string | null;
  };
  applications?: Array<{
    id: string;
    course_id: string;
    course_name: string;
    course_type?: string;
    course_level?: string;
    status: string;
    remarks?: string;
    document_verification?: Record<string, boolean>;
    personal_details?: Record<string, any>;
    academic_details?: AcademicDetails;
    status_history?: StatusHistoryItem[];
  }>;
}

interface ApplicationResponse {
  id: string;
  student_id: string;
  course_id: string;
  course_name: string;
  course_type: string;
  status: string;
  remarks?: string | null;
  created_at: string;
  updated_at?: string | null;
  status_history?: StatusHistoryItem[];
  document_verification?: Record<string, boolean>;
  personal_details?: Record<string, any>;
  academic_details?: AcademicDetails;
  students: StudentResponse;
}

interface StudentData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  department?: string;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  admin_remarks?: string;
  gender?: string;
  dob?: string;
  nationality?: string;
  registration_number?: string;
  batch_year?: string;
}

interface ApplicationData {
  id: string;
  course_id: string;
  course_name?: string;
  status?: string;
  remarks?: string;
  document_verification?: Record<string, any>;
  personal_details?: Record<string, any>;
  academic_details?: Record<string, any>;
  status_history?: any[];
  students: StudentData;
}

interface ProcessedStudent extends BaseStudent {
  status: 'pending' | 'approved' | 'rejected';
  documents: Document[];
  status_history: StatusHistoryItem[];
  academic_details?: AcademicDetails;
  course_id: string | null;
  course_name: string | null;
  course_type: string | null;
  course_level: string | null;
  personal_details?: {
    dob?: string | null;
    gender?: string | null;
    nationality?: string | null;
    category?: string | null;
    father_name?: string | null;
    mother_name?: string | null;
    address?: string | null;
    contact_number?: string | null;
  };
}

interface DocumentVerification {
  photo: boolean;
  signature: boolean;
  caste_certificate: boolean;
  tenth_marksheet: boolean;
  twelfth_marksheet: boolean;
  entrance_scorecard: boolean;
  ug_marksheet?: boolean;
  pg_marksheet?: boolean;
}

interface StudentDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  status?: string;
  uploaded_at?: string;
}

const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [students, setStudents] = React.useState<ProcessedStudent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<ProcessedStudent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");
  const [documentsLoading, setDocumentsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [documentVerification, setDocumentVerification] = React.useState<Record<string, boolean>>({
    photo: false,
    signature: false,
    caste_certificate: false,
    tenth_marksheet: false,
    twelfth_marksheet: false,
    entrance_scorecard: false,
    ug_marksheet: false,
    pg_marksheet: false,
  });
  const [showEmailSentPopup, setShowEmailSentPopup] = React.useState(false);
  const [emailSentTo, setEmailSentTo] = React.useState("");
  const [emailStatus, setEmailStatus] = React.useState<"pending" | "approved" | "rejected">("pending");
  const [isVerificationAdmin, setIsVerificationAdmin] = React.useState(false);
  const [verificationAdminCourseId, setVerificationAdminCourseId] = React.useState<string | null>(null);
  const [verificationAdminCourseName, setVerificationAdminCourseName] = React.useState<string | null>(null);
  const [availableCourses, setAvailableCourses] = React.useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = React.useState<string>("students");

  React.useEffect(() => {
    const adminRole = localStorage.getItem('adminRole');
    const isVerificationOfficer = localStorage.getItem('verificationOfficerEmail') !== null;
    
    // If this is a regular verification admin (super admin)
    if (adminRole === 'verification') {
      setIsVerificationAdmin(true);
      
      // Fetch all courses to allow them to select which one to manage
      const fetchCourses = async () => {
        try {
          const { data, error } = await supabase
            .from('courses')
            .select('id, name');
            
          if (error) throw error;
          
          console.log("Available courses:", data);
          
          if (data && data.length > 0) {
            setAvailableCourses([
              { id: 'all', name: 'All Courses' },
              ...data
            ]);
            // By default, select the first course
            const mca = data.find(course => course.name === "Master of Computer Application");
            if (mca) {
              console.log("Found MCA course:", mca);
              setVerificationAdminCourseId(mca.id);
              setVerificationAdminCourseName(mca.name);
            } else {
              console.log("Setting default course:", data[0]);
              setVerificationAdminCourseId(data[0].id);
              setVerificationAdminCourseName(data[0].name);
            }
          }
          
          // Immediately call fetchStudents after setting state
          // This will show all students across all courses
          fetchStudents();
        } catch (err) {
          console.error('Error fetching courses:', err);
        }
      };
      
      fetchCourses();
    } else if (isVerificationOfficer) {
      // For verification officers, course is already set in localStorage
      const courseId = localStorage.getItem('verificationOfficerCourseId');
      const courseName = localStorage.getItem('verificationOfficerCourseName');
      console.log("Setting verification officer course:", { courseId, courseName });
      setVerificationAdminCourseId(courseId);
      setVerificationAdminCourseName(courseName);
    }
  }, []);

  React.useEffect(() => {
    if (selectedStudent) {
      setDocumentVerification({
        photo: selectedStudent.document_verification?.photo || false,
        signature: selectedStudent.document_verification?.signature || false,
        caste_certificate: selectedStudent.document_verification?.caste_certificate || false,
        tenth_marksheet: selectedStudent.document_verification?.tenth_marksheet || false,
        twelfth_marksheet: selectedStudent.document_verification?.twelfth_marksheet || false,
        entrance_scorecard: selectedStudent.document_verification?.entrance_scorecard || false,
        ug_marksheet: selectedStudent.document_verification?.ug_marksheet || false,
        pg_marksheet: selectedStudent.document_verification?.pg_marksheet || false,
      });
    }
  }, [selectedStudent]);

  const getCourseCategoryLabel = (courseType?: string) => {
    switch(courseType) {
      case "UG": return "Undergraduate";
      case "PG": return "Postgraduate";
      case "Research": return "Research";
      default: return courseType || "N/A";
    }
  };

  const processStudent = (student: StudentResponse, application?: ApplicationResponse): ProcessedStudent => {
    const personalDetails = {
      dob: student.dob || null,
      gender: student.gender || null,
      nationality: student.nationality || null,
      category: application?.personal_details?.category || null,
      father_name: application?.personal_details?.father_name || null,
      mother_name: application?.personal_details?.mother_name || null,
      address: student.address || null,
      contact_number: student.phone || null,
    };

    const processedStudent: ProcessedStudent = {
      id: student.id,
      created_at: student.created_at,
      name: student.name,
      email: student.email,
      phone: student.phone || null,
      department: student.department || null,
      admin_remarks: student.admin_remarks || null,
      document_verification: student.document_verification || application?.document_verification,
      address: student.address || null,
      status: (application?.status || student.status || 'pending') as 'pending' | 'approved' | 'rejected',
      documents: [],
      status_history: application?.status_history || [],
      course_id: application?.course_id || student.course_id || null,
      course_name: application?.course_name || student.course_name || null,
      course_type: application?.course_type || null,
      course_level: null,
      academic_details: application?.academic_details || {
        tenth: {},
        twelfth: {},
        graduation: {},
        entrance_score: undefined
      },
      personal_details: personalDetails,
    };

    return processedStudent;
  };

  const fetchStudents = async () => {
    if (!verificationAdminCourseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching students for course:', verificationAdminCourseId);
      
      // First get all applications for the course
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          students (
            id,
            name,
            email,
            phone,
            address,
            department,
            is_verified,
            created_at,
            updated_at,
            admin_remarks,
            gender,
            dob,
            nationality,
            registration_number,
            batch_year
          )
        `)
        .eq('course_id', verificationAdminCourseId);

      if (applicationsError) throw applicationsError;
      
      console.log('Found applications:', applications?.length);
      
      if (!applications?.length) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Process and validate each application
      const processedStudents = applications
        .map((app: ApplicationResponse) => {
          const student = app.students;
          if (!student) {
            console.log('Application missing student data:', app.id);
            return null;
          }
          // Combine application and student data
          const processedStudent: ProcessedStudent = processStudent(student, app);

          return processedStudent;
        })
        .filter((student): student is ProcessedStudent => student !== null);

      console.log('Processed students:', processedStudents.length);
      setStudents(processedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (verificationAdminCourseId || isVerificationAdmin) {
      fetchStudents();
      
      // Set up real-time subscriptions for database changes
      const channel = supabase
        .channel("students_changes")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "students" 
          },
          fetchStudents
        )
        .subscribe();

      const applicationsChannel = supabase
        .channel("applications_changes")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "applications" 
          },
          fetchStudents
        )
        .subscribe();
      
      // Cleanup function to remove channel subscriptions on unmount
      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(applicationsChannel);
      };
    }
  }, [verificationAdminCourseId]);

  const handleStatusUpdate = async (status: "pending" | "approved" | "rejected") => {
    if (!selectedStudent) return;
  
    try {
      setIsUpdating(true);
      const remarks = adminRemarks.trim();

      if ((status === "pending" || status === "rejected") && !remarks) {
        toast.error("Please provide remarks for pending/rejected status");
        return;
      }

      const updateTime = new Date().toISOString();
      
      // Update student status with timestamp to ensure triggers fire
      const { error: studentError } = await supabase
        .from("students")
        .update({
          status,
          admin_remarks: remarks,
          is_verified: status === "approved",
          updated_at: updateTime,
          update_triggered: new Date().getTime().toString() // Add random value to ensure update triggers fire
        })
        .eq("id", selectedStudent.id);
  
      // Get the existing application to update status history
      const { data: existingApp, error: fetchError } = await supabase
        .from("applications")
        .select("status_history")
        .eq("student_id", selectedStudent.id)
        .single();
      
      if (fetchError && !fetchError.message.includes("No rows found")) {
        throw fetchError;
      }
      
      // Create new status history entry
      const newStatusEntry = {
        status,
        changed_at: updateTime,
        remarks,
        changed_by: localStorage.getItem('adminEmail') || "admin",
        document_verification: status === "approved" ? documentVerification : undefined
      };
      
      // Update application with new status and status history
      const { error: applicationError } = await supabase
        .from("applications")
        .update({
          status,
          remarks,
          updated_at: updateTime,
          status_history: existingApp?.status_history 
            ? [...existingApp.status_history, newStatusEntry]
            : [newStatusEntry],
          ...(status === "approved" && { document_verification: documentVerification }),
        })
        .eq("student_id", selectedStudent.id);
  
      if (studentError || applicationError) throw studentError || applicationError;
  
      if (selectedStudent.email) {
        await sendStatusEmail(selectedStudent.email, status, remarks);
        setEmailSentTo(selectedStudent.email);
        setEmailStatus(status);
        setShowEmailSentPopup(true);
      }
      
      setIsDetailsOpen(false);
      fetchStudents();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const viewStudentDetails = async (studentId: string) => {
    try {
      setDocumentsLoading(true);

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(`
          *,
          student_documents!student_id(
            id,
            type,
            url,
            name,
            uploaded_at,
            application_id
          ),
          applications!student_id(
            id,
            personal_details,
            academic_details,
            course_id,
            course_type,
            course_name,
            status,
            remarks,
            status_history,
            document_verification
          )
        `)
        .eq("id", studentId)
        .single();

      if (studentError) throw studentError;
      if (!studentData) {
        toast.error("Student not found");
        return;
      }

      const processedStudent = processStudent(studentData, studentData.applications?.[0] as ApplicationResponse);

      if (!processedStudent) {
        throw new Error("Invalid student data");
      }

      setSelectedStudent(processedStudent);
      setAdminRemarks(processedStudent.admin_remarks || "");
      setIsDetailsOpen(true);
    } catch (err) {
      console.error("Error loading student details:", err);
      toast.error("Failed to load student details");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (student.name?.toLowerCase().includes(search) || false) ||
      (student.email?.toLowerCase().includes(search) || false) ||
      (student.course_type?.toLowerCase().includes(search) || false) ||
      (student.course_name?.toLowerCase().includes(search) || false)
    );
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">{status}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
    }
  };

  const DocumentVerificationCheckboxes = () => {
    if (!selectedStudent) return null;

    // Base documents that are always required
    const baseDocuments = [
      { id: 'photo', label: 'Photo' },
      { id: 'signature', label: 'Signature' },
      { id: 'caste_certificate', label: 'Caste Certificate' },
      { id: 'tenth_marksheet', label: '10th Marksheet' },
      { id: 'twelfth_marksheet', label: '12th Marksheet' },
      { id: 'entrance_scorecard', label: 'Entrance Scorecard' },
    ];

    // Additional documents based on course type
    let additionalDocuments = [];
    
    if (selectedStudent.course_type === 'PG') {
      additionalDocuments.push({ id: 'ug_marksheet', label: 'UG Marksheet' });
    } else if (selectedStudent.course_type === 'Research') {
      additionalDocuments.push(
        { id: 'ug_marksheet', label: 'UG Marksheet' },
        { id: 'pg_marksheet', label: 'PG Marksheet' }
      );
    }

    // Combine all documents
    const allDocuments = [...baseDocuments, ...additionalDocuments];

    return (
      <div className="mb-6">
        <Label className="block text-sm text-gray-500 mb-3">Document Verification</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allDocuments.map((doc) => (
            <div key={doc.id} className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setDocumentVerification(prev => ({
                    ...prev,
                    [doc.id]: !prev[doc.id as keyof typeof documentVerification]
                  }));
                }}
                className={`h-5 w-5 rounded border flex items-center justify-center ${
                  documentVerification[doc.id as keyof typeof documentVerification]
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {documentVerification[doc.id as keyof typeof documentVerification] && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </button>
              <label className="text-sm text-gray-700">
                {doc.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAcademicDetails = (student: Student) => {
    if (!student.academic_details) return null;
     
    const getDisplayLabel = (key: string, section?: string) => {
      const displayKey = key === 'bboard' ? 'board' : key;
      
      // Change 'percentage' to 'percentage/cgpa' for all sections
      if (key === 'percentage') {
        return 'percentage/cgpa';
      }
      
      // Change 'school' to 'college name' for graduation and post-graduation
      if ((section === 'graduation' || section === 'post_graduation') && key === 'school') {
        return 'college name';
      }
    
      if ((section === 'graduation' || section === 'post_graduation') && key === 'degree') {
        return 'university name';
      }
      
      return displayKey.replace(/_/g, ' ');
    };
  

    return (
      <div className="space-y-4">
        {/* 10th Details - Common for all */}
        {student.academic_details.tenth && (
          <div>
            <Label className="text-sm text-gray-500 font-medium">10th Standard Details</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {Object.entries(student.academic_details.tenth).map(([key, value]) => (
                <div key={`tenth-${key}`}>
                  <Label className="text-sm text-gray-500">
                    {getDisplayLabel(key).charAt(0).toUpperCase() + getDisplayLabel(key).slice(1)}
                  </Label>
                  <p>{String(value) || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
  
        {/* 12th Details - Common for all */}
        {student.academic_details.twelfth && (
          <div>
            <Label className="text-sm text-gray-500 font-medium">12th Standard Details</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {Object.entries(student.academic_details.twelfth).map(([key, value]) => (
                <div key={`twelfth-${key}`}>
                  <Label className="text-sm text-gray-500">
                    {getDisplayLabel(key).charAt(0).toUpperCase() + getDisplayLabel(key).slice(1)}
                  </Label>
                  <p>{String(value) || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
  
        {/* UG Details - For PG and Research */}
        {student.academic_details.graduation && (
        <div>
          <Label className="text-sm text-gray-500 font-medium">
            {student.course_type === 'PG' ? 'Undergraduate Details' : 'Bachelor\'s Degree Details'}
          </Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {Object.entries(student.academic_details.graduation).map(([key, value]) => (
              <div key={`graduation-${key}`}>
                <Label className="text-sm text-gray-500">
                  {getDisplayLabel(key).charAt(0).toUpperCase() + getDisplayLabel(key).slice(1)}
                </Label>
                <p>{String(value) || "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

  const fetchStudentDocuments = async (studentId: string, applicationId: string) => {
    try {
      const { data: documents, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .eq('application_id', applicationId);

      if (error) throw error;
      return documents as StudentDocument[];
    } catch (err) {
      console.error('Error fetching student documents:', err);
      return [];
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="students">Student List</TabsTrigger>
            <TabsTrigger value="manual-assignment">Manual Assignment</TabsTrigger>
          </TabsList>

          {isVerificationAdmin && (
            <Select
              value={verificationAdminCourseId || ''}
              onValueChange={(value) => {
                setVerificationAdminCourseId(value);
                if (value === 'all') {
                  setVerificationAdminCourseName('All Courses');
                } else {
                  const course = availableCourses.find(c => c.id === value);
                  setVerificationAdminCourseName(course?.name || null);
                }
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="students">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 items-center">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchStudents}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
              {error}
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course Type</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredStudents.length ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email || "N/A"}</TableCell>
                      <TableCell>{getCourseCategoryLabel(student.course_type)}</TableCell>
                      <TableCell>
                        {student.course_name || "Not Assigned"}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewStudentDetails(student.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {searchTerm
                        ? "No students found matching your search."
                        : "No students available."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="manual-assignment">
          {verificationAdminCourseId && verificationAdminCourseName ? (
            <ManualAssignment
              courseId={verificationAdminCourseId}
              courseName={verificationAdminCourseName}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Please select a course to manage manual assignments</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedStudent && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
              <DialogDescription>
                {selectedStudent.name} - {selectedStudent.email || "No email"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="personal">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="academic">Academic Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Name</Label>
                    <p>{selectedStudent.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p>{selectedStudent.email || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <p>{selectedStudent.phone || selectedStudent.personal_details?.contact_number || "N/A"}</p>
                  </div>
                  {selectedStudent.personal_details?.dob && (
                    <div>
                      <Label className="text-sm text-gray-500">Date of Birth</Label>
                      <p>{selectedStudent.personal_details.dob}</p>
                    </div>
                  )}
                  {selectedStudent.personal_details?.gender && (
                    <div>
                      <Label className="text-sm text-gray-500">Gender</Label>
                      <p>{selectedStudent.personal_details.gender}</p>
                    </div>
                  )}
                  {selectedStudent.personal_details?.nationality && (
                    <div>
                      <Label className="text-sm text-gray-500">Nationality</Label>
                      <p>{selectedStudent.personal_details.nationality}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-500">Father's Name</Label>
                    <p>{selectedStudent.personal_details?.father_name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Mother's Name</Label>
                    <p>{selectedStudent.personal_details?.mother_name || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Address</Label>
                  <p>
                    {selectedStudent.personal_details?.address || "Not provided"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-gray-500">Course Applied</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label className="text-sm text-gray-500">Course Type</Label>
                      <p>{getCourseCategoryLabel(selectedStudent.course_type)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Course Name</Label>
                      <p>{selectedStudent.course_name || "Not Assigned"}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="text-sm text-gray-500">Current Status</Label>
                  <p className="mt-1">{getStatusBadge(selectedStudent.status)}</p>
                </div>
              </TabsContent>
              
              <TabsContent value="academic" className="space-y-4">
                {renderAcademicDetails(selectedStudent)}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {documentsLoading ? (
                  <div className="flex justify-center py-6">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedStudent.documents && selectedStudent.documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStudent.documents.map((doc, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Label className="text-sm font-medium">
                            {doc.name || doc.type || "Document"}
                          </Label>
                          <Badge variant="outline">
                            {new Date(doc.uploaded_at || "").toLocaleDateString()}
                          </Badge>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm block"
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-6">
                    No documents uploaded.
                  </p>
                )}

                <DocumentVerificationCheckboxes />
              </TabsContent>
            </Tabs>

            <div className="mb-4">
              <Label htmlFor="admin_remarks" className="block mb-2">
                Admin Remarks
              </Label>
              <Textarea
                id="admin_remarks"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Enter any remarks here..."
                className="min-h-[80px]"
              />
            </div>

            <DialogFooter>
              <div className="flex space-x-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Reject
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStatusUpdate("pending")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Mark Pending
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => handleStatusUpdate("approved")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Approve
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={showEmailSentPopup}
        onOpenChange={(open) => setShowEmailSentPopup(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Status Update Email Sent</DialogTitle>
            <DialogDescription>
              An email has been sent to {emailSentTo} with the {emailStatus} status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setShowEmailSentPopup(false)}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationAdmin;