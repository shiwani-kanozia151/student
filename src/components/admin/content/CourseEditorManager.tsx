import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CourseEditorManager() {
  const [courses, setCourses] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newEditor, setNewEditor] = useState({
    email: "",
    password: "",
    course_id: "",
    course_name: ""
  });
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });

  // Fetch courses and editors
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch courses
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Check if course_editors table exists
        await createTableIfNotExists();
        
        // Fetch editors
        const { data: editorsData, error: editorsError } = await supabase
          .from("course_editors")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (editorsError && !editorsError.message.includes("does not exist")) {
          throw editorsError;
        }
        
        setEditors(editorsData || []);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        setStatusMessage({
          type: "error",
          message: "Failed to load data: " + err.message
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Create the course_editors table if it doesn't exist
  const createTableIfNotExists = async () => {
    try {
      // First try to select from the table to see if it exists
      const { error } = await supabase
        .from("course_editors")
        .select("id")
        .limit(1);
      
      // If we get an error about the table not existing
      if (error && error.message.includes("does not exist")) {
        // Run the SQL from our function
        const sql = `
          CREATE TABLE IF NOT EXISTS public.course_editors (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR NOT NULL,
            course_id VARCHAR NOT NULL,
            course_name VARCHAR NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_login TIMESTAMPTZ
          );
          
          CREATE INDEX IF NOT EXISTS idx_course_editors_email 
          ON public.course_editors(email);
          
          CREATE INDEX IF NOT EXISTS idx_course_editors_course_id 
          ON public.course_editors(course_id);
        `;
        
        try {
          // Try to execute the SQL through RPC first
          const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
          if (error) throw error;
        } catch (rpcError) {
          // If RPC fails, try via REST API
          console.log("RPC failed, trying API endpoint:", rpcError);
          await fetch('/api/auth/create-course-editors-table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } catch (err) {
      console.error("Error checking/creating table:", err);
    }
  };

  const handleCourseSelect = (course) => {
    console.log("Selected course:", course);
    setSelectedCourse(course);
    setNewEditor({
      ...newEditor,
      course_id: String(course.id),
      course_name: course.name
    });
    // Clear any status messages when selecting a course
    setStatusMessage({ type: "", message: "" });
  };

  const handleAddEditor = async (e) => {
    e.preventDefault();
    try {
      if (!selectedCourse) {
        setStatusMessage({
          type: "error",
          message: "Please select a course first"
        });
        return;
      }
      
      if (!newEditor.email || !newEditor.password) {
        setStatusMessage({
          type: "error",
          message: "Email and password are required"
        });
        return;
      }
      
      // Create the table if it doesn't exist
      await createTableIfNotExists();
      
      console.log("Adding editor for course:", selectedCourse);
      
      // In a real app, you would hash the password
      const { data, error } = await supabase
        .from("course_editors")
        .insert([{
          email: newEditor.email.toLowerCase(),
          password_hash: newEditor.password, // In production, use proper hashing
          course_id: String(selectedCourse.id),
          course_name: selectedCourse.name,
          created_at: new Date().toISOString()
        }])
        .select();
        
      if (error) throw error;
      
      console.log("Editor added successfully:", data[0]);
      setEditors([...editors, data[0]]);
      setStatusMessage({
        type: "success",
        message: `Course editor "${newEditor.email}" added successfully!`
      });
      
      // Reset form
      setNewEditor({
        email: "",
        password: "",
        course_id: String(selectedCourse.id),
        course_name: selectedCourse.name
      });
      
    } catch (err) {
      console.error("Error adding editor:", err);
      setStatusMessage({
        type: "error",
        message: err.message || "Failed to add editor"
      });
    }
  };

  const handleDeleteEditor = async (editorId) => {
    try {
      const editorToDelete = editors.find(editor => editor.id === editorId);
      
      const { error } = await supabase
        .from("course_editors")
        .delete()
        .eq("id", editorId);
        
      if (error) throw error;
      
      setEditors(editors.filter(editor => editor.id !== editorId));
      setStatusMessage({
        type: "success",
        message: `Editor "${editorToDelete?.email || 'unknown'}" removed successfully`
      });
      
    } catch (err) {
      console.error("Error deleting editor:", err);
      setStatusMessage({
        type: "error",
        message: "Failed to delete editor: " + err.message
      });
    }
  };

  // Calculate which courses are available (don't have editors assigned)
  const availableCourses = courses.filter(course => {
    // Check if this course has any editors assigned to it
    return !editors.some(editor => editor.course_id === String(course.id));
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Course Editor Management</h2>
      
      {statusMessage.message && (
        <Alert className={statusMessage.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"}>
          <AlertDescription>
            {statusMessage.message}
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Available Courses</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableCourses.length > 0 ? (
                    availableCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant={selectedCourse?.id === course.id ? "default" : "outline"}
                            onClick={() => handleCourseSelect(course)}
                          >
                            {selectedCourse?.id === course.id ? "Selected" : "Select"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-4">
                        No courses available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Add Course Editor</h3>
            {selectedCourse ? (
              <form onSubmit={handleAddEditor} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    For Course: <span className="font-bold">{selectedCourse.name}</span>
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Editor Email</label>
                  <Input
                    type="email"
                    required
                    value={newEditor.email}
                    onChange={(e) => setNewEditor({...newEditor, email: e.target.value})}
                    placeholder="editor@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    required
                    value={newEditor.password}
                    onChange={(e) => setNewEditor({...newEditor, password: e.target.value})}
                    placeholder="Create a password"
                  />
                </div>
                
                <Button type="submit">Add Editor</Button>
              </form>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                Please select a course to add an editor
              </div>
            )}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium mb-4">Existing Course Editors</h3>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editors.length > 0 ? (
                editors.map((editor) => (
                  <TableRow key={editor.id}>
                    <TableCell>{editor.email}</TableCell>
                    <TableCell>{editor.course_name}</TableCell>
                    <TableCell>
                      {editor.last_login 
                        ? new Date(editor.last_login).toLocaleDateString() 
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteEditor(editor.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No course editors added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 