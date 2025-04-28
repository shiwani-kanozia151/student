import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ManualAssignment } from './ManualAssignment';
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
}

export function VerificationManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isManualAssignmentOpen, setIsManualAssignmentOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
      setLoading(false);
    }
  };

  const handleAssignmentSuccess = () => {
    toast.success('Student assignments updated successfully');
    // You can add additional refresh logic here if needed
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Verification Management</h1>
        <p className="text-gray-600">
          Manage student verification assignments and officers for your courses.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-[300px]">
            <label className="block text-sm font-medium mb-1">
              Select Course
            </label>
            <Select
              defaultValue={selectedCourseId}
              onValueChange={setSelectedCourseId}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            onClick={() => setIsManualAssignmentOpen(true)}
            disabled={!selectedCourseId || loading}
            className="mt-6"
          >
            Manual Assignment
          </Button>
        </div>
      </div>

      {/* Statistics or current assignments could go here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add statistics cards or other relevant information */}
      </div>

      {/* Manual Assignment Modal */}
      {selectedCourseId && (
        <ManualAssignment
          courseId={selectedCourseId}
          isOpen={isManualAssignmentOpen}
          onClose={() => setIsManualAssignmentOpen(false)}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
} 