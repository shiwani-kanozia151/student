import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn, getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
}

interface StudentLoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogin?: (data: { email: string; name?: string }) => void;
}

const StudentLoginModal = ({
  isOpen = true,
  onClose = () => {},
  onLogin = () => {},
}: StudentLoginModalProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const checkApplicationStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("applications")
      .select("id, status")
      .eq("student_id", userId)
      .maybeSingle();

    return data ? true : false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await signIn(email, password);

      if (response.success) {
        const user = await getCurrentUser() as AuthUser;
        if (user) {
          // Check if application exists
          const hasApplication = await checkApplicationStatus(user.id);
          
          if (hasApplication) {
            // Redirect to dashboard if application exists
            navigate("/student/dashboard");
            return;
          }

          const userName = user.user_metadata?.name || 
                          user.user_metadata?.full_name || 
                          "";
          onLogin({ 
            email: user.email || email,
            name: userName
          });
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0A2240]">
            Student Login
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Rest of your existing form JSX remains exactly the same */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
      </DialogContent>
    </Dialog>
  );
};

export default StudentLoginModal;