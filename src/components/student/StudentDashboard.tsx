import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusHistoryItem {
  status: string;
  changed_at: string;
  remarks?: string;
  changed_by?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  department?: string;
  gender?: string;
  status: string;
  created_at: string;
  remarks?: string;
  phone?: string;
  personal_details?: any;
  academic_details?: any;
  application_status?: string;
  application_remarks?: string;
  status_history?: StatusHistoryItem[];
  updated_at?: string;
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

      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Fetch application data
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appError) throw appError;

      setStudent({
        ...studentData,
        personal_details: applicationData?.personal_details || {},
        academic_details: applicationData?.academic_details || {},
        application_status: applicationData?.status || 'pending',
        application_remarks: applicationData?.remarks,
        status_history: applicationData?.status_history || []
      });

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load your application data");
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  React.useEffect(() => {
    fetchStudentData();

    const channel = supabase
      .channel('student_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchStudentData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handlePrint = useReactToPrint({
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none !important; }
        .print-section { break-inside: avoid; }
      }
    `,
    onAfterPrint: () => toast.success("Application downloaded successfully")
  });
  
  const getNestedValue = (obj: any, path: string, defaultValue = 'Not provided') => {
    return path.split('.').reduce((o, p) => (o && o[p] !== undefined ? o[p] : defaultValue), obj);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
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
            <p className="mb-4">{error || "Student record not found"}</p>
            <div className="flex space-x-2">
              <Button onClick={fetchStudentData}>Retry</Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(student.application_status)}`}>
                  {student.application_status?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {student.updated_at ? new Date(student.updated_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Registration Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(student.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Admin Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm line-clamp-2">
                {student.application_remarks || "No remarks provided"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status History */}
        {student.status_history?.length > 0 && (
          <Card className="mb-6 no-print">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.status_history
                  .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                  .map((item, index) => (
                    <div key={index} className="flex justify-between items-start border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                        <div>
                          {item.remarks && (
                            <p className="text-sm text-gray-600">{item.remarks}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {item.changed_by ? `By ${item.changed_by}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(item.changed_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Printable Content */}
        <div ref={printRef} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#0A2240]">
              Application Details
            </h1>
            <p className="text-sm text-gray-500">
              Submitted: {new Date(student.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Personal Information */}
          <div className="print-section mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name", value: student.name },
                { label: "Email", value: student.email },
                { label: "Phone", value: student.phone || getNestedValue(student, 'personal_details.contact_number') },
                { label: "Gender", value: student.gender || getNestedValue(student, 'personal_details.sex') },
                { label: "Date of Birth", value: getNestedValue(student, 'personal_details.dob') },
                { label: "Father's Name", value: getNestedValue(student, 'personal_details.father_name') },
                { label: "Mother's Name", value: getNestedValue(student, 'personal_details.mother_name') },
                { label: "Address", value: getNestedValue(student, 'personal_details.address'), colSpan: "md:col-span-2" }
              ].map((field, index) => (
                <div key={index} className={field.colSpan || ""}>
                  <h3 className="text-sm font-medium text-gray-500">{field.label}</h3>
                  <p className="mt-1">{field.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Information */}
          <div className="print-section mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Academic Information</h2>
            {['tenth', 'twelfth', 'graduation'].map((level) => {
              const data = getNestedValue(student, `academic_details.${level}`);
              if (data === 'Not provided') return null;

              return (
                <div key={level} className="mb-6">
                  <h3 className="text-lg font-medium mb-3">
                    {level.charAt(0).toUpperCase() + level.slice(1)} Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    {Object.entries(data || {}).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="text-sm font-medium text-gray-500">
                          {key.charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}
                        </h4>
                        <p>{String(value) || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Application Status */}
          <div className="print-section">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Application Status</h2>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(student.application_status)}`}>
                {student.application_status?.toUpperCase()}
              </span>
              {student.application_remarks && (
                <p className="text-sm">
                  <span className="font-medium">Remarks:</span> {student.application_remarks}
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