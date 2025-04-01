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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Document {
  type: string;
  url: string;
  name?: string;
  uploaded_at?: string;
}

interface Student {
  id: string;
  created_at: string;
  documents: Document[];
  address: string;
  is_verified: boolean;
  status_history: any[];
  phone: string;
  registration_number: string;
  admin_remarks?: string;
  name: string;
  email: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  // Add all fields from application form
  course?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  // Add any other fields that students fill in the form
}

const getCourseCategoryLabel = (department: string) => {
  switch(department) {
    case "UG": return "Undergraduate";
    case "PG": return "Postgraduate";
    case "Research": return "Research";
    default: return department || "N/A";
  }
};

const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");
  const [documentsLoading, setDocumentsLoading] = React.useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      // Fetch documents for each student
      const studentsWithDocuments = await Promise.all(
        (studentsData || []).map(async (student) => {
          const { data: documents } = await supabase
            .from("documents")
            .select("*")
            .eq("student_id", student.id);
          return { ...student, documents: documents || [] };
        })
      );

      setStudents(studentsWithDocuments);
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
        { event: "*", schema: "public", table: "students" },
        fetchStudents
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = async (
    studentId: string,
    status: "pending" | "approved" | "rejected"
  ) => {
    try {
      if ((status === "pending" || status === "rejected") && !adminRemarks.trim()) {
        throw new Error("Remarks are required for pending or rejected status");
      }

      const { error } = await supabase
        .from("students")
        .update({
          status,
          admin_remarks: adminRemarks.trim(),
          is_verified: status === "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId);

      if (error) throw error;

      toast.success(`Status updated to ${status}`);
      setIsDetailsOpen(false);
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const viewStudentDetails = async (studentId: string) => {
    try {
      setDocumentsLoading(true);
      const student = students.find((s) => s.id === studentId);
      if (!student) {
        toast.error("Student not found");
        return;
      }

      // Fetch fresh documents data when viewing
      const { data: documents } = await supabase
        .from("documents")
        .select("*")
        .eq("student_id", studentId);

      setSelectedStudent({
        ...student,
        documents: documents || []
      });
      setAdminRemarks(student.admin_remarks || "");
      setIsDetailsOpen(true);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    return (
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.course && student.course.toLowerCase().includes(searchTerm.toLowerCase()))
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
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{getCourseCategoryLabel(student.department)}</TableCell>
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
                          {student.status.charAt(0).toUpperCase() +
                            student.status.slice(1)}
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
                    <TableCell colSpan={5} className="text-center py-8">
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
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0A2240]">
              Application Review - {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="details">Application Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-gray-500">Full Name</Label>
                      <p className="font-medium">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <p className="font-medium">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Phone</Label>
                      <p className="font-medium">{selectedStudent.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Registration Number</Label>
                      <p className="font-medium">{selectedStudent.registration_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Date of Birth</Label>
                      <p className="font-medium">{selectedStudent.dob || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Gender</Label>
                      <p className="font-medium">{selectedStudent.gender || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Nationality</Label>
                      <p className="font-medium">{selectedStudent.nationality || "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm text-gray-500">Address</Label>
                      <p className="font-medium">{selectedStudent.address}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Academic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <Label className="text-sm text-gray-500">Course Type</Label>
                      <p className="font-medium">{getCourseCategoryLabel(selectedStudent.department)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Course Name</Label>
                      <p className="font-medium">{selectedStudent.course || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Registration Date</Label>
                      <p className="font-medium">
                        {new Date(selectedStudent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

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
                          {selectedStudent.status.charAt(0).toUpperCase() +
                            selectedStudent.status.slice(1)}
                        </span>
                      </p>
                    </div>

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
                        onClick={() => handleStatusUpdate(selectedStudent.id, "pending")}
                        className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200"
                      >
                        Keep Pending
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedStudent.id, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(selectedStudent.id, "approved")}
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
                ) : selectedStudent.documents?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedStudent.documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium capitalize">
                            {doc.type.replace(/_/g, ' ')}
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationAdmin;