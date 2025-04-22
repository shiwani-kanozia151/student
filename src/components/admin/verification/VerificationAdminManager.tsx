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
import { InfoIcon } from "lucide-react";

export default function VerificationAdminManager() {
  const [courses, setCourses] = useState([]);
  const [verificationAdmins, setVerificationAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    course_id: "",
    course_name: ""
  });
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });

  // Fetch courses and verification admins
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
        
        // Check if verification_admins table exists
        await createTableIfNotExists();
        
        // Fetch verification admins
        const { data: adminsData, error: adminsError } = await supabase
          .from("verification_admins")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (adminsError && !adminsError.message.includes("does not exist")) {
          throw adminsError;
        }
        
        setVerificationAdmins(adminsData || []);
        
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

  // Create the verification_admins table if it doesn't exist
  const createTableIfNotExists = async () => {
    try {
      // First try to select from the table to see if it exists
      const { error } = await supabase
        .from("verification_admins")
        .select("id")
        .limit(1);
      
      // If we get an error about the table not existing
      if (error && error.message.includes("does not exist")) {
        // Run the SQL from our function
        const sql = `
          CREATE TABLE IF NOT EXISTS public.verification_admins (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR NOT NULL,
            course_id VARCHAR NOT NULL,
            course_name VARCHAR NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_login TIMESTAMPTZ
          );
          
          CREATE INDEX IF NOT EXISTS idx_verification_admins_email 
          ON public.verification_admins(email);
          
          CREATE INDEX IF NOT EXISTS idx_verification_admins_course_id 
          ON public.verification_admins(course_id);
        `;
        
        try {
          // Try to execute the SQL through RPC first
          const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
          if (error) throw error;
        } catch (rpcError) {
          // If RPC fails, try via REST API
          console.log("RPC failed, trying API endpoint:", rpcError);
          await fetch('/api/auth/create-verification-admins-table', {
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
    setNewAdmin({
      ...newAdmin,
      course_id: String(course.id),
      course_name: course.name
    });
    // Clear any status messages when selecting a course
    setStatusMessage({ type: "", message: "" });
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      if (!selectedCourse) {
        setStatusMessage({
          type: "error",
          message: "Please select a course first"
        });
        return;
      }
      
      if (!newAdmin.email || !newAdmin.password) {
        setStatusMessage({
          type: "error",
          message: "Email and password are required"
        });
        return;
      }
      
      // Create the table if it doesn't exist
      await createTableIfNotExists();
      
      console.log("Adding verification admin for course:", selectedCourse);
      
      // In a real app, you would hash the password
      const { data, error } = await supabase
        .from("verification_admins")
        .insert([{
          email: newAdmin.email.toLowerCase(),
          password_hash: newAdmin.password, // In production, use proper hashing
          course_id: String(selectedCourse.id),
          course_name: selectedCourse.name,
          created_at: new Date().toISOString()
        }])
        .select();
        
      if (error) throw error;
      
      console.log("Verification admin added successfully:", data[0]);
      setVerificationAdmins([...verificationAdmins, data[0]]);
      setStatusMessage({
        type: "success",
        message: `Verification admin "${newAdmin.email}" added successfully!`
      });
      
      // Reset form
      setNewAdmin({
        email: "",
        password: "",
        course_id: String(selectedCourse.id),
        course_name: selectedCourse.name
      });
      
    } catch (err) {
      console.error("Error adding verification admin:", err);
      setStatusMessage({
        type: "error",
        message: err.message || "Failed to add verification admin"
      });
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    try {
      const adminToDelete = verificationAdmins.find(admin => admin.id === adminId);
      
      const { error } = await supabase
        .from("verification_admins")
        .delete()
        .eq("id", adminId);
        
      if (error) throw error;
      
      setVerificationAdmins(verificationAdmins.filter(admin => admin.id !== adminId));
      setStatusMessage({
        type: "success",
        message: `Verification admin "${adminToDelete?.email || 'unknown'}" removed successfully`
      });
      
    } catch (err) {
      console.error("Error deleting verification admin:", err);
      setStatusMessage({
        type: "error",
        message: "Failed to delete verification admin: " + err.message
      });
    }
  };

  // Get the count of verification admins for each course
  const getVerificationAdminCountForCourse = (courseId) => {
    return verificationAdmins.filter(admin => admin.course_id === String(courseId)).length;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Verification Officer Management</h2>
      
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Verification officers can log in at <span className="font-bold">/verification-officer/login</span> with their assigned email and password.
        </AlertDescription>
      </Alert>
      
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
            <h3 className="text-lg font-medium mb-4">Courses</h3>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Verification Officers</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{getVerificationAdminCountForCourse(course.id)}</TableCell>
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
                      <TableCell colSpan={3} className="text-center py-4">
                        No courses available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Add Verification Officer</h3>
            {selectedCourse ? (
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    For Course: <span className="font-bold">{selectedCourse.name}</span>
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Officer Email</label>
                  <Input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="officer@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    required
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    placeholder="Create a password"
                  />
                </div>
                
                <Button type="submit">Add Verification Officer</Button>
              </form>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                Please select a course to add a verification officer
              </div>
            )}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-medium mb-4">Existing Verification Officers</h3>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verificationAdmins.length > 0 ? (
                verificationAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{admin.course_name}</TableCell>
                    <TableCell>{admin.password_hash}</TableCell>
                    <TableCell>
                      {admin.last_login 
                        ? new Date(admin.last_login).toLocaleDateString() 
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteAdmin(admin.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No verification officers added yet
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