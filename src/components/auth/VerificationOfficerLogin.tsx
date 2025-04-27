import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const VerificationOfficerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please enter both email and password");
        return;
      }

      // Fetch the verification admin from the database
      const { data, error: fetchError } = await supabase
        .from("verification_admins")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (fetchError || !data) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      // Compare passwords (in a real app, you'd use proper password verification)
      if (data.password_text !== password) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      // Store verification officer info in localStorage
      localStorage.setItem("verificationOfficerEmail", email);
      localStorage.setItem("verificationOfficerCourseId", data.course_id);
      localStorage.setItem("verificationOfficerCourseName", data.course_name);
      localStorage.setItem("adminRole", "verification");
      
      // Update last login time
      await supabase
        .from("verification_admins")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.id);
      
      // Redirect to dashboard
      navigate("/verification-officer/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-[#0A2240] mb-6">
          Verification Officer Login
        </h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerificationOfficerLogin; 