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
import { Search, Eye, RefreshCw, Check } from "lucide-react";
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
  });
  const [showEmailSentPopup, setShowEmailSentPopup] = React.useState(false);
  const [emailSentTo, setEmailSentTo] = React.useState("");
  const [emailStatus, setEmailStatus] = React.useState<"pending" | "approved" | "rejected">("pending");

  React.useEffect(() => {
    if (selectedStudent) {
      setDocumentVerification(
        selectedStudent.document_verification || {
          photo: false,
          signature: false,
          caste_certificate: false,
          tenth_marksheet: false,
          twelfth_marksheet: false,
          entrance_scorecard: false,
        }
      );
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

      const { data: studentsData, error: studentsError } = await supabase
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
            document_verification,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      const validatedStudents = (studentsData || [])
        .map(student => validateStudent({
          ...student,
          ...(student.applications?.[0]?.personal_details || {}),
          documents: student.student_documents || [],
          status_history: student.applications?.[0]?.status_history || [],
          status: student.applications?.[0]?.status || student.status,
          remarks: student.applications?.[0]?.remarks || student.remarks,
          document_verification: student.applications?.[0]?.document_verification || undefined
        }))
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

  React.useEffect(() => {
    fetchStudents();

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

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(applicationsChannel);
    };
  }, []);

  const handleStatusUpdate = async (status: "pending" | "approved" | "rejected") => {
    if (!selectedStudent) return;
  
    try {
      setIsUpdating(true);
      const remarks = adminRemarks.trim(); // This comes from your state
  
      if ((status === "pending" || status === "rejected") && !remarks) {
        toast.error("Please provide remarks for pending/rejected status");
        return;
      }
  
      const updateTime = new Date().toISOString();
      
      // Update students table - use 'admin_remarks' as the column name but 'remarks' as the value
      const { error: studentError } = await supabase
        .from("students")
        .update({
          status,
          admin_remarks: remarks, // Column name: admin_remarks, value: remarks
          is_verified: status === "approved",
          updated_at: updateTime,
        })
        .eq("id", selectedStudent.id);
  
      // Update applications table
      const { error: applicationError } = await supabase
        .from("applications")
        .update({
          status,
          remarks, // applications table uses 'remarks' column
          updated_at: updateTime,
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

  const DocumentVerificationCheckboxes = () => (
    <div className="mb-6">
      <Label className="block text-sm text-gray-500 mb-3">Document Verification</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { id: 'photo', label: 'Photo' },
          { id: 'signature', label: 'Signature' },
          { id: 'caste_certificate', label: 'Caste Certificate' },
          { id: 'tenth_marksheet', label: '10th Marksheet' },
          { id: 'twelfth_marksheet', label: '12th Marksheet' },
          { id: 'entrance_scorecard', label: 'Entrance Scorecard' },
        ].map((doc) => (
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
    {/* Email Sent Popup */}
    {showEmailSentPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Check className="h-6 w-6 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="font-bold text-lg mb-1">
                Status Update Notification Sent
              </h3>
              <div className="mt-2">
                <p className="text-gray-700">
                  An email has been sent to: <span className="font-semibold">{emailSentTo}</span>
                </p>
                <p className="mt-2">
                  Status: <span className="font-semibold capitalize">{emailStatus}</span>
                </p>
                {adminRemarks && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Remarks:</p>
                    <p className="text-gray-700 mt-1">{adminRemarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => setShowEmailSentPopup(false)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Student Verification Dashboard
          </h1>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStudents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
  
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
  
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
  
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
                        {getStatusBadge(student.status)}
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
          </div>
        </div>
  
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {!selectedStudent ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-[#0A2240]">
                    Application Review - {selectedStudent?.name || "Student"}
                  </DialogTitle>
                  <DialogDescription>
                    Review and verify student application details
                  </DialogDescription>
                </DialogHeader>
  
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full mb-6">
                    <TabsTrigger value="details">Application Details</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
  
                  <TabsContent value="details" className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                        {[
                          { label: "Full Name", value: selectedStudent.name },
                          { label: "Email", value: selectedStudent.email },
                          { label: "Phone", value: selectedStudent.phone },
                          { label: "Date of Birth", value: selectedStudent.dob },
                          { label: "Gender", value: selectedStudent.gender },
                          { label: "Nationality", value: selectedStudent.nationality },
                          { label: "Address", value: selectedStudent.address, colSpan: "md:col-span-2" },
                        ].map((field, index) => (
                          <div key={index} className={field.colSpan || ""}>
                            <Label className="text-sm text-gray-500">{field.label}</Label>
                            <p className="font-medium">{field.value || "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
  
                    {/* Academic Information Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Academic Information</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                        {/* Course Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">Course Type</Label>
                            <p className="font-medium">
                              {getCourseCategoryLabel(selectedStudent.course_type)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Course Name</Label>
                            <p className="font-medium">
                              {selectedStudent.course_name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Registration Date</Label>
                            <p className="font-medium">
                              {new Date(selectedStudent.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
  
                        {/* Academic Details */}
                        {['tenth', 'twelfth', 'graduation'].map((level) => {
                          const data = selectedStudent.academic_details?.[level];
                          if (!data) return null;
  
                          return (
                            <div key={level}>
                              <Label className="text-sm text-gray-500 font-medium">
                                {level.charAt(0).toUpperCase() + level.slice(1)} Details
                              </Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                {Object.entries(data).map(([key, value]) => (
                                  <div key={key}>
                                    <Label className="text-sm text-gray-500">
                                      {key.charAt(0).toUpperCase() + key.replace(/_/g, ' ')}
                                    </Label>
                                    <p>{String(value) || "N/A"}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
  
                    {/* Status History Section */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-lg">Status History</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        {selectedStudent.status_history?.length ? (
                          <div className="space-y-2">
                            {selectedStudent.status_history
                              .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                              .map((entry, i) => (
                                <div key={i} className="flex flex-col gap-1 border-b pb-2 last:border-0">
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
                                  {entry.changed_by && (
                                    <div className="text-xs text-gray-400">
                                      By {entry.changed_by}
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
                          <div className="mt-1">
                            {getStatusBadge(selectedStudent.status)}
                          </div>
                        </div>
  
                        <DocumentVerificationCheckboxes />
  
                        <div className="mb-6">
                          <Label htmlFor="adminRemarks" className="block text-sm text-gray-500 mb-1">
                            Admin Remarks
                            {(selectedStudent.status === "pending" || selectedStudent.status === "rejected") && (
                              <span className="text-red-500"> *</span>
                            )}
                          </Label>
                          <Textarea
                            id="adminRemarks"
                            value={adminRemarks}
                            onChange={(e) => setAdminRemarks(e.target.value)}
                            placeholder="Add verification remarks here..."
                            className="mt-1"
                            rows={4}
                            required={
                              selectedStudent.status === "pending" ||
                              selectedStudent.status === "rejected"
                            }
                          />
                        </div>
  
                        <div className="flex flex-col sm:flex-row justify-end gap-4">
                        <Button
            variant="outline"
            onClick={() => handleStatusUpdate("pending")}
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200"
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Keep Pending"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleStatusUpdate("rejected")}
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Reject"}
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleStatusUpdate("approved")}
            disabled={isUpdating}
          >
            {isUpdating ? "Processing..." : "Approve"}
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
                          <div key={doc.id || Math.random()} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-medium capitalize">
                                {doc.type?.replace(/_/g, ' ')}
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
                                    (e.target as HTMLImageElement).src = '/document-placeholder.png';
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500 truncate">
                                {doc.name || "Document"}
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
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailsOpen(false)}
                    disabled={isUpdating}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VerificationAdmin;