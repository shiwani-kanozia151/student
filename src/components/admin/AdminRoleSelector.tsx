import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface AdminRoleSelectorProps {
  onRoleSelect: (role: "content" | "verification") => void;
}

const AdminRoleSelector = ({ onRoleSelect }: AdminRoleSelectorProps) => {
  const adminEmail = localStorage.getItem("adminEmail");
  const adminRole = localStorage.getItem("adminRole");

  React.useEffect(() => {
    if (adminRole !== "super") {
      window.location.href = "/admin/login";
    }
  }, [adminRole]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-[#0A2240] mb-6 text-center">
          Admin Dashboard
        </h1>

        <div className="space-y-4">
          <Button
            onClick={() => onRoleSelect("content")}
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90 py-8 text-lg"
          >
            Content Administrator
          </Button>
          
          <Button
            onClick={() => onRoleSelect("verification")}
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90 py-8 text-lg"
          >
            Verification Administrator
          </Button>
          
          <Link to="/admin/verification-management" className="block">
            <Button 
              className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90 py-8 text-lg"
            >
              Verification Officers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminRoleSelector;
