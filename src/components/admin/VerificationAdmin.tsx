import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, RefreshCw, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { sendStatusEmail } from "@/lib/emailService";
import AssignStudentsButton from "./verification/AssignStudentsButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Student {
  id: string;
  created_at: string;
  documents?: Document[];
  address?: string;
  is_verified: boolean;
  status_history?: StatusHistoryItem[];
  phone?: string;
  admin_remarks?: string | null;
  name: string;
  email?: string;
  department?: string;
  status: "pending" | "approved" | "rejected";
  course_id?: string | null;
  course_type?: "UG" | "PG" | "Research" | null;
  course_name?: string | null;
  course_level?: string | null;
  dob?: string | null;
  gender?: string | null;
  nationality?: string | null;
  updated_at?: string;
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
  personal_details?: {
    father_name?: string;
    mother_name?: string;
    age?: string;
    contact_number?: string;
    [key: string]: any;
  };
  academic_details?: {
    tenth?: {
      school?: string;
      percentage?: string;
      board?: string;
    };
    twelfth?: {
      school?: string;
      percentage?: string;
      board?: string;
    };
    graduation?: {
      school?: string;
      percentage?: string;
      degree?: string;
    };
    post_graduation?: {
      school?: string;
      percentage?: string;
      degree?: string;
    };
    entrance?: {
      exam?: string;
      score?: string;
      rank?: string;
    };
    [key: string]: any;
  };
}

