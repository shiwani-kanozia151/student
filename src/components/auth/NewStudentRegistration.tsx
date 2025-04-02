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
import { useRouter } from "next/router";
import { supabase } from '@/lib/supabase';

type RegistrationStep = "EMAIL" | "OTP" | "CREATE_PASSWORD";

interface NewStudentRegistrationProps {
  isOpen?: boolean;
  onClose?: () => void;
  onRegister?: (data: { email: string; password: string }) => void;
  studentName?: string; // New prop for the student's name
}

const NewStudentRegistration = ({
  isOpen = true,
  onClose = () => {},
  onRegister = () => {},
  studentName = "", // Default empty string
}: NewStudentRegistrationProps) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState("");
  const [step, setStep] = React.useState<RegistrationStep>("EMAIL");
  const [generatedOTP, setGeneratedOTP] = React.useState("");
  const [name, setName] = React.useState(studentName); // Initialize with studentName
  const router = useRouter();

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
    console.log(`Sending OTP ${newOTP} to ${email}`);
    setStep("OTP");
    setError("");
  };

  const handleOTPVerification = () => {
    if (otp === generatedOTP) {
      setStep("CREATE_PASSWORD");
      setError("");
    } else {
      setError("Invalid OTP");
    }
  };

  const handleCompleteRegistration = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Save student data with name (use the name state which could be from props or modified)
      const { error: dbError } = await supabase.from("student").insert({
        email,
        name: name || email.split("@")[0], // Use provided name or fallback to email prefix
        status: "pending",
      });

      if (dbError) throw dbError;

      // 3. Redirect to profile completion
      router.push("/student/profile-complete");
      onRegister({ email, password });
    } catch (err) {
      setError(err.message);
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
            {name && ( // Only show name field if we don't have a name from login
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <Button
              onClick={handleEmailSubmit}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Send OTP
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

      case "CREATE_PASSWORD":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleCompleteRegistration}
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            >
              Create Account
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
            {step === "EMAIL" && "New Student Registration"}
            {step === "OTP" && "Verify Email"}
            {step === "CREATE_PASSWORD" && "Create Password"}
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

export default NewStudentRegistration;