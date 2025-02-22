import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      <DialogContent className="bg-white sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0A2240] mb-4">
            Student Login
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button
            onClick={onNewStudent}
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90 py-8 text-lg"
          >
            New Student Registration
          </Button>
          <Button
            onClick={onExistingStudent}
            variant="outline"
            className="w-full py-8 text-lg border-[#0A2240] text-[#0A2240] hover:bg-[#0A2240]/10"
          >
            Existing Student Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLoginSelector;
