'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import VerificationAdmin from "@/components/admin/VerificationAdmin";
import VerificationAdminManager from "@/components/admin/verification/VerificationAdminManager";
import { Toaster } from 'sonner';

const VerificationAdminDashboard = () => {
  const [selectedView, setSelectedView] = React.useState<"allocate" | "manage" | null>(null);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Verification Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage student allocations and verification officers
            </p>
          </div>
          {selectedView && (
            <Button
              variant="ghost"
              onClick={() => setSelectedView(null)}
              className="flex items-center gap-2"
            >
              ← Back to Dashboard
            </Button>
          )}
        </div>

        {/* Main Action Buttons */}
        {!selectedView ? (
          <div className="grid grid-cols-2 gap-6">
            <Button
              variant="outline"
              className="h-32 text-lg"
              onClick={() => setSelectedView("allocate")}
            >
              <Users className="h-8 w-8 mr-4" />
              Allocate Students
            </Button>
            <Button
              variant="outline"
              className="h-32 text-lg"
              onClick={() => setSelectedView("manage")}
            >
              <UserPlus className="h-8 w-8 mr-4" />
              Add Verification Officers
            </Button>
          </div>
        ) : null}

        {/* Content Area */}
        <div className="mt-6">
          {selectedView === "allocate" && <VerificationAdmin />}
          {selectedView === "manage" && <VerificationAdminManager />}
        </div>
      </div>
    </div>
  );
};

export default VerificationAdminDashboard; 