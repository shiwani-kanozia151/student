import React, { useState, useEffect } from "react";
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

interface DocumentCheckbox {
  id: keyof DocumentVerification;
  label: string;
}

interface StatusHistoryItem {
  status: string;
  changed_at: string;
  changed_by?: string;
  remarks?: string;
  document_verification?: DocumentVerification;
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
  document_verification?: DocumentVerification;
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

interface Course {
  id: string;
  name: string;
}

interface CourseOption {
  id: string;
  label: string;
}

const VerificationAdmin: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [documentVerification, setDocumentVerification] = useState<DocumentVerification>({
    photo: false,
    signature: false,
    caste_certificate: false,
    tenth_marksheet: false,
    twelfth_marksheet: false,
    entrance_scorecard: false,
    ug_marksheet: false,
    pg_marksheet: false,
  });
  const [showEmailSentPopup, setShowEmailSentPopup] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState("");
  const [emailStatus, setEmailStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [isVerificationAdmin, setIsVerificationAdmin] = useState(false);
  const [verificationAdminCourseId, setVerificationAdminCourseId] = useState<string>("");
  const [verificationAdminCourseName, setVerificationAdminCourseName] = useState<string | null>(() => {
    return localStorage.getItem('selectedCourseName') || null;
  });
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);

  // Subscribe to status updates
  useEffect(() => {
    const subscription = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
        },
        () => {
          // Refresh the students list when any application is updated
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [verificationAdminCourseId]);

  useEffect(() => {
    const adminRole = localStorage.getItem('adminRole');
    const isVerificationOfficer = localStorage.getItem('verificationOfficerEmail') !== null;
    const isVerificationAdmin = localStorage.getItem('isVerificationAdmin') === 'true';
    const isSuperAdminAsVerification = localStorage.getItem('isSuperAdminAsVerification') === 'true';
    
    console.log('Admin Role:', adminRole);
    console.log('Is Verification Admin:', isVerificationAdmin);
    console.log('Is Super Admin as Verification:', isSuperAdminAsVerification);

    // Set verification admin state based on role or flags
    setIsVerificationAdmin(
      adminRole === 'verification' || 
      isVerificationAdmin || 
      isSuperAdminAsVerification
    );

    const fetchAndSetupCourses = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('courses')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        console.log('Fetched courses:', data);
        
        if (data && data.length > 0) {
          const unique = data.reduce((acc: {id: string; name: string}[], curr) => {
            if (!acc.find(c => c.name === curr.name)) acc.push(curr);
            return acc;
          }, []);
          
          console.log('Unique courses:', unique);
          setAvailableCourses(unique);
          
          // Set the first course as selected if none is selected
          const savedCourseId = localStorage.getItem('selectedCourseId');
          const savedCourseName = localStorage.getItem('selectedCourseName');
          
          if (!savedCourseId || !savedCourseName) {
            setVerificationAdminCourseId(unique[0].id);
            setVerificationAdminCourseName(unique[0].name);
            localStorage.setItem('selectedCourseId', unique[0].id);
            localStorage.setItem('selectedCourseName', unique[0].name);
          } else {
            setVerificationAdminCourseId(savedCourseId);
            setVerificationAdminCourseName(savedCourseName);
          }
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    // Initialize if user has verification admin access
    if (adminRole === 'verification' || isVerificationAdmin || isSuperAdminAsVerification) {
      fetchAndSetupCourses();
    }
  }, []);

  useEffect(() => {
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

  // Effect to set up real-time subscriptions
  useEffect(() => {
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
  }, []); // Empty dependency array means this runs once on mount

  // Effect to persist course selection
  useEffect(() => {
    if (verificationAdminCourseId) {
      localStorage.setItem('selectedCourseId', verificationAdminCourseId);
    } else {
      localStorage.removeItem('selectedCourseId');
    }
    
    if (verificationAdminCourseName) {
      localStorage.setItem('selectedCourseName', verificationAdminCourseName);
    } else {
      localStorage.removeItem('selectedCourseName');
    }
  }, [verificationAdminCourseId, verificationAdminCourseName]);

  // Effect to fetch students when course changes
  useEffect(() => {
    if (isVerificationAdmin) {
      fetchStudents();
    }
  }, [verificationAdminCourseId, isVerificationAdmin]);

  // Update the course options when availableCourses changes
  useEffect(() => {
    const options = availableCourses.map(course => ({
      id: course.id,
      label: course.name
    }));
    setCourseOptions(options);
  }, [availableCourses]);

  const getCourseCategoryLabel = (courseType: "UG" | "PG" | "Research" | null | undefined): string => {
    switch(courseType) {
      case "UG": return "Undergraduate";
      case "PG": return "Postgraduate";
      case "Research": return "Research";
      default: return "N/A";
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

      let query = supabase
        .from('students')
        .select(`
          *,
          student_documents!left(
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
        .order('updated_at', { ascending: false });  // Order by last update time

      // If a specific course is selected, filter by it
      if (verificationAdminCourseId) {
        query = query.eq('applications.course_id', verificationAdminCourseId);
      }

      const { data: studentsData, error: studentsError } = await query;

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      // Map and validate students
      const validatedStudents = (studentsData || [])
        .map(student => {
          const application = Array.isArray(student.applications) ? student.applications[0] : null;
          
          // If a specific course is selected, only include students with matching course_id
          if (verificationAdminCourseId && application?.course_id !== verificationAdminCourseId) {
            return null;
          }

          return validateStudent({
            ...student,
            ...(application?.personal_details || {}),
            documents: student.student_documents || [],
            status_history: application?.status_history || [],
            status: application?.status || student.status,
            remarks: application?.remarks || student.admin_remarks || null,
            document_verification: application?.document_verification || undefined,
            course_id: application?.course_id || student.course_id || null,
            course_name: application?.course_name || student.course_name || null,
            course_type: application?.course_type || student.course_type || null,
          });
        })
        .filter(Boolean) as Student[];

      setStudents(validatedStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

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
    const baseDocuments: DocumentCheckbox[] = [
      { id: 'photo', label: 'Photo' },
      { id: 'signature', label: 'Signature' },
      { id: 'caste_certificate', label: 'Caste Certificate' },
      { id: 'tenth_marksheet', label: '10th Marksheet' },
      { id: 'twelfth_marksheet', label: '12th Marksheet' },
      { id: 'entrance_scorecard', label: 'Entrance Scorecard' },
    ];

    // Additional documents based on course type
    const additionalDocuments: DocumentCheckbox[] = [];
    
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
                    [doc.id]: !prev[doc.id]
                  }));
                }}
                className={`h-5 w-5 rounded border flex items-center justify-center ${
                  documentVerification[doc.id]
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {documentVerification[doc.id] && (
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

// Helper function to safely handle course type
const getCourseType = (type: "UG" | "PG" | "Research" | null | undefined): string | undefined => {
  return type || undefined;
};

// Update the course selection part where it's used
const handleCourseChange = (courseId: string) => {
  const selectedCourse = availableCourses.find(c => c.id === courseId);
  if (courseId === "all") {
    setVerificationAdminCourseId("");
    setVerificationAdminCourseName("");
  } else {
    setVerificationAdminCourseId(courseId);
    setVerificationAdminCourseName(selectedCourse?.name || "");
  }
};

return (
  <div className="container mx-auto py-6 space-y-6">
    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
      <h1 className="text-3xl font-bold">Verification Admin Dashboard</h1>
      
      {isVerificationAdmin && (
        <div className="w-full md:w-72">
          <Select
            value={verificationAdminCourseId || "all"}
            onValueChange={handleCourseChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a course to view students..." />
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
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Manage student applications for {verificationAdminCourseName}
        </h2>
      )}
    </div>

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
        {isVerificationAdmin && verificationAdminCourseId && (
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
                        <TableCell>{verificationAdminCourseId ? "" : getCourseCategoryLabel(student.course_type)}</TableCell>
                        <TableCell>
                          {verificationAdminCourseId ? verificationAdminCourseName : (student.course_name || "Not Assigned")}
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
                : verificationAdminCourseId
                ? `No students found for ${verificationAdminCourseName}.`
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