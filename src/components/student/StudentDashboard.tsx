import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

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
  status: string;
  created_at: string;
  remarks?: string;
  phone?: string;
  gender?: string;
  address?: string;
  personal_details?: any;
  academic_details?: {
    tenth?: Record<string, any>;
    twelfth?: Record<string, any>;
    graduation?: Record<string, any>;
    post_graduation?: Record<string, any>;
    entrance?: Record<string, any>;
  };
  application_status?: string;
  application_remarks?: string;
<<<<<<< HEAD
  course_type?: string;
  course_name?: string;
=======
  status_history?: StatusHistoryItem[];
  updated_at?: string;
  course_type?: "UG" | "PG" | "Research";
>>>>>>> student-portal-changes
}

const StudentDashboard = ({ studentId }: { studentId?: string }) => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

<<<<<<< HEAD
  const getCourseCategoryLabel = (courseType?: string) => {
    switch(courseType) {
      case "UG": return "Undergraduate";
      case "PG": return "Postgraduate";
      case "Research": return "Research";
      default: return courseType || "N/A";
    }
  };

  const fetchStudentData = async () => {
=======
  const fetchStudentData = async (showToast = false) => {
>>>>>>> student-portal-changes
    try {
      showToast ? setRefreshing(true) : setLoading(true);
      setError(null);

      if (!studentId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        studentId = user.id;
      }

      console.log(`Fetching data for student: ${studentId}`);

      // Fetch student data with course_type
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      console.log("Student data received:", studentData);

      // Fetch application data with academic_details
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
<<<<<<< HEAD
        .select('personal_details, academic_details, status, admin_remarks, created_at, course_type, course_name')
=======
        .select('*')
>>>>>>> student-portal-changes
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (appError) throw appError;
      console.log("Application data received:", applicationData);

      const updatedStudent = {
        ...studentData,
<<<<<<< HEAD
        personal_details: applicationData?.personal_details,
        academic_details: applicationData?.academic_details,
        application_status: applicationData?.status || 'pending',
        application_remarks: applicationData?.admin_remarks,
        course_type: applicationData?.course_type,
        course_name: applicationData?.course_name
      });
=======
        personal_details: applicationData?.personal_details || {},
        academic_details: applicationData?.academic_details || {},
        // Use both sources for status, prioritizing application status
        application_status: applicationData?.status || studentData?.status || 'pending',
        application_remarks: applicationData?.remarks || studentData?.admin_remarks,
        status_history: applicationData?.status_history || [],
        course_type: applicationData?.course_type
      };
      
      console.log("Setting student state:", updatedStudent);
      setStudent(updatedStudent);
      
      if (showToast) toast.success("Data refreshed successfully");
>>>>>>> student-portal-changes

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load your application data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create properly typed event handlers
  const handleRetry = (e: React.MouseEvent<HTMLButtonElement>) => {
    fetchStudentData();
  };
  
  const handleStatusRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    fetchStudentData(true);
  };

  // Set up real-time subscriptions
  React.useEffect(() => {
    fetchStudentData();
    
    // Generate unique channel IDs to avoid conflicts
    const appChannelId = `student_app_updates_${Math.random().toString(36).substring(2, 9)}`;
    const studentChannelId = `student_data_updates_${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`Setting up real-time channels: ${appChannelId}, ${studentChannelId}`);

    const channel = supabase
      .channel(appChannelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `student_id=eq.${studentId}`
        },
        (payload) => {
          console.log('Application change received!', payload);
          fetchStudentData();
        }
      )
      .subscribe();
      
    // Add subscription to students table as well
    const studentsChannel = supabase
      .channel(studentChannelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `id=eq.${studentId}`
        },
        (payload) => {
          console.log('Student record changed!', payload);
          fetchStudentData();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscriptions");
      supabase.removeChannel(channel);
      supabase.removeChannel(studentsChannel);
    };
  }, [studentId]);

  // Manual refresh function with correct event type
  const handleManualRefresh = (e: React.MouseEvent<HTMLButtonElement>) => {
    fetchStudentData(true);
  };

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

  const renderAcademicDetails = (details: any, section?: string) => {
    if (!details) return null;
    
    return Object.entries(details).map(([key, value]) => {
      const displayKey = key === 'bboard' ? 'board' : key;
      
      // Determine the label based on the section
      let finalKey = displayKey.replace(/_/g, ' ');
      
      // Change 'school' to 'university name' for graduation and post_graduation
      if ((section === 'graduation' || section === 'post_graduation') && key === 'degree') {
        finalKey = 'university name';
      }

      //school to college name
      if ((section === 'graduation' || section === 'post_graduation') && key === 'school') {
        finalKey = 'college name';
      }
      
      // Change 'percentage' to 'percentage/cgpa' for all sections
      if (key === 'percentage') {
        finalKey = 'percentage/cgpa';
      }
      
      return (
        <div key={key}>
          <h4 className="text-sm font-medium text-gray-500">
            {finalKey.charAt(0).toUpperCase() + finalKey.slice(1)}
          </h4>
          <p>{String(value) || 'N/A'}</p>
        </div>
      );
    });
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
              <Button onClick={handleRetry}>Retry</Button>
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
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh} 
              disabled={refreshing || loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="capitalize">
              {student.course_type || 'N/A'}
            </Badge>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Application Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(student.application_status || 'pending')}`}>
                  {(student.application_status || 'pending').toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {student.updated_at ? new Date(student.updated_at).toLocaleString() : 'N/A'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-8 w-8 p-0" 
                  onClick={handleStatusRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="sr-only">Refresh Status</span>
                </Button>
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
            <div>
              <h1 className="text-2xl font-bold text-[#0A2240]">
                Application Details
              </h1>
              {student.course_type && (
                <p className="text-sm text-gray-500 mt-1">
                  Course Type: <span className="font-medium capitalize">{student.course_type}</span>
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Submitted: {new Date(student.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Personal Information */}
          <div className="print-section mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<<<<<<< HEAD
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
                  {getNestedValue(student, 'personal_details.sex')} / {getNestedValue(student, 'personal_details.age')}
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
              <div>
                <h3 className="text-sm font-medium text-gray-500">Address</h3>
                <p className="text-lg">
                  {student.address || "Not provided"}
                </p>
              </div>
=======
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
>>>>>>> student-portal-changes
            </div>
          </div>

          {/* Academic Information */}
          <div className="print-section mb-8">
<<<<<<< HEAD
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">
              Academic Information
            </h2>
            <div className="space-y-6">
              {/* Course Information */}
              <div>
                <h3 className="text-lg font-medium mb-2">Course Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Course Type</h4>
                    <p>{getCourseCategoryLabel(student.course_type)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Course Name</h4>
                    <p>{student.course_name || "Not provided"}</p>
                  </div>
                </div>
              </div>

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
=======
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Academic Information</h2>
            
            {/* 10th Details (All students) */}
            {student.academic_details?.tenth && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">10th Standard Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  {renderAcademicDetails(student.academic_details.tenth)}
>>>>>>> student-portal-changes
                </div>
              </div>
            )}

            {/* 12th Details (All students except maybe some UG) */}
            {student.academic_details?.twelfth && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">12th Standard Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  {renderAcademicDetails(student.academic_details.twelfth)}
                </div>
              </div>
            )}

            {/* UG Details (PG and Research students) */}
            {(student.course_type === 'PG' || student.course_type === 'Research') && student.academic_details?.graduation && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  {student.course_type === 'PG' ? 'Undergraduate Details' : 'Bachelor\'s Degree Details'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                {renderAcademicDetails(student.academic_details.graduation, 'graduation')}
                </div>
              </div>
            )}

            {/* PG Details (Research students only) */}
            {student.course_type === 'Research' && student.academic_details?.post_graduation && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Master's Degree Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                {renderAcademicDetails(student.academic_details.post_graduation, 'post_graduation')}

                </div>
              </div>
            )}

            {/* Entrance Exam Details */}
            {student.academic_details?.entrance && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  {student.course_type === 'Research' ? 'Research Entrance Exam' : 'Entrance Exam'} Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  {renderAcademicDetails(student.academic_details.entrance)}
                </div>
              </div>
            )}
          </div>

          {/* Application Status */}
          <div className="print-section">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4">Application Status</h2>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(student.application_status || 'pending')}`}>
                {(student.application_status || 'pending').toUpperCase()}
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
<<<<<<< HEAD
          {/* <Button onClick={handlePrint}>
            Download Application
          </Button> */}

           {/* Button to trigger print */}
             <Button onClick={() => handlePrint?.()}>
               Download Application
             </Button>
=======
          <Button onClick={() => handlePrint()}>
            Download Application
          </Button>
>>>>>>> student-portal-changes
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;