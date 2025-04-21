import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CourseEditorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Query for course editor with this email
      const { data, error } = await supabase
        .from("course_editors")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();
      
      if (error || !data) {
        throw new Error("Invalid credentials");
      }
      
      // Verify password (in production, you should use proper password hashing)
      if (data.password_hash !== password) {
        throw new Error("Invalid credentials");
      }
      
      // Set session in local storage
      localStorage.setItem("courseEditorSession", JSON.stringify({
        id: data.id,
        email: data.email,
        courseId: data.course_id,
        courseName: data.course_name
      }));
      
      // Update last login
      await supabase
        .from("course_editors")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);
      
      navigate("/course-editor-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course Editor Login</h1>
          <p className="text-gray-600">Access your assigned course</p>
        </div>
        
        {error && (
          <div className="p-3 text-sm bg-red-100 border border-red-200 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}