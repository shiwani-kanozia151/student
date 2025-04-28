import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CourseEditorLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, check if the editor exists in course_editors table
      const { data: editorData, error: editorError } = await supabase
        .from('course_editors')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .eq('password_hash', credentials.password) // In production, use proper password hashing
        .single();

      if (editorError || !editorData) {
        throw new Error('Invalid credentials');
      }

      // Store editor info in localStorage
      localStorage.setItem('courseEditorId', editorData.id);
      localStorage.setItem('courseEditorEmail', editorData.email);
      localStorage.setItem('courseId', editorData.course_id);
      localStorage.setItem('courseName', editorData.course_name);

      // Update last login timestamp
      await supabase
        .from('course_editors')
        .update({ last_login: new Date().toISOString() })
        .eq('id', editorData.id);

      toast.success('Login successful!');
      navigate('/course-editor/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-[#0A2240] mb-6">
          Course Editor Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              placeholder="Enter your email"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              placeholder="Enter your password"
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#0A2240] hover:bg-[#0A2240]/90"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              </div>
            ) : (
              'Login'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 