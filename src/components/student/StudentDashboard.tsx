import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

interface Student {
  id: string;
  name: string;
  email: string;
  department?: string;
  gender?: string;
  status: string;
  created_at: string;
  admin_remarks?: string;
  phone?: string;
  personal_details?: any;
  academic_details?: any;
  application_status?: string;
  application_remarks?: string;
}

const StudentDashboard = ({ studentId }: { studentId?: string }) => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!studentId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        studentId = user.id;
      }

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select('personal_details, academic_details, status, admin_remarks, created_at')
        .eq('student_id', studentId)
        .single();

      if (appError) throw appError;

      setStudent({
        ...studentData,
        personal_details: applicationData?.personal_details,
        academic_details: applicationData?.academic_details,
        application_status: applicationData?.status || 'pending',
        application_remarks: applicationData?.admin_remarks,
        gender: studentData?.gender || applicationData?.personal_details?.sex 
      });

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const printOptions = {
    content: () => printRef.current,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-section { break-inside: avoid; }
      }
    `,
    onAfterPrint: () => toast.success("Application downloaded successfully")
  };

  const handlePrint = useReactToPrint(printOptions);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Student record not found"}</p>
            <div className="mt-4 space-x-2">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper function to safely access nested properties
  const getNestedValue = (obj: any, path: string, defaultValue = 'Not provided') => {
    return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : defaultValue), obj);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 no-print">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Student Dashboard
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    student.application_status === "approved"
                      ? "bg-green-100 text-green-800"
                      : student.application_status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {student.application_status?.charAt(0).toUpperCase() +
                    student.application_status?.slice(1)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Registration Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(student.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admin Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {student.application_remarks || "No remarks yet"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div ref={printRef} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#0A2240]">
              Application Details
            </h1>
            <p className="text-sm text-gray-500">
              Submitted on: {new Date(student.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Personal Information Section */}
          <div className="print-section mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                <p className="text-lg">
                  {getNestedValue(student, 'personal_details.name')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-lg">{student.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Gender/Age</h3>
                <p className="text-lg">
                  {student.gender || getNestedValue(student, 'personal_details.sex')} / 
                   {getNestedValue(student, 'personal_details.age')}
                  </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Number</h3>
                <p className="text-lg">
                  {getNestedValue(student, 'personal_details.contact_number')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Father's Name</h3>
                <p className="text-lg">
                  {getNestedValue(student, 'personal_details.father_name')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mother's Name</h3>
                <p className="text-lg">
                  {getNestedValue(student, 'personal_details.mother_name')}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="print-section mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">
              Academic Information
            </h2>
            <div className="space-y-6">
              {/* 10th Standard */}
              <div>
                <h3 className="text-lg font-medium mb-2">10th Standard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">School</h4>
                    <p>{getNestedValue(student, 'academic_details.tenth.school')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Percentage</h4>
                    <p>{getNestedValue(student, 'academic_details.tenth.percentage')}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Board</h4>
                    <p>{getNestedValue(student, 'academic_details.tenth.board')}</p>
                  </div>
                </div>
              </div>

              {/* 12th Standard */}
              <div>
                <h3 className="text-lg font-medium mb-2">12th Standard</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">School</h4>
                    <p>{getNestedValue(student, 'academic_details.twelfth.school')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Percentage</h4>
                    <p>{getNestedValue(student, 'academic_details.twelfth.percentage')}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Board</h4>
                    <p>{getNestedValue(student, 'academic_details.twelfth.board')}</p>
                  </div>
                </div>
              </div>

              {/* Graduation Details (if exists) */}
              {getNestedValue(student, 'academic_details.graduation.school') !== 'Not provided' && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Graduation Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">College</h4>
                      <p>{getNestedValue(student, 'academic_details.graduation.school')}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Percentage</h4>
                      <p>{getNestedValue(student, 'academic_details.graduation.percentage')}%</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Degree</h4>
                      <p>{getNestedValue(student, 'academic_details.graduation.degree')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Status Section */}
          <div className="print-section">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">
              Application Status
            </h2>
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  student.application_status === "approved"
                    ? "bg-green-100 text-green-800"
                    : student.application_status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {student.application_status?.charAt(0).toUpperCase() + student.application_status?.slice(1)}
              </span>
              {student.application_remarks && (
                <p className="text-sm text-gray-600">
                  Remarks: {student.application_remarks}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end no-print">
        <Button onClick={() => handlePrint()}>
                Download Application
             </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;