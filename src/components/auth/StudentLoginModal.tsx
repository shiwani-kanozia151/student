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

type LoginStep =
  | "CREDENTIALS"
  | "FORGOT_PASSWORD_EMAIL"
  | "FORGOT_PASSWORD_OTP"
  | "NEW_PASSWORD";

interface StudentLoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLogin?: (data: { email: string; password: string }) => void;
}

const StudentLoginModal = ({
  isOpen = true,
  onClose = () => {},
  onLogin = () => {},
}: StudentLoginModalProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [step, setStep] = React.useState<LoginStep>("CREDENTIALS");
  const [generatedOTP, setGeneratedOTP] = React.useState("");

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    const newOTP = generateOTP();
    setGeneratedOTP(newOTP);
    console.log(`Sending OTP ${newOTP} to ${email}`);
    setStep("FORGOT_PASSWORD_OTP");
    setError("");
  };

  const handleOTPVerification = () => {
    if (otp === generatedOTP) {
      setStep("NEW_PASSWORD");
      setError("");
    } else {
      setError("Invalid OTP");
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    onLogin({ email, password });
  };

  const handlePasswordReset = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    // Reset password logic here
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case "CREDENTIALS":
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-6"
          >
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
            >
              Login
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-[#0A2240]"
                onClick={() => setStep("FORGOT_PASSWORD_EMAIL")}
              >
                Forgot Password?
              </Button>
            </div>
          </form>
        );

      case "FORGOT_PASSWORD_EMAIL":
        return (
          <div className="space-y-6">
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

            <Button
              onClick={handleForgotPassword}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Send OTP
            </Button>

            <Button
              variant="outline"
              onClick={() => setStep("CREDENTIALS")}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        );

      case "FORGOT_PASSWORD_OTP":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>

            <Button
              onClick={handleOTPVerification}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Verify OTP
            </Button>
          </div>
        );

      case "NEW_PASSWORD":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handlePasswordReset}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Reset Password
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0A2240]">
            {step === "CREDENTIALS" && "Student Login"}
            {step === "FORGOT_PASSWORD_EMAIL" && "Forgot Password"}
            {step === "FORGOT_PASSWORD_OTP" && "Verify OTP"}
            {step === "NEW_PASSWORD" && "Reset Password"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};

export default StudentLoginModal;
