import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";

interface StudentLoginSelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNewStudent?: () => void;
  onExistingStudent?: () => void;
}

const StudentLoginSelector = ({
  isOpen = true,
  onClose = () => {},
  onNewStudent = () => {},
  onExistingStudent = () => {},
}: StudentLoginSelectorProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-6 bg-white dark:bg-gray-900">
        <DialogHeader className="space-y-3">
          <img 
            src="/nit-trichy-logo.png" 
            alt="NIT Trichy"
            className="h-16 w-16 mx-auto"
          />
          <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Welcome to NIT Trichy
          </DialogTitle>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            Choose your login option to proceed
          </p>
        </DialogHeader>

        <div className="mt-8 space-y-4">
          <Button
            onClick={onNewStudent}
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90 text-white py-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 h-auto"
          >
            <UserPlus className="h-5 w-5" />
            <span className="text-lg">New Student Registration</span>
          </Button>
          
          <Button
            onClick={onExistingStudent}
            variant="outline"
            className="w-full py-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3 h-auto border-2 border-gray-200 hover:border-[#0A2240] hover:bg-[#0A2240]/5 dark:border-gray-700 dark:hover:border-gray-600"
          >
            <LogIn className="h-5 w-5" />
            <span className="text-lg">Existing Student Login</span>
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          For assistance, please contact the administrator
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLoginSelector;
