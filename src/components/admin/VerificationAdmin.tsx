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
  course_type?: string | null;
  course_name?: string | null;
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

<<<<<<< HEAD
const getCourseCategoryLabel = (department?: string) => {
  switch (department) {
    case "UG":
      return "Undergraduate";
    case "PG":
      return "Postgraduate";
    case "Research":
      return "Research";
    default:
      return department || "N/A";
  }
};

const validateStudent = (student: any): Student | null => {
  if (!student || typeof student !== "object") return null;

  if (!student.id || typeof student.id !== "string") return null;
  if (!student.created_at || typeof student.created_at !== "string") return null;
  if (!student.name || typeof student.name !== "string") return null;
  if (!student.status || !["pending", "approved", "rejected"].includes(student.status))
    return null;

  const documents = Array.isArray(student.documents)
    ? student.documents.filter((doc: any) => doc && typeof doc === "object" && typeof doc.url === "string")
    : Array.isArray(student.student_documents)
    ? student.student_documents.filter((doc: any) => doc && typeof doc === "object" && typeof doc.url === "string")
    : [];

  const status_history = Array.isArray(student.status_history)
    ? student.status_history.filter((item: any) =>
        item &&
        typeof item === "object" &&
        typeof item.status === "string" &&
        typeof item.changed_at === "string"
      )
    : [];

  return {
    ...student,
    documents,
    status_history,
    email: typeof student.email === "string" ? student.email : undefined,
    phone: typeof student.phone === "string" ? student.phone : undefined,
    address: typeof student.address === "string" ? student.address : undefined,
    department: typeof student.department === "string" ? student.department : undefined,
    course_id: student.course_id || student.applications?.[0]?.course_id || null,
    course_level: student.course_level || student.applications?.[0]?.course_level || null,
    course_type: student.course_type || student.applications?.[0]?.course_type || null,
    course_name: student.course_name || student.applications?.[0]?.course_name || null,
    dob: typeof student.dob === "string" ? student.dob : null,
    gender: typeof student.gender === "string" ? student.gender : null,
    nationality: typeof student.nationality === "string" ? student.nationality : null,
    admin_remarks: typeof student.admin_remarks === "string" ? student.admin_remarks : null,
    is_verified: typeof student.is_verified === "boolean" ? student.is_verified : false,
    updated_at: typeof student.updated_at === "string" ? student.updated_at : undefined,
    personal_details: student.personal_details || {},
    academic_details: student.academic_details || {},
  };
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <h2 className="font-bold">Something went wrong</h2>
          <p>Please refresh the page or try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

=======
>>>>>>> student-portal-changes
const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");
  const [documentsLoading, setDocumentsLoading] = React.useState(false);
<<<<<<< HEAD

  // Fetch students with real-time updates
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          *,
          student_documents!student_id(
            id,
            type,
            url,
            file_name,
            uploaded_at,
            application_id
          ),
          applications!student_id(
            id,
            personal_details,
            academic_details,
            course_id,
            department,
            course_level,
            course_type,
            course_name,
            status,
            admin_remarks,
            created_at,
            status_history
          )
        `)
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      const validatedStudents = (studentsData || [])
        .map((student) =>
          validateStudent({
            ...student,
            ...(student.applications?.[0]?.personal_details || {}),
            ...(student.applications?.[0]?.academic_details || {}),
            documents: student.student_documents || [],
            course_id: student.applications?.[0]?.course_id || null,
            department: student.applications?.[0]?.department || null,
            course_level: student.applications?.[0]?.course_level || null,
            course_type: student.applications?.[0]?.course_type || null,
            course_name: student.applications?.[0]?.course_name || null,
            admin_remarks: student.applications?.[0]?.admin_remarks || null,
            status_history: student.applications?.[0]?.status_history || [],
          })
        )
        .filter(Boolean) as Student[];

      setStudents(validatedStudents);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err instanceof Error ? err.message : "Failed to load students");
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };
=======
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
>>>>>>> student-portal-changes

  // Set up real-time subscription
  React.useEffect(() => {
<<<<<<< HEAD
    fetchStudents();

    const studentsChannel = supabase
      .channel("students_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        fetchStudents
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
    };
  }, []);

  // Real-time updates for currently viewed student
  React.useEffect(() => {
    if (!selectedStudent?.id) return;

    const applicationChannel = supabase
      .channel(`application_${selectedStudent.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `student_id=eq.${selectedStudent.id}`
        },
        (payload) => {
          setSelectedStudent(prev => ({
            ...prev!,
            status: payload.new.status,
            admin_remarks: payload.new.admin_remarks,
            status_history: [
              ...(prev?.status_history || []),
              {
                status: payload.new.status,
                changed_at: new Date().toISOString(),
                remarks: payload.new.admin_remarks,
                changed_by: "admin"
              }
            ]
          }));
          toast.success(`Status updated to ${payload.new.status}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(applicationChannel);
    };
  }, [selectedStudent?.id]);

  const handleStatusUpdate = async (status: "pending" | "approved" | "rejected") => {
    try {
      if (!selectedStudent) return;
      
      const remarks = adminRemarks.trim();
      
      if ((status === "pending" || status === "rejected") && !remarks) {
        toast.error("Please provide remarks for pending or rejected status");
        return;
      }

      const { error } = await supabase
        .from("applications")
        .update({
          status,
          admin_remarks: remarks,
          updated_at: new Date().toISOString()
        })
        .eq("student_id", selectedStudent.id);

      if (error) throw error;

      // Optimistically update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id 
          ? { 
              ...s, 
              status, 
              admin_remarks: remarks,
              status_history: [
                ...(s.status_history || []),
                {
                  status,
                  changed_at: new Date().toISOString(),
                  remarks: remarks,
                  changed_by: "admin"
                }
              ]
            } 
          : s
      ));

      toast.success(`Status updated to ${status}`);
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err instanceof Error ? err.message : "Update failed");
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
            file_name,
            uploaded_at,
            application_id
          ),
          applications!student_id(
            id,
            personal_details,
            academic_details,
            course_id,
            department,
            course_level,
            course_type,
            course_name,
            status,
            admin_remarks,
            status_history
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
        ...(studentData.applications?.[0]?.academic_details || {}),
        documents: studentData.student_documents?.map((doc: any) => ({
          ...doc,
          url: doc.url.startsWith("http")
            ? doc.url
            : supabase.storage.from("applications").getPublicUrl(doc.url).data.publicUrl,
        })) || [],
        course_id: studentData.applications?.[0]?.course_id || null,
        department: studentData.applications?.[0]?.department || null,
        course_level: studentData.applications?.[0]?.course_level || null,
        course_type: studentData.applications?.[0]?.course_type || null,
        course_name: studentData.applications?.[0]?.course_name || null,
        admin_remarks: studentData.applications?.[0]?.admin_remarks || null,
        status_history: studentData.applications?.[0]?.status_history || [],
=======
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
            setAvailableCourses(data);
            // By default, select the first course
            setVerificationAdminCourseId(data[0].id);
            setVerificationAdminCourseName(data[0].name);
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
      setVerificationAdminCourseId(localStorage.getItem('verificationOfficerCourseId'));
      setVerificationAdminCourseName(localStorage.getItem('verificationOfficerCourseName'));
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
>>>>>>> student-portal-changes
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

<<<<<<< HEAD
  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (student.name?.toLowerCase().includes(search) || false) ||
      (student.email?.toLowerCase().includes(search) || false) ||
      (student.department?.toLowerCase().includes(search) || false) ||
      (student.course_id?.toLowerCase().includes(search) || false) ||
      (student.course_name?.toLowerCase().includes(search) || false)
    );
  });
=======
  const validateStudent = (student: any): Student | null => {
    if (!student || typeof student !== 'object') return null;
    if (!student.id || typeof student.id !== 'string') return null;
    if (!student.created_at || typeof student.created_at !== 'string') return null;
    if (!student.name || typeof student.name !== 'string') return null;
    if (!student.status || !['pending', 'approved', 'rejected'].includes(student.status)) return null;
>>>>>>> student-portal-changes

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
        console.log("Course ID filter:", verificationAdminCourseId || verificationOfficerCourseId || "None");
        
        // First, let's get all students to debug
        const { data: allStudents, error: allStudentsError } = await supabase
          .from("students")
          .select("id, name, email, status")
          .order("created_at", { ascending: false });
          
        console.log(`Total students in database: ${allStudents?.length || 0}`);
        
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
          if (verificationAdminCourseId) {
            console.log(`Admin filtering for specific course ID: ${verificationAdminCourseId}`);
            query = query.eq("applications.course_id", verificationAdminCourseId);
          } else {
            console.log("Admin viewing all courses - no course filter applied");
          }
        } else if (isVerificationOfficer) {
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
        console.log("Sample student data:", studentsData?.length ? studentsData[0] : "No data");

        // Process students with less filtering
        const validatedStudents = (studentsData || [])
          .map(student => {
            try {
              // Basic validation of required fields
              if (!student || !student.id || !student.name) {
                console.log("Skipping student with missing required fields:", student?.id);
                return null;
              }
              
              // Get application for this student if exists
              const application = student.applications?.[0];
              
              // Handle students with no applications
              if (!application) {
                // Only include students without applications when viewing ALL courses
                if (isVerificationAdmin && !verificationAdminCourseId) {
                  console.log("Including student with no application (All Courses view):", student.id);
                  return validateStudent({
                    ...student,
                    documents: student.student_documents || [],
                    status_history: [],
                    course_id: null,
                    course_type: null,
                    course_name: "Not Assigned",
                  });
                } else {
                  // Skip students without applications when course filtering is active
                  console.log("Skipping student with no application when course filtering is active");
                  return null;
                }
              }
              
              // When a specific course is selected (for admin or officer), strictly filter by that course
              if (verificationAdminCourseId && isVerificationAdmin) {
                // If student's course ID doesn't match the selected course, skip them
                if (application.course_id !== verificationAdminCourseId) {
                  console.log(`Skipping student: course ID ${application.course_id || 'none'} doesn't match selected ${verificationAdminCourseId}`);
                  return null;
                }
              } else if (isVerificationOfficer && verificationOfficerCourseId) {
                // For verification officers, enforce course filtering
                if (application.course_id !== verificationOfficerCourseId) {
                  console.log(`Skipping student: course ID ${application.course_id || 'none'} doesn't match officer's course ${verificationOfficerCourseId}`);
                  return null;
                }
              }
              
              return validateStudent({
                ...student,
                ...(application?.personal_details || {}),
                documents: student.student_documents || [],
                status_history: application?.status_history || [],
                status: application?.status || student.status || "pending",
                course_id: application?.course_id || null,
                course_name: application?.course_name || "Not Assigned",
                course_type: application?.course_type || null,
                remarks: application?.remarks || student.remarks,
                document_verification: application?.document_verification || undefined
              });
            } catch (err) {
              console.error("Error processing student:", student?.id, err);
              return null;
            }
          })
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
<<<<<<< HEAD

            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Course Type</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name || "N/A"}</TableCell>
                        <TableCell>{student.email || "N/A"}</TableCell>
                        <TableCell>{getCourseCategoryLabel(student.course_type)}</TableCell>
                        <TableCell>{student.course_name || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              student.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : student.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {student.status?.charAt(0)?.toUpperCase() +
                              student.status?.slice(1) || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewStudentDetails(student.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        {students.length === 0
                          ? "No students found"
                          : "No matching students found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
=======
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
>>>>>>> student-portal-changes
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isVerificationAdmin && availableCourses.length > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <Label className="whitespace-nowrap">Select Course:</Label>
          <Select 
            value={verificationAdminCourseId || ""} 
            onValueChange={(value) => {
              // Find the course name from the available courses
              const courseName = availableCourses.find(c => c.id === value)?.name || "";
              setVerificationAdminCourseId(value === "all" ? null : value);
              setVerificationAdminCourseName(value === "all" ? null : courseName);
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a course to manage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {availableCourses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {verificationAdminCourseName && (
        <h2 className="text-xl font-medium text-gray-800">
          Manage student applications for {verificationAdminCourseName}
        </h2>
      )}

      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {localStorage.getItem('adminRole') === 'verification' && verificationAdminCourseId && (
            <AssignStudentsButton 
              courseId={verificationAdminCourseId} 
              courseName={verificationAdminCourseName || ""}
            />
          )}
        </div>
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

<<<<<<< HEAD
                  <TabsContent value="details" className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        {[
                          { label: "Full Name", value: selectedStudent.name || "N/A" },
                          { label: "Email", value: selectedStudent.email || "N/A" },
                          { label: "Phone", value: selectedStudent.phone || "N/A" },
                          { label: "Date of Birth", value: selectedStudent.dob || "N/A" },
                          { label: "Gender", value: selectedStudent.gender || "N/A" },
                          { label: "Nationality", value: selectedStudent.nationality || "N/A" },
                          {
                            label: "Address",
                            value: selectedStudent.address || "N/A",
                            colSpan: "md:col-span-2",
                          },
                        ].map((field, index) => (
                          <div key={index} className={field.colSpan || ""}>
                            <Label className="text-sm text-gray-500">{field.label}</Label>
                            <p className="font-medium">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Academic Information Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Academic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        {[
                          {
                            label: "Course Type",
                            value: getCourseCategoryLabel(selectedStudent.course_type),
                          },
                          {
                            label: "Course Name",
                            value: selectedStudent.course_name || "N/A",
                          },
                          {
                            label: "Course Level",
                            value: selectedStudent.course_level || "N/A",
                          },
                          {
                            label: "Registration Date",
                            value:
                              selectedStudent.created_at
                                ? new Date(selectedStudent.created_at).toLocaleDateString()
                                : "N/A",
                          },
                        ].map((field, index) => (
                          <div key={index}>
                            <Label className="text-sm text-gray-500">{field.label}</Label>
                            <p className="font-medium">{field.value}</p>
                          </div>
                        ))}
                      </div>
=======
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
>>>>>>> student-portal-changes
                    </div>
                  </div>
                </div>

<<<<<<< HEAD
                    {/* Status History Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Status History</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedStudent.status_history?.length ? (
                          <div className="space-y-2">
                            {selectedStudent.status_history.map((entry, i) => (
                              <div key={i} className="flex flex-col gap-1 border-b pb-2">
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {new Date(entry.changed_at).toLocaleString()}
                                  </span>
                                </div>
                                {entry.remarks && (
                                  <div className="text-sm text-gray-500">
                                    Remarks: {entry.remarks}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">No status history available</p>
                        )}
                      </div>
                    </div>

                    {/* Verification Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Verification</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="mb-4">
                          <Label className="text-sm text-gray-500">Current Status</Label>
                          <p className="font-medium">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                selectedStudent.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : selectedStudent.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {selectedStudent.status?.charAt(0)?.toUpperCase() +
                                selectedStudent.status?.slice(1) || "N/A"}
                            </span>
                          </p>
                        </div>

                        <div className="mb-6">
                          <Label
                            htmlFor="adminRemarks"
                            className="block text-sm text-gray-500 mb-1"
                          >
                            Admin Remarks
                            {(selectedStudent.status === "pending" ||
                              selectedStudent.status === "rejected") && (
                              <span className="text-red-500"> *</span>
                            )}
=======
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
>>>>>>> student-portal-changes
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

<<<<<<< HEAD
                        <div className="flex flex-col sm:flex-row justify-end gap-4">
                          <Button
                            variant="outline"
                            onClick={() => handleStatusUpdate("pending")}
                            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200"
                          >
                            Keep Pending
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleStatusUpdate("rejected")}
                          >
                            Reject
                          </Button>
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate("approved")}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    {documentsLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
                      </div>
                    ) : selectedStudent?.documents?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedStudent.documents.map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-medium capitalize">
                                {doc.type.replace(/_/g, " ")}
                              </h3>
                              {doc.uploaded_at && (
                                <span className="text-xs text-gray-500">
                                  {new Date(doc.uploaded_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-4 flex items-center justify-center">
                              {doc.url.toLowerCase().endsWith(".pdf") ? (
                                <div className="h-full flex flex-col items-center justify-center p-4">
                                  <p className="text-gray-500 mb-2">PDF Document</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(doc.url, "_blank")}
                                  >
                                    View PDF
                                  </Button>
                                </div>
                              ) : (
                                <img
                                  src={doc.url}
                                  alt={doc.type}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/document-placeholder.png";
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500 truncate">
                                {doc.file_name || "Document"}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(doc.url, "_blank")}
                              >
                                View Full
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-gray-500">No documents available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
=======
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
>>>>>>> student-portal-changes
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