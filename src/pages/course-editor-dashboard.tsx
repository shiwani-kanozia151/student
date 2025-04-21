import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";

export default function CourseEditorDashboard() {
  const navigate = useNavigate();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editorSession, setEditorSession] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Check authentication
  useEffect(() => {
    const session = localStorage.getItem("courseEditorSession");
    if (!session) {
      navigate("/course-editor-login");
      return;
    }
    
    try {
      const parsedSession = JSON.parse(session);
      console.log("Editor session:", parsedSession);
      setEditorSession(parsedSession);
    } catch (err) {
      console.error("Error parsing session:", err);
      navigate("/course-editor-login");
    }
  }, [navigate]);
  
  // Fetch course data
  useEffect(() => {
    if (!editorSession) return;
    
    async function fetchCourse() {
      try {
        setLoading(true);
        setError("");
        
        console.log("Fetching course with ID:", editorSession.courseId);
        
        // Log the Supabase URL to ensure we're connecting to the right project
        console.log("Using Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
        
        // First check if the course exists using exact match
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", editorSession.courseId);
          
        if (courseError) {
          console.error("Database error:", courseError);
          throw new Error(`Database error: ${courseError.message}`);
        }
        
        console.log("First query result:", courseData);
        
        if (!courseData || courseData.length === 0) {
          // Try with a different format (string-based comparison)
          const { data: secondAttemptData, error: secondError } = await supabase
            .from("courses")
            .select("*");
            
          if (secondError) {
            console.error("Second attempt error:", secondError);
            throw secondError;
          }
          
          console.log("All courses:", secondAttemptData);
          
          // Manually filter to find matching course
          const matchingCourse = secondAttemptData?.find(
            course => String(course.id).trim() === String(editorSession.courseId).trim()
          );
          
          if (matchingCourse) {
            console.log("Course found on second attempt:", matchingCourse);
            const processedCourse = {
              ...matchingCourse,
              curriculum: Array.isArray(matchingCourse.curriculum) 
                ? matchingCourse.curriculum 
                : []
            };
            
            setCourseData(processedCourse);
            return;
          }
          
          // Log all course IDs for debugging
          const courseIds = secondAttemptData?.map(c => ({
            id: c.id,
            type: typeof c.id,
            matches: String(c.id) === String(editorSession.courseId)
          }));
          
          setDebugInfo({
            courseId: editorSession.courseId,
            courseIdType: typeof editorSession.courseId,
            message: "No course found with this ID",
            sessionData: editorSession,
            allCourses: secondAttemptData?.slice(0, 5), // Show first 5 courses for debugging
            courseIdComparisons: courseIds
          });
          
          throw new Error("Course not found");
        }
        
        // Ensure curriculum is always an array
        const processedCourse = {
          ...courseData[0],
          curriculum: Array.isArray(courseData[0].curriculum) 
            ? courseData[0].curriculum 
            : []
        };
        
        console.log("Course data found:", processedCourse);
        setCourseData(processedCourse);
        
      } catch (err) {
        console.error("Failed to load course data:", err);
        setError(err.message || "Failed to load course data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCourse();
  }, [editorSession]);
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("courseEditorSession");
    navigate("/course-editor-login");
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError("");
      
      // Validate that required fields exist
      if (!courseData.name || !courseData.id) {
        throw new Error("Course name is required");
      }
      
      // Ensure that we have processed values for all fields
      const updatedCourse = {
        name: courseData.name,
        description: courseData.description || "",
        duration: courseData.duration || "",
        eligibility: courseData.eligibility || "",
        // Make sure curriculum is an array
        curriculum: Array.isArray(courseData.curriculum) ? courseData.curriculum : []
      };
      
      console.log("Saving course changes:", updatedCourse);
      
      const { error } = await supabase
        .from("courses")
        .update(updatedCourse)
        .eq("id", courseData.id);
        
      if (error) {
        console.error("Save error:", error);
        throw new Error(`Failed to save: ${error.message}`);
      }
      
      // Show a more prominent success message with fallback alert
      toast.success("Course updated successfully!", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#10B981",
          color: "white",
          fontSize: "16px",
          padding: "16px",
          borderRadius: "8px",
        },
      });
      
      // Fallback alert in case toast doesn't appear
      alert("Course updated successfully!");
      
      // Refresh the data after save
      const { data: refreshedData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseData.id)
        .single();
        
      if (refreshedData) {
        setCourseData({
          ...refreshedData,
          curriculum: Array.isArray(refreshedData.curriculum) 
            ? refreshedData.curriculum 
            : []
        });
      }
    } catch (err) {
      console.error("Error saving changes:", err);
      setError(err.message || "Failed to save changes");
      
      // Show error with fallback alert
      toast.error(err.message || "Failed to save changes", {
        duration: 4000,
        position: "top-center",
      });
      
      // Fallback alert
      alert(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Handle curriculum item add
  const [newCurriculumItem, setNewCurriculumItem] = useState("");
  
  const handleAddCurriculumItem = () => {
    if (!newCurriculumItem.trim()) return;
    
    setCourseData({
      ...courseData,
      curriculum: [...(courseData.curriculum || []), newCurriculumItem]
    });
    
    setNewCurriculumItem("");
  };
  
  // Handle curriculum item remove
  const handleRemoveCurriculumItem = (index) => {
    setCourseData({
      ...courseData,
      curriculum: courseData.curriculum.filter((_, i) => i !== index)
    });
  };
  
  if (!editorSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="p-8 text-center">Redirecting to login...</div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="p-8 text-center">Loading course data...</div>
      </div>
    );
  }
  
  if (!courseData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow text-center">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error || "Course not found"}
          </div>
          
          {debugInfo && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-left text-sm">
              <p><strong>Debug Info:</strong></p>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 space-y-3">
            <Button 
              onClick={async () => {
                // Get all courses
                const { data } = await supabase.from("courses").select("*");
                if (!data || data.length === 0) {
                  setError("No courses available");
                  return;
                }
                
                // Get first available course
                const firstCourse = data[0];
                
                // Update course editor in database
                const { error } = await supabase
                  .from("course_editors")
                  .update({ 
                    course_id: firstCourse.id,
                    course_name: firstCourse.name
                  })
                  .eq("email", editorSession.email);
                  
                if (error) {
                  setError(`Failed to update editor: ${error.message}`);
                  return;
                }
                
                // Update local session
                const updatedSession = {
                  ...editorSession,
                  courseId: firstCourse.id,
                  courseName: firstCourse.name
                };
                
                // Save to localStorage
                localStorage.setItem("courseEditorSession", JSON.stringify(updatedSession));
                
                // Reload page
                window.location.reload();
              }}
              className="w-full"
            >
              Fix Session (Use Available Course)
            </Button>
            
            <Button onClick={handleLogout} className="w-full">
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Toaster position="top-center" />
      
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2240]">Course Editor Dashboard</h1>
            <p className="text-gray-600">
              Editing: {courseData.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                // Debug button to verify all course IDs
                const debugCourseFetch = async () => {
                  const { data } = await supabase.from("courses").select("*");
                  const { data: editors } = await supabase.from("course_editors").select("*");
                  
                  setDebugInfo({
                    allCourses: data,
                    allEditors: editors,
                    currentSessionId: editorSession.courseId,
                    supabaseUrl: import.meta.env.VITE_SUPABASE_URL
                  });
                };
                debugCourseFetch();
              }} 
              variant="outline"
              size="sm"
            >
              Debug
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {debugInfo && (
          <div className="p-4 mb-6 bg-blue-50 text-blue-700 rounded-lg text-sm overflow-auto max-h-60">
            <p className="font-medium mb-2">Debug Information:</p>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <Button 
              onClick={() => setDebugInfo(null)} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Clear Debug Info
            </Button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Course Name</label>
            <Input
              value={courseData.name || ""}
              onChange={(e) => setCourseData({...courseData, name: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Course Description</label>
            <Textarea
              value={courseData.description || ""}
              onChange={(e) => setCourseData({...courseData, description: e.target.value})}
              rows={6}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Eligibility Criteria</label>
            <Textarea
              value={courseData.eligibility || ""}
              onChange={(e) => setCourseData({...courseData, eligibility: e.target.value})}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Course Duration</label>
            <Input
              value={courseData.duration || ""}
              onChange={(e) => setCourseData({...courseData, duration: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Curriculum</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add curriculum item"
                value={newCurriculumItem}
                onChange={(e) => setNewCurriculumItem(e.target.value)}
              />
              <Button onClick={handleAddCurriculumItem}>Add</Button>
            </div>
            
            {(courseData.curriculum || []).length > 0 ? (
              <ul className="border rounded-md p-3 space-y-2">
                {courseData.curriculum.map((item, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCurriculumItem(index)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No curriculum items added yet</p>
            )}
          </div>
          
          <Button 
            onClick={handleSaveChanges} 
            className="w-full" 
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}