const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");
  const [documentsLoading, setDocumentsLoading] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [documentVerification, setDocumentVerification] = React.useState({
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
  const [availableCourses, setAvailableCourses] = React.useState<{ id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = React.useState<string | null>(null);
  const [courses, setCourses] = React.useState<{ id: string; name: string }[]>([]);

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
          
          if (data && data.length > 0) {
            // Add "All Courses" option at the beginning
            const allCoursesOption = { id: "all", name: "All Courses" };
            setCourses([allCoursesOption, ...data]);
            setAvailableCourses(data);
          }
        } catch (err) {
          console.error('Error fetching courses:', err);
          toast.error('Failed to load courses');
        }
      };
      
      fetchCourses();
    } else if (isVerificationOfficer) {
      // For verification officers, course is already set in localStorage
      const courseId = localStorage.getItem('verificationOfficerCourseId');
      const courseName = localStorage.getItem('verificationOfficerCourseName');
      if (courseId && courseName) {
        setCourses([{ id: courseId, name: courseName }]);
        setSelectedCourse(courseId);
      }
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

  const validateStudent = (student: any): Student | null => {
    if (!student || typeof student !== 'object') return null;
    if (!student.id || typeof student.id !== 'string') return null;
    if (!student.created_at || typeof student.created_at !== 'string') return null;
    if (!student.name || typeof student.name !== 'string') return null;
    if (!student.status || !['pending', 'approved', 'rejected'].includes(student.status)) return null;

    const documents = Array.isArray(student.documents)
        ? student.documents.filter((doc: any) => doc?.url)
      : Array.isArray(student.student_documents)
          ? student.student_documents.filter((doc: any) => doc?.url)
      : [];

    const status_history = Array.isArray(student.status_history)
        ? student.status_history.filter((item: any) => item?.status && item?.changed_at)
      : [];

    return {
      ...student,
      documents,
      status_history,
        email: typeof student.email === 'string' ? student.email : undefined,
        phone: typeof student.phone === 'string' ? student.phone : undefined,
        address: typeof student.address === 'string' ? student.address : undefined,
        department: typeof student.department === 'string' ? student.department : undefined,
      course_id: student.course_id || student.applications?.[0]?.course_id || null,
      course_type: student.course_type || student.applications?.[0]?.course_type || null,
      course_name: student.course_name || student.applications?.[0]?.course_name || null,
        course_level: student.course_level || student.applications?.[0]?.course_level || null,
        dob: typeof student.dob === 'string' ? student.dob : null,
        gender: typeof student.gender === 'string' ? student.gender : null,
        nationality: typeof student.nationality === 'string' ? student.nationality : null,
        remarks: typeof student.remarks === 'string' ? student.remarks : null,
        is_verified: typeof student.is_verified === 'boolean' ? student.is_verified : false,
        updated_at: typeof student.updated_at === 'string' ? student.updated_at : undefined,
        document_verification: student.document_verification || undefined,
        personal_details: student.personal_details || student.applications?.[0]?.personal_details || {},
        academic_details: student.academic_details || student.applications?.[0]?.academic_details || {}
      };
    };

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if user is a verification officer (using localStorage)
        const isVerificationOfficer = localStorage.getItem('verificationOfficerEmail') !== null;
        const verificationOfficerEmail = localStorage.getItem('verificationOfficerEmail');
        const verificationOfficerCourseId = localStorage.getItem('verificationOfficerCourseId');
        
        // Log the current mode and course information
        console.log("Verification mode:", isVerificationAdmin ? "Admin" : "Officer");
        console.log("Course ID filter:", selectedCourse || verificationOfficerCourseId || "None");
        
        if (!selectedCourse && !verificationOfficerCourseId) {
          setStudents([]);
          setLoading(false);
          return;
        }

        // Now do the real query with the necessary joins
        let query = supabase
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
            applications!left(
              id,
              personal_details,
              academic_details,
              course_id,
              course_type,
              course_name,
              status,
              remarks,
              status_history,
              document_verification,
              created_at
            )
          `)
          .order("created_at", { ascending: false });

        // If this is a verification admin, they can see ALL students across ALL courses
        // If it's a verification officer, filter by their assigned course
        if (isVerificationAdmin) {
          // For verification admins, only filter by course if a specific course is selected
          // and it's not the "All Courses" option
          if (selectedCourse && selectedCourse !== "all") {
            console.log(`Admin filtering for specific course ID: ${selectedCourse}`);
            query = query.eq("applications.course_id", selectedCourse);
          } else {
            console.log("Admin viewing all courses");
          }
        } else if (isVerificationOfficer && verificationOfficerCourseId) {
          // For verification officers, always filter by their assigned course
          console.log(`Officer filtering for assigned course: ${verificationOfficerCourseId}`);
          query = query.eq("applications.course_id", verificationOfficerCourseId);
          
          // First, get the verification officer's ID
          const { data: officerData, error: officerError } = await supabase
            .from("verification_admins")
            .select("id")
            .eq("email", verificationOfficerEmail)
            .single();

          if (officerError) {
            throw new Error(`Failed to get verification officer details: ${officerError.message}`);
          }
          
          if (!officerData || !officerData.id) {
            throw new Error("Verification officer ID not found");
          }

          // Get assigned students for this officer
          const { data: assignedStudents, error: assignmentError } = await supabase
            .from("student_assignments")
            .select("student_id")
            .eq("verification_officer_id", officerData.id)
            .eq("course_id", verificationOfficerCourseId);

          if (assignmentError && !assignmentError.message.includes("does not exist")) {
            throw new Error(`Error fetching student assignments: ${assignmentError.message}`);
          }

          // Create an array of student IDs assigned to this officer
          const assignedStudentIds = (assignedStudents || []).map(assignment => assignment.student_id);

          // If we have assigned students, only get those specific students
          if (assignedStudents && assignedStudents.length > 0) {
            console.log(`Filtering for ${assignedStudentIds.length} assigned students`);
            query = query.in("id", assignedStudentIds);
          }
        }

        const { data: studentsData, error: studentsError } = await query;

        if (studentsError) {
          console.error("Error fetching students data:", studentsError);
          throw studentsError;
        }
        
        console.log(`Query returned ${studentsData?.length || 0} student records`);

        // Process students with less filtering
        const validatedStudents = (studentsData || [])
          .map(student => validateStudent(student))
          .filter(Boolean) as Student[];

        console.log(`Filtered to ${validatedStudents.length} valid students`);
        setStudents(validatedStudents);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err instanceof Error ? err.message : "Failed to load students");
        toast.error("Failed to load students");
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

        const validatedStudent = validateStudent({
          ...studentData,
          ...(studentData.applications?.[0]?.personal_details || {}),
          documents: studentData.student_documents || [],
          status_history: studentData.applications?.[0]?.status_history || [],
          status: studentData.applications?.[0]?.status || studentData.status,
          remarks: studentData.applications?.[0]?.remarks || studentData.remarks,
          document_verification: studentData.applications?.[0]?.document_verification || undefined
        });

        if (!validatedStudent) {
          throw new Error("Invalid student data");
        }

        setSelectedStudent(validatedStudent);
        setAdminRemarks(validatedStudent.admin_remarks || "");
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

  const handleRefresh = () => {
    fetchStudents();
  };

  React.useEffect(() => {
    if (selectedCourse) {
      fetchStudents();
    }
  }, [selectedCourse]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        {/* Course Selection */}
        <div>
          <Label className="text-base font-semibold">Select Course:</Label>
          <div className="flex gap-4 mt-2">
            <Select
              value={selectedCourse || ""}
              onValueChange={setSelectedCourse}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedCourse && (
          <>
            <div>
              <h2 className="text-2xl font-bold">
                Manage student applications for {courses.find(c => c.id === selectedCourse)?.name}
              </h2>
            </div>

            {/* Search and Actions */}
            <div className="flex justify-between items-center">
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              <AssignStudentsButton
                courseId={selectedCourse}
                courseName={courses.find(c => c.id === selectedCourse)?.name || ""}
              />
            </div>

            {/* Students Table */}
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
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.course_type}</TableCell>
                        <TableCell>{student.course_name}</TableCell>
                        <TableCell>{student.status}</TableCell>
                        <TableCell>
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
                      <TableCell colSpan={6} className="text-center py-4">
                        No students available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

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
                  <div>
                    <Label className="text-sm text-gray-500">Date of Birth</Label>
                    <p>{selectedStudent.dob || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Gender</Label>
                    <p>{selectedStudent.gender || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Nationality</Label>
                    <p>{selectedStudent.nationality || "N/A"}</p>
                  </div>
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
                  <p className="mt-1">{selectedStudent.address || "N/A"}</p>
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