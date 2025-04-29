import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ManualAssignmentProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface VerificationOfficer {
  id: string;
  name: string;
  email: string;
}

export function ManualAssignment({ courseId, isOpen, onClose, onSuccess }: ManualAssignmentProps) {
  const [verificationOfficers, setVerificationOfficers] = useState<VerificationOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<string>('');
  const [startIndex, setStartIndex] = useState<number>(1);
  const [endIndex, setEndIndex] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVerificationOfficers();
    }
  }, [courseId, isOpen]);

  const fetchVerificationOfficers = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/verification-officers`);
      if (!response.ok) {
        throw new Error('Failed to fetch verification officers');
      }
      const data = await response.json();
      setVerificationOfficers(data);
    } catch (error) {
      console.error('Error fetching verification officers:', error);
      toast.error('Failed to fetch verification officers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficer) {
      toast.error('Please select a verification officer');
      return;
    }
    if (startIndex > endIndex) {
      toast.error('Start index cannot be greater than end index');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/assign-students/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          verificationOfficerId: selectedOfficer,
          startIndex,
          endIndex,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign students');
      }

      toast.success('Students assigned successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error assigning students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-[400px] max-w-[90vw]">
          <h2 className="text-xl font-semibold mb-4">Manual Assignment</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Verification Officer
              </label>
              <Select
                defaultValue={selectedOfficer}
                onValueChange={setSelectedOfficer}
              >
                <option value="">Choose an officer</option>
                {verificationOfficers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Index
                </label>
                <Input
                  type="number"
                  min={1}
                  value={startIndex}
                  onChange={(e) => setStartIndex(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Index
                </label>
                <Input
                  type="number"
                  min={startIndex}
                  value={endIndex}
                  onChange={(e) => setEndIndex(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedOfficer || startIndex > endIndex}
              >
                {loading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
} 