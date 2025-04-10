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
import { Search, Eye } from "lucide-react";
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

interface Document {
  id?: string;
  type: string;
  url: string;
  file_name?: string;
  uploaded_at?: string;
  student_id?: string;
  application_id?: string;
}

interface StatusHistoryItem {
  status: string;
  changed_at: string;
  changed_by?: string;
  remarks?: string;
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
  course_level?: string | null;
  course_type?: string | null;
  course_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  nationality?: string | null;
  updated_at?: string;
  personal_details?: {
    father_name?: string;
    mother_name?: string;
    age?: string;
    contact_number?: string;
    [key: string]: any;
  };
  academic_details?: {
    [key: string]: any;
  };
}

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

const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");
  const [documentsLoading, setDocumentsLoading] = React.useState(false);

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

  // Set up real-time subscription
  React.useEffect(() => {
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
      (student.department?.toLowerCase().includes(search) || false) ||
      (student.course_id?.toLowerCase().includes(search) || false) ||
      (student.course_name?.toLowerCase().includes(search) || false)
    );
  });

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
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#0A2240]">
              Student Verification Dashboard
            </h1>
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
                  placeholder="Search by name, email, or course type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchStudents}>
                Refresh
              </Button>
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
            </div>
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
                    </div>

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
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default VerificationAdmin;