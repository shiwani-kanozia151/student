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

interface Application {
  id: string;
  student_id: string;
  course_id: string;
  personal_details: any;
  academic_details: any;
  documents: {
    type: string;
    url: string;
  }[];
  status: "pending" | "approved" | "rejected";
  remarks: string;
  admin_remarks?: string;
  created_at: string;
}

const VerificationAdmin = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    React.useState<Application | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [adminRemarks, setAdminRemarks] = React.useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch applications
      const { data: applicationsData, error: applicationsError } =
        await supabase
          .from("applications")
          .select("*")
          .order("created_at", { ascending: false });

      if (applicationsError) throw applicationsError;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (studentsError) throw studentsError;

      setApplications(applicationsData || []);
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
    applicationId: string,
    studentId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      setError(null);

      // Update application status
      const { error: applicationError } = await supabase
        .from("applications")
        .update({
          status,
          admin_remarks: adminRemarks,
        })
        .eq("id", applicationId);

      if (applicationError) throw applicationError;

      // Update student status
      const { error: studentError } = await supabase
        .from("students")
        .update({ status })
        .eq("id", studentId);

      if (studentError) throw studentError;

      // Close the dialog and refresh data
      setIsDetailsOpen(false);
      setSelectedApplication(null);
      setSelectedStudent(null);
      setAdminRemarks("");
      await fetchData();
    } catch (err) {
      console.error(`Error ${status} application:`, err);
      setError(err.message);
    }
  };

  const viewApplicationDetails = (applicationId: string) => {
    const application = applications.find((app) => app.id === applicationId);
    if (!application) return;

    const student = students.find((s) => s.id === application.student_id);
    if (!student) return;

    setSelectedApplication(application);
    setSelectedStudent(student);
    setAdminRemarks(application.admin_remarks || "");
    setIsDetailsOpen(true);
  };

  const filteredApplications = applications.filter((application) => {
    const student = students.find((s) => s.id === application.student_id);
    if (!student) return false;

    const searchFields = [
      student.name,
      student.email,
      student.department,
      application.course_id,
      application.status,
      application.personal_details?.firstName,
      application.personal_details?.lastName,
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
                placeholder="Search by name, email, department, or course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredApplications.length} applications
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((application) => {
                const student = students.find(
                  (s) => s.id === application.student_id,
                );
                if (!student) return null;

                return (
                  <TableRow key={application.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{application.course_id.toUpperCase()}</TableCell>
                    <TableCell>
                      {new Date(application.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          application.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : application.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => viewApplicationDetails(application.id)}
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Application Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0A2240]">
              Application Details
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && selectedStudent && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-6">
                <TabsTrigger value="personal">Personal Details</TabsTrigger>
                <TabsTrigger value="academic">Academic Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <Label className="text-sm text-gray-500">Full Name</Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.firstName}{" "}
                      {selectedApplication.personal_details.middleName}{" "}
                      {selectedApplication.personal_details.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Sex / Age</Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.sex} /{" "}
                      {selectedApplication.personal_details.age}
                    </p>
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
                      Contact Number
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.contactNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Parent's Contact
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details
                        .parentContactNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Father's Name
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.fatherName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Mother's Name
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.motherName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Father's Occupation
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.fatherOccupation ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">
                      Mother's Occupation
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.personal_details.motherOccupation ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">10th Standard Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">
                          School Name
                        </Label>
                        <p className="font-medium">
                          {selectedApplication.academic_details.tenthSchool}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Percentage
                        </Label>
                        <p className="font-medium">
                          {selectedApplication.academic_details.tenthPercentage}
                          %
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Board</Label>
                        <p className="font-medium">
                          {selectedApplication.academic_details.tenthBoard}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">12th Standard Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">
                          School Name
                        </Label>
                        <p className="font-medium">
                          {selectedApplication.academic_details.twelfthSchool}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          Percentage
                        </Label>
                        <p className="font-medium">
                          {
                            selectedApplication.academic_details
                              .twelfthPercentage
                          }
                          %
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Board</Label>
                        <p className="font-medium">
                          {selectedApplication.academic_details.twelfthBoard}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedApplication.academic_details.graduationSchool && (
                    <div>
                      <h3 className="font-medium mb-2">Graduation Details</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">
                            College/University
                          </Label>
                          <p className="font-medium">
                            {
                              selectedApplication.academic_details
                                .graduationSchool
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">
                            Percentage/CGPA
                          </Label>
                          <p className="font-medium">
                            {
                              selectedApplication.academic_details
                                .graduationPercentage
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">
                            Degree
                          </Label>
                          <p className="font-medium">
                            {
                              selectedApplication.academic_details
                                .graduationDegree
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedApplication.academic_details.entranceExam && (
                    <div>
                      <h3 className="font-medium mb-2">Entrance Examination</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">
                            Exam Name
                          </Label>
                          <p className="font-medium">
                            {selectedApplication.academic_details.entranceExam}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Score</Label>
                          <p className="font-medium">
                            {selectedApplication.academic_details.entranceScore}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Rank</Label>
                          <p className="font-medium">
                            {selectedApplication.academic_details.entranceRank}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedApplication.documents.map((doc, index) => (
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
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <Label className="text-sm text-gray-500">
                      Application Status
                    </Label>
                    <p className="font-medium">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          selectedApplication.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : selectedApplication.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedApplication.status.charAt(0).toUpperCase() +
                          selectedApplication.status.slice(1)}
                      </span>
                    </p>
                  </div>

                  <div className="mb-4">
                    <Label className="text-sm text-gray-500">
                      Student Remarks
                    </Label>
                    <p className="font-medium">
                      {selectedApplication.remarks || "No remarks provided"}
                    </p>
                  </div>

                  <div className="mb-6">
                    <Label
                      htmlFor="adminRemarks"
                      className="text-sm text-gray-500"
                    >
                      Admin Remarks
                    </Label>
                    <Textarea
                      id="adminRemarks"
                      value={adminRemarks}
                      onChange={(e) => setAdminRemarks(e.target.value)}
                      placeholder="Add verification remarks here..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleStatusUpdate(
                          selectedApplication.id,
                          selectedStudent.id,
                          "rejected",
                        )
                      }
                      disabled={selectedApplication.status === "rejected"}
                    >
                      Reject Application
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        handleStatusUpdate(
                          selectedApplication.id,
                          selectedStudent.id,
                          "approved",
                        )
                      }
                      disabled={selectedApplication.status === "approved"}
                    >
                      Approve Application
                    </Button>
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
