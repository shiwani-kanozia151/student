import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Mail, Lock, Timer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn, getCurrentUser, sendOTP } from "@/lib/auth";
import { toast } from "sonner";

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
}

const StudentLoginModal = ({
  isOpen = true,
  onClose = () => {},
}: StudentLoginModalProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [showOtpInput, setShowOtpInput] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [isResendDisabled, setIsResendDisabled] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendDisabled(false);
    }
  }, [timer]);

  const startOtpTimer = () => {
    setTimer(180); // 3 minutes
    setIsResendDisabled(true);
  };

  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await sendOTP(email);
      if (response.success) {
        setShowOtpInput(true);
        startOtpTimer();
        toast.success("OTP sent successfully");
        if (response.data?.otp) {
          console.log(`Development OTP: ${response.data.otp}`);
        }
      } else {
        throw new Error(response.error || "Failed to send OTP");
      }
    } catch (err) {
      console.error("OTP error:", err);
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !otp) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await signIn(email, password, otp);

      if (response.success) {
        const user = await getCurrentUser() as AuthUser;
        if (user) {
          toast.success("Login successful");
          navigate("/student/dashboard");
          onClose();
        } else {
          throw new Error("Failed to get user data after login");
        }
      } else {
        throw new Error(response.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-white dark:bg-gray-900">
        <div className="grid grid-cols-2 gap-0">
          {/* Left side - Illustration */}
          <div className="bg-[#f5f6ff] p-8 flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-[#0A2240] mb-4">
              ONLINE EDUCATION IS<br />NOW SIMPLE
            </h1>
            <div className="flex justify-center">
              <img 
                src="/student-illustration.svg" 
                alt="Online Education"
                className="w-4/5"
              />
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#0A2240] mb-2">Welcome</h2>
              <p className="text-gray-600">Please login to continue</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="otp">OTP Verification</Label>
                  {timer > 0 && (
                    <span className="text-sm text-gray-500 flex items-center">
                      <Timer className="h-4 w-4 mr-1" />
                      {formatTime(timer)}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendOTP}
                    disabled={isResendDisabled || loading}
                    className="whitespace-nowrap"
                  >
                    {isResendDisabled ? 'Wait...' : (showOtpInput ? 'Resend OTP' : 'Send OTP')}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90 text-white"
                disabled={loading || !showOtpInput}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    // Add navigation to registration
                  }}
                  className="text-[#0A2240] hover:text-[#0A2240]/90 font-medium"
                >
                  Register here
                </button>
              </p>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLoginModal;