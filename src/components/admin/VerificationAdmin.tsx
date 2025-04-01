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

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_remarks?: string;
  documents?: {
    type: string;
    url: string;
  }[];
}

const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, name, email, department, status, created_at, admin_remarks, documents")
        .order("created_at", { ascending: false });

      if (studentsError) {
        throw new Error(studentsError.message);
      }

      setStudents(studentsData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel("students_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusUpdate = async (
    studentId: string,
    status: "pending" | "approved" | "rejected",
  ) => {
    try {
      // Add duplicate check (new)
      const { data: existing } = await supabase
        .from('students')
        .select('id, status')
        .eq('email', selectedStudent?.email || '')
        .single();
  
      if (existing && existing.status === status) {
        toast.error(`Student already has ${status} status`);
        return;
      }

   
      // 1. Enhanced validation (NEW)
      if ((status === "pending" || status === "rejected") && !adminRemarks.trim()) {
        throw new Error("Remarks are required for pending or rejected status");
      }
  
      // 2. Optimized Supabase query (MODIFIED)
      const { data: updatedStudent, error: updateError } = await supabase
        .from("students")
        .update({
          status,
          admin_remarks: adminRemarks.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)
        .select() // NEW: Returns the updated record
        .single();
  
      if (updateError) throw updateError;
  
      // 3. State management improvements (MODIFIED)
      setStudents(prev => 
        prev.map(s => s.id === studentId ? updatedStudent : s)
      );
  
      // 4. User feedback (EXISTING)
      toast.success(`Status updated to ${status}`);
      setIsDetailsOpen(false);
      setSelectedStudent(null);
      setAdminRemarks("");
  
    } catch (err) {
      // 5. Better error handling (ENHANCED)
      console.error("Update error:", err);
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      toast.error(message);
    }
  };

  const viewStudentDetails = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      toast.error("Student not found");
      return;
    }

    setSelectedStudent(student);
    setAdminRemarks(student.admin_remarks || "");
    setIsDetailsOpen(true);
  };

  const filteredStudents = students.filter((student) => {
    if (!searchTerm) return true;
    
    const searchFields = [
      student.name,
      student.email,
      student.department,
      student.status,
    ];

    return searchFields.some((field) =>
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
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
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredStudents.length} {filteredStudents.length === 1 ? "student" : "students"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Submission Date</TableHead>
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
                      <TableCell>{student.department}</TableCell>
                      <TableCell>
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
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
                          className="flex items-center gap-1"
                          onClick={() => viewStudentDetails(student.id)}
                        >
                          <Eye className="h-4 w-4" /> View
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

      {/* Student Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0A2240]">
              Student Verification
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-500">Full Name</Label>
                    <p className="font-medium">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p className="font-medium">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Department</Label>
                    <p className="font-medium">{selectedStudent.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Registration Date
                    </Label>
                    <p className="font-medium">
                      {new Date(selectedStudent.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {selectedStudent.documents?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedStudent.documents.map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">{doc.type}</h3>
                        </div>
                        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
                          {doc.url.toLowerCase().endsWith(".pdf") ? (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-gray-500">PDF Document</p>
                            </div>
                          ) : (
                            <img
                              src={doc.url}
                              alt={doc.type}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          View Full Document
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500">No documents available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <Label className="text-sm text-gray-500">
                      Current Status
                    </Label>
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

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedStudent.id, "pending")}
                      disabled={selectedStudent.status === "pending"}
                      className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Keep Pending
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedStudent.id, "rejected")}
                        disabled={selectedStudent.status === "rejected"}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(selectedStudent.id, "approved")}
                        disabled={selectedStudent.status === "approved"}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
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