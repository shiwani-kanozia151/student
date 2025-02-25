import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendOTP } from "@/lib/emailService";
import { useStudentStore } from "@/lib/studentStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthStep = "EMAIL" | "OTP" | "NEW_PASSWORD" | "LOGIN";

interface StudentAuthProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAuthenticated?: (data: { email: string; isNewUser: boolean }) => void;
}

const StudentAuth = ({
  isOpen = true,
  onClose = () => {},
  onAuthenticated = () => {},
}: StudentAuthProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [step, setStep] = React.useState<AuthStep>("EMAIL");
  const [generatedOTP, setGeneratedOTP] = React.useState("");

  const { addStudent } = useStudentStore();

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    const newOTP = generateOTP();
    setGeneratedOTP(newOTP);
    await sendOTP(email, newOTP);
    setStep("OTP");
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

    if (step === "NEW_PASSWORD") {
      addStudent({
        id: Date.now().toString(),
        name: email.split("@")[0],
        email,
        department: "Pending Department Selection",
        status: "pending",
        created_at: new Date().toISOString(),
        documents: [],
      });
    }

    onAuthenticated({ email, isNewUser: step === "NEW_PASSWORD" });
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case "EMAIL":
        return (
          <div className="space-y-6">
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
      case "LOGIN":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">
                {step === "NEW_PASSWORD" ? "Create Password" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={
                  step === "NEW_PASSWORD"
                    ? "Create a password"
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
            {step === "EMAIL" && "Student Authentication"}
            {step === "OTP" && "Verify Email"}
            {step === "NEW_PASSWORD" && "Create Password"}
            {step === "LOGIN" && "Student Login"}
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

export default StudentAuth;
