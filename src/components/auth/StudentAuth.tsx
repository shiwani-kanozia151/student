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
import { sendOTP } from "@/lib/emailService";

type AuthStep = "EMAIL" | "OTP" | "PASSWORD" | "NEW_PASSWORD";

interface StudentAuthProps {
  isNewUser?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onAuthenticated?: (data: { email: string; isNewUser: boolean }) => void;
}

const StudentAuth = ({
  isOpen = true,
  onClose = () => {},
  onAuthenticated = () => {},
  isNewUser = false,
}: StudentAuthProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [step, setStep] = React.useState<AuthStep>(
    isNewUser ? "EMAIL" : "PASSWORD",
  );
  const [generatedOTP, setGeneratedOTP] = React.useState("");

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    // Check if user exists (mock check - replace with actual API call)
    const isExistingUser = false; // This should be an API call

    if (isExistingUser) {
      setStep("PASSWORD");
    } else {
      const newOTP = generateOTP();
      setGeneratedOTP(newOTP);
      await sendOTP(email, newOTP);
      setStep("OTP");
    }
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

  const handlePasswordSubmit = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    onAuthenticated({ email, isNewUser: step === "NEW_PASSWORD" });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case "EMAIL":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your institute email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleEmailSubmit}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Continue
            </Button>
          </div>
        );

      case "OTP":
        return (
          <div className="space-y-4">
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

      case "PASSWORD":
      case "NEW_PASSWORD":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {step === "NEW_PASSWORD" ? "Create Password" : "Enter Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  step === "NEW_PASSWORD"
                    ? "Create a strong password"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handlePasswordSubmit}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              {step === "NEW_PASSWORD" ? "Create Account" : "Login"}
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
            {step === "EMAIL" && "Student Login"}
            {step === "OTP" && "Verify OTP"}
            {step === "PASSWORD" && "Enter Password"}
            {step === "NEW_PASSWORD" && "Create Account"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStep()}

        <div className="text-center text-sm">
          {step === "PASSWORD" && (
            <a
              href="#"
              className="text-[#0A2240] hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setStep("EMAIL");
              }}
            >
              Forgot Password?
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentAuth;
