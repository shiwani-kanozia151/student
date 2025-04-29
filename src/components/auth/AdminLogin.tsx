import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { validateAdminCredentials } from "@/lib/adminAuth";

// In src/types/admin.ts or at the top of AdminLogin.tsx
type AdminRole = "super" | "content" | "verification";
interface AdminLoginProps {
  adminType: AdminRole;
}

const AdminLogin = ({ adminType }: AdminLoginProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const user = validateAdminCredentials(email, password);
    if (user) {
      
      const userRole = user.role as AdminRole; // Type assertion
      
      if (adminType === "super" && userRole === "super") {
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminRole", user.role);
        navigate("/admin/select-role");
      } else if (
        adminType === "content" &&
        (userRole === "content" || userRole === "super")
      ) {
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminRole", "content");
        navigate("/content-admin/dashboard");
      } else if (
        adminType === "verification" &&
        (userRole === "verification" || userRole === "super")
      ) {
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminRole", "verification");
        navigate("/verification-admin/dashboard");
      } else {
        setError("You don't have permission to access this area");
      }
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
      <h1 className="text-2xl font-bold text-[#0A2240] mb-6">
      {adminType === "super"
       ? "Super Administrator Login"
        : adminType === "content"
        ? "Content Administrator Login"
        : "Verification Administrator Login"}
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
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
