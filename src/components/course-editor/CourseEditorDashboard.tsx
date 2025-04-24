import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CourseEditor {
  id: string;
  email: string;
  courseId: string;
  courseName: string;
}

interface CourseDetails {
  id: string;
  name: string;
  description: string;
  duration: string;
  eligibility: string;
  curriculum: string;
}

export default function CourseEditorDashboard() {
  const navigate = useNavigate();
  const [editor, setEditor] = useState<CourseEditor | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: string; message: string }>({ type: "", message: "" });

  useEffect(() => {
    // Check if editor is logged in
    const editorData = localStorage.getItem("courseEditor");
    if (!editorData) {
      navigate("/course-editor/login");
      return;
    }

    const parsedEditorData = JSON.parse(editorData);
    setEditor(parsedEditorData);

    // Fetch course details
    fetchCourseDetails(parsedEditorData.courseId);
  }, [navigate]);

  const fetchCourseDetails = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name, description, duration, eligibility, curriculum")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      setCourseDetails(data);
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: "Failed to load course details: " + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!courseDetails || !editor) return;

    setSaving(true);
    setStatusMessage({ type: "", message: "" });

    try {
      const { error } = await supabase
        .from("courses")
        .update({
          description: courseDetails.description,
          duration: courseDetails.duration,
          eligibility: courseDetails.eligibility,
          curriculum: courseDetails.curriculum
        })
        .eq("id", courseDetails.id);

      if (error) throw error;

      setStatusMessage({
        type: "success",
        message: "Course details saved successfully!"
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: "Failed to save changes: " + error.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("courseEditor");
    navigate("/course-editor/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!editor || !courseDetails) {
    return <div className="min-h-screen flex items-center justify-center">Error loading course details</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Course Editor Dashboard</h1>
              <p className="text-gray-600">Welcome, {editor.email}</p>
              <p className="text-gray-600">Course: {courseDetails.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {statusMessage.message && (
          <Alert className={`mb-6 ${
            statusMessage.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
          }`}>
            <AlertDescription>{statusMessage.message}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Edit Course Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
              <Input
                value={courseDetails.name}
                readOnly
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                value={courseDetails.description}
                onChange={(e) => setCourseDetails({ ...courseDetails, description: e.target.value })}
                rows={4}
                placeholder="Enter course description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <Input
                value={courseDetails.duration}
                onChange={(e) => setCourseDetails({ ...courseDetails, duration: e.target.value })}
                placeholder="e.g., 2 years"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
              <Textarea
                value={courseDetails.eligibility}
                onChange={(e) => setCourseDetails({ ...courseDetails, eligibility: e.target.value })}
                rows={3}
                placeholder="Enter eligibility criteria"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum</label>
              <Textarea
                value={courseDetails.curriculum}
                onChange={(e) => setCourseDetails({ ...courseDetails, curriculum: e.target.value })}
                rows={6}
                placeholder="Enter course curriculum"
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 