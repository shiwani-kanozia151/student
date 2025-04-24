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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please enter both email and password");
        setLoading(false);
        return;
      }

      // Fetch the verification admin details first
      const { data: adminData, error: fetchError } = await supabase
        .from("verification_admins")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (fetchError || !adminData) {
        console.error("Fetch error:", fetchError);
        setError("Account not found or invalid credentials");
        setLoading(false);
        return;
      }

      // Verify password directly (simple comparison for verification officers)
      if (adminData.password_text !== password) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Try to sign in with Supabase Auth as well (for future Auth features)
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password: password,
        });

        if (authError) {
          console.log("Auth login attempted but failed:", authError);
          // Continue anyway since we validated using the admin table
        }
      } catch (authErr) {
        console.log("Auth error ignored:", authErr);
        // We ignore auth errors here since we're using our custom validation
      }

      // Store verification officer info in localStorage
      localStorage.setItem("verificationOfficerEmail", email);
      localStorage.setItem("verificationOfficerCourseId", adminData.course_id);
      localStorage.setItem("verificationOfficerCourseName", adminData.course_name);
      
      // Update last login time
      await supabase
        .from("verification_admins")
        .update({ last_login: new Date().toISOString() })
        .eq("id", adminData.id);
      
      // Redirect to dashboard
      navigate("/verification-officer/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred");
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