import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sendOTP, verifyOTP, signUp } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuthStep = "EMAIL" | "OTP" | "DETAILS" | "NEW_PASSWORD";

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
  const [name, setName] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [error, setError] = React.useState("");
  const [step, setStep] = React.useState<AuthStep>("EMAIL");
  const [loading, setLoading] = React.useState(false);

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    const response = await sendOTP(email);
    setLoading(false);

    if (response.success) {
      setStep("OTP");
      setError("");
    } else {
      setError(response.error || "Failed to send OTP");
    }
  };

  const handleOTPVerification = async () => {
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);
    const response = await verifyOTP(email, otp);
    setLoading(false);

    if (response.success) {
      setStep("DETAILS");
      setError("");
    } else {
      setError(response.error || "Invalid OTP");
    }
  };

  const handleDetailsSubmit = () => {
    if (!name || !department) {
      setError("Please fill in all fields");
      return;
    }
    setStep("NEW_PASSWORD");
    setError("");
  };

  const handleRegistration = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const response = await signUp(email, password, { name, department });
    setLoading(false);

    if (response.success) {
      onAuthenticated({ email, isNewUser: true });
      onClose();
    } else {
      setError(response.error || "Registration failed");
    }
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
              disabled={loading}
            >
              {loading ? "Sending..." : "Continue"}
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
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </div>
        );

      case "DETAILS":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">
                    Computer Science
                  </SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDetailsSubmit}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Continue
            </Button>
          </div>
        );

      case "NEW_PASSWORD":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={handleRegistration}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
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
            {step === "EMAIL" && "Student Registration"}
            {step === "OTP" && "Verify Email"}
            {step === "DETAILS" && "Personal Details"}
            {step === "NEW_PASSWORD" && "Create Password"}
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
