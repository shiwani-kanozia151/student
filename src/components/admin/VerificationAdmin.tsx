import React from "react";
import { Button } from "@/components/ui/button";
import { isAuthorized } from "@/lib/adminAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Student {
  id: number;
  name: string;
  email: string;
  department: string;
  submissionDate: string;
  status: "Pending" | "Approved" | "Rejected";
  documents?: {
    type: string;
    url: string;
  }[];
}

const VerificationAdmin = () => {
  const adminEmail = localStorage.getItem("adminEmail");
  const adminRole = localStorage.getItem("adminRole");

  React.useEffect(() => {
    if (!adminEmail || !isAuthorized(adminEmail, "verification")) {
      window.location.href = "/admin/login";
    }
  }, [adminEmail]);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [pendingVerifications, setPendingVerifications] = React.useState<
    Student[]
  >([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      department: "Computer Science",
      submissionDate: "2024-03-20",
      status: "Pending",
      documents: [
        { type: "ID Proof", url: "#" },
        { type: "Academic Records", url: "#" },
      ],
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      department: "Electrical Engineering",
      submissionDate: "2024-03-21",
      status: "Pending",
      documents: [
        { type: "ID Proof", url: "#" },
        { type: "Academic Records", url: "#" },
      ],
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      department: "Mechanical Engineering",
      submissionDate: "2024-03-22",
      status: "Pending",
      documents: [
        { type: "ID Proof", url: "#" },
        { type: "Academic Records", url: "#" },
      ],
    },
  ]);

  const handleApprove = (id: number) => {
    setPendingVerifications((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, status: "Approved" } : student,
      ),
    );
  };

  const handleReject = (id: number) => {
    setPendingVerifications((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, status: "Rejected" } : student,
      ),
    );
  };

  const filteredVerifications = pendingVerifications.filter((student) =>
    Object.values(student).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Student Verification Dashboard
          </h1>
          <Button
            onClick={() => (window.location.href = "/admin")}
            variant="outline"
          >
            Switch Role
          </Button>
        </div>

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
                {filteredVerifications.length} students
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
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVerifications.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell>{student.submissionDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {student.documents?.map((doc, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          {doc.type}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : student.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {student.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={`${
                          student.status === "Approved"
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        onClick={() => handleApprove(student.id)}
                        disabled={student.status === "Approved"}
                      >
                        {student.status === "Approved" ? "Approved" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(student.id)}
                        disabled={student.status === "Rejected"}
                        className={
                          student.status === "Rejected"
                            ? "bg-gray-300 cursor-not-allowed"
                            : ""
                        }
                      >
                        {student.status === "Rejected" ? "Rejected" : "Reject"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default VerificationAdmin;
