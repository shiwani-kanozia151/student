'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CourseEditorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const editorId = localStorage.getItem('courseEditorId');
      const editorEmail = localStorage.getItem('courseEditorEmail');
      const courseId = localStorage.getItem('courseId');

      if (!editorId || !editorEmail || !courseId) {
        toast.error('Please login first');
        router.push('/course-editor/login');
        return false;
      }
      return true;
    };

    const fetchCourseData = async () => {
      if (!checkAuth()) return;

      try {
        const courseId = localStorage.getItem('courseId');
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        setCourseData(data);
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('courseEditorId');
    localStorage.removeItem('courseEditorEmail');
    localStorage.removeItem('courseId');
    localStorage.removeItem('courseName');
    router.push('/course-editor/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Course Editor Dashboard
          </h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            Logout
          </Button>
        </div>

        {courseData ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {courseData.name}
            </h2>
            {/* Add your course editing form/interface here */}
            <div className="space-y-4">
              <p className="text-gray-600">
                You can edit the course content here. This interface will be customized based on your course editing requirements.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            No course data found.
          </div>
        )}
      </div>
    </div>
  );
} 