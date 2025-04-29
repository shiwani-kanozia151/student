'use client';

import { StudentManagementTable } from '@/components/admin/verification/StudentManagementTable';
import { Toaster } from 'sonner';

export default function VerificationAdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <main className="p-6">
        <StudentManagementTable />
      </main>
    </div>
  );
} 