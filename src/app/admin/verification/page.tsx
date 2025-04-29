import { VerificationManagement } from '@/components/admin/verification/VerificationManagement';
import { Toaster } from 'sonner';

export default function VerificationPage() {
  return (
    <>
      <Toaster position="top-right" />
      <VerificationManagement />
    </>
  );
} 