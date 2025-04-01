import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  admin_remarks?: string;
  documents?: Array<{
    type: string;
    url: string;
  }>;
  status_history?: Array<{
    status: string;
    changed_at: string;
    remarks?: string;
  }>;
}

const StudentDashboard = ({ studentId }: { studentId?: string }) => {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = React.useState<{
    type: string;
    url: string;
  } | null>(null);

  const subscribeToStudentStatusUpdates = (
    studentId: string,
    callback: (payload: any) => void
  ) => {
    const channel = supabase
      .channel(`student:${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "students",
          filter: `id=eq.${studentId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  React.useEffect(() => {
    let currentStudentId = studentId;
    let unsubscribe: () => void;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!currentStudentId) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");
          currentStudentId = user.id;
        }

        const { data, error: fetchError } = await supabase
          .from("students")
          .select("*")
          .eq("id", currentStudentId)
          .single();

        if (fetchError) throw fetchError;
        setStudent(data);

        unsubscribe = subscribeToStudentStatusUpdates(
          currentStudentId,
          (payload) => {
            if (payload.new) {
              setStudent(payload.new);
            }
          }
        );
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [studentId]);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Student Dashboard
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{student.department}</div>
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
                {student.admin_remarks || "No remarks yet"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Full Name
                    </h3>
                    <p className="text-lg">{student.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-lg">{student.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Application Documents</CardTitle>
                <p className="text-sm text-gray-500">
                  {student.documents?.length || 0} documents uploaded
                </p>
              </CardHeader>
              <CardContent>
                {student.documents?.length ? (
                  <div className="space-y-4">
                    {student.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{doc.type}</p>
                          <p className="text-sm text-gray-500">
                            {new URL(doc.url).pathname.split("/").pop()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          Preview
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No documents uploaded</p>
                    <Button className="mt-2" variant="link">
                      Upload Documents
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {student.status_history && student.status_history.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {student.status_history.map((entry, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          entry.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : entry.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {entry.status.charAt(0).toUpperCase() +
                          entry.status.slice(1)}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.changed_at).toLocaleString()}
                      </p>
                    </div>
                    {entry.remarks && (
                      <p className="text-sm text-gray-600">{entry.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewDoc?.type}</DialogTitle>
            </DialogHeader>
            <div className="h-full">
              {previewDoc?.url.endsWith(".pdf") ? (
                <iframe src={previewDoc.url} className="w-full h-full" />
              ) : (
                <img
                  src={previewDoc?.url || ""}
                  alt={previewDoc?.type || "Document"}
                  className="object-contain w-full h-full"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentDashboard;