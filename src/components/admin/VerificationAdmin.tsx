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

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
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
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      setStudents(studentsData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (
    studentId: string,
    status: "pending" | "approved" | "rejected",
  ) => {
    try {
      setError(null);

      // Update student status
      const { error: studentError } = await supabase
        .from("students")
        .update({
          status,
          admin_remarks: adminRemarks,
        })
        .eq("id", studentId);

      if (studentError) throw studentError;

      // Close the dialog and refresh data
      setIsDetailsOpen(false);
      setSelectedStudent(null);
      setAdminRemarks("");
      await fetchData();
    } catch (err) {
      console.error(`Error ${status} student:`, err);
      setError(err.message);
    }
  };

  const viewStudentDetails = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setSelectedStudent(student);
    setAdminRemarks(student.admin_remarks || "");
    setIsDetailsOpen(true);
  };

  const filteredStudents = students.filter((student) => {
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
                {filteredStudents.length} students
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
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
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
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
                      <Eye className="h-4 w-4" /> View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Student Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0A2240]">
              Student Details
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
                      {new Date(
                        selectedStudent.created_at,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {selectedStudent.documents &&
                selectedStudent.documents.length > 0 ? (
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
                      Student Status
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
                    <Label
                      htmlFor="adminRemarks"
                      className="text-sm text-gray-500"
                    >
                      Admin Remarks (required for pending or rejected status)
                    </Label>
                    <Textarea
                      id="adminRemarks"
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      placeholder="Add verification remarks here explaining why the application is pending or rejected..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!adminRemarks.trim()) {
                          setError(
                            "Please provide remarks when keeping an application pending",
                          );
                          return;
                        }
                        handleStatusUpdate(selectedStudent.id, "pending");
                      }}
                      disabled={selectedStudent.status === "pending"}
                      className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Keep Pending
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (!adminRemarks.trim()) {
                            setError(
                              "Please provide remarks when rejecting an application",
                            );
                            return;
                          }
                          handleStatusUpdate(selectedStudent.id, "rejected");
                        }}
                        disabled={selectedStudent.status === "rejected"}
                      >
                        Reject Student
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleStatusUpdate(selectedStudent.id, "approved")
                        }
                        disabled={selectedStudent.status === "approved"}
                      >
                        Approve Student
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
