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
        
        // Fetch editors
        const { data: editorsData, error: editorsError } = await supabase
          .from("course_editors")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (editorsError) throw editorsError;
        setEditors(editorsData || []);
        
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setNewEditor({
      ...newEditor,
      course_id: course.id,
      course_name: course.title || course.name
    });
  };

  const handleAddEditor = async (e) => {
    e.preventDefault();
    try {
      if (!selectedCourse) {
        toast.error("Please select a course first");
        return;
      }
      
      if (!newEditor.email || !newEditor.password) {
        toast.error("Email and password are required");
        return;
      }
      
      // In a real app, you would hash the password
      const { data, error } = await supabase
        .from("course_editors")
        .insert([{
          email: newEditor.email.toLowerCase(),
          password_hash: newEditor.password, // In production, use proper hashing
          course_id: selectedCourse.id,
          course_name: selectedCourse.title || selectedCourse.name,
          created_by: "super-admin-id" // Replace with actual super admin ID
        }])
        .select();
        
      if (error) throw error;
      
      setEditors([...editors, data[0]]);
      toast.success("Course editor added successfully");
      
      // Reset form
      setNewEditor({
        email: "",
        password: "",
        course_id: selectedCourse.id,
        course_name: selectedCourse.title || selectedCourse.name
      });
      
    } catch (err) {
      console.error("Error adding editor:", err);
      toast.error(err.message || "Failed to add editor");
    }
  };

  const handleDeleteEditor = async (editorId) => {
    try {
      const { error } = await supabase
        .from("course_editors")
        .delete()
        .eq("id", editorId);
        
      if (error) throw error;
      
      setEditors(editors.filter(editor => editor.id !== editorId));
      toast.success("Editor removed successfully");
      
    } catch (err) {
      console.error("Error deleting editor:", err);
      toast.error("Failed to delete editor");
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">Course Editor Management</h2>
      
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
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.title || course.name}</TableCell>
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
                    For Course: <span className="font-bold">{selectedCourse.title || selectedCourse.name}</span>
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