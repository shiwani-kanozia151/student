import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CurriculumYear {
  year: string;
  subjects: string;
}

interface CourseDetails {
  id: string;
  name: string;
  description: string;
  duration: string;
  eligibility: string;
  curriculum: CurriculumYear[];
}

export default function CourseEditorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [editedCurriculum, setEditedCurriculum] = useState<CurriculumYear[]>([]);

  useEffect(() => {
    const courseId = localStorage.getItem('courseId');
    const courseName = localStorage.getItem('courseName');
    
    if (!courseId || !courseName) {
      navigate('/course-editor-login');
      return;
    }

    fetchCourseDetails(courseId);
  }, [navigate]);

  const fetchCourseDetails = async (courseId: string) => {
    try {
      setLoading(true);
      
      // Fetch complete course details including curriculum
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          description,
          duration,
          eligibility,
          curriculum
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;

      // Parse the curriculum if it exists
      let formattedCurriculum = [];
      
      if (data.curriculum) {
        // If curriculum is a string (from View Curriculum content), parse it into structured format
        if (typeof data.curriculum === 'string') {
          const lines = data.curriculum.split('\n').filter(line => line.trim());
          formattedCurriculum = lines.map(line => {
            const yearMatch = line.match(/Year \d+/);
            return {
              year: yearMatch ? yearMatch[0] : '',
              subjects: line.replace('•', '').trim()
            };
          });
        } 
        // If curriculum is already an array of year/subjects objects, use it as is
        else if (Array.isArray(data.curriculum)) {
          formattedCurriculum = data.curriculum;
        }
      }

      // Get number of years from duration
      let numberOfYears = 4; // default
      if (data.duration) {
        const durationMatch = data.duration.match(/\d+/);
        if (durationMatch) {
          numberOfYears = parseInt(durationMatch[0]);
        }
      }

      // Create dynamic years array based on duration
      const years = Array.from({ length: numberOfYears }, (_, i) => `Year ${i + 1}`);
      
      // Map existing curriculum to new years array
      const finalCurriculum = years.map(year => {
        const existing = formattedCurriculum.find(c => c.year === year);
        return existing || { year, subjects: '' };
      });

      const courseDetails = {
        ...data,
        curriculum: finalCurriculum
      };

      console.log('Loaded course details:', courseDetails);
      setCourseDetails(courseDetails);
      setEditedCurriculum(finalCurriculum);

    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('courseEditorId');
    localStorage.removeItem('courseEditorEmail');
    localStorage.removeItem('courseId');
    localStorage.removeItem('courseName');
    navigate('/course-editor-login');
  };

  const handleSaveChanges = async () => {
    if (!courseDetails) return;

    try {
      setLoading(true);

      if (!courseDetails?.id) {
        throw new Error('Course ID is missing');
      }

      // Get the current number of years from duration
      let numberOfYears = 4;
      if (courseDetails.duration) {
        const durationMatch = courseDetails.duration.match(/\d+/);
        if (durationMatch) {
          numberOfYears = parseInt(durationMatch[0]);
        }
      }

      // Filter curriculum to only include years up to the current duration
      const updatedCurriculum = editedCurriculum.filter((_, index) => index < numberOfYears);

      // Validate required fields
      if (!courseDetails.description?.trim()) {
        throw new Error('Course description is required');
      }

      if (!courseDetails.duration?.trim()) {
        throw new Error('Course duration is required');
      }

      // Prepare the update data
      const updateData = {
        description: courseDetails.description.trim(),
        duration: courseDetails.duration.trim(),
        eligibility: courseDetails.eligibility?.trim() || '',
        curriculum: updatedCurriculum
      };

      console.log('Saving changes with data:', updateData);

      const { error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseDetails.id);

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST204') {
          throw new Error('No changes were made. The data might be unchanged.');
        } else {
          throw new Error(error.message || 'Failed to save changes');
        }
      }

      // Update local state with new curriculum
      setCourseDetails({
        ...courseDetails,
        ...updateData
      });
      setEditedCurriculum(updatedCurriculum);

      toast.success('Course details updated successfully!');
      setIsEditing(false);

      // Emit change event
      const channel = supabase.channel('custom-all-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'courses' },
          (payload) => {
            console.log('Change received!', payload);
          }
        )
        .subscribe();

    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast.error(error.message || 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCurriculumChange = (yearIndex: number, newValue: string) => {
    const updatedCurriculum = [...editedCurriculum];
    updatedCurriculum[yearIndex] = {
      ...updatedCurriculum[yearIndex],
      subjects: newValue
    };
    setEditedCurriculum(updatedCurriculum);
  };

  // Add effect to update curriculum when duration changes
  useEffect(() => {
    if (courseDetails && isEditing) {
      let numberOfYears = 4;
      if (courseDetails.duration) {
        const durationMatch = courseDetails.duration.match(/\d+/);
        if (durationMatch) {
          numberOfYears = parseInt(durationMatch[0]);
        }
      }

      const years = Array.from({ length: numberOfYears }, (_, i) => `Year ${i + 1}`);
      
      // Create new curriculum array with existing data
      const newCurriculum = years.map(year => {
        const existing = editedCurriculum.find(c => c.year === year);
        return existing || { year, subjects: '' };
      });

      setEditedCurriculum(newCurriculum);
    }
  }, [courseDetails?.duration, isEditing]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Course Editor Dashboard</h1>
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {courseDetails && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <h2 className="text-xl font-semibold mb-4">{courseDetails.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                {isEditing ? (
                  <Textarea
                    value={courseDetails.description}
                    onChange={(e) => setCourseDetails({
                      ...courseDetails,
                      description: e.target.value
                    })}
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-700 p-3 bg-gray-50 rounded-md">{courseDetails.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duration</label>
                {isEditing ? (
                  <Input
                    value={courseDetails.duration}
                    onChange={(e) => setCourseDetails({
                      ...courseDetails,
                      duration: e.target.value
                    })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-700 p-3 bg-gray-50 rounded-md">{courseDetails.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Eligibility Criteria</label>
                {isEditing ? (
                  <Textarea
                    value={courseDetails.eligibility}
                    onChange={(e) => setCourseDetails({
                      ...courseDetails,
                      eligibility: e.target.value
                    })}
                    rows={3}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-700 p-3 bg-gray-50 rounded-md">{courseDetails.eligibility}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Curriculum</label>
                <div className="space-y-4">
                  {editedCurriculum.map((year, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <label className="block text-sm font-medium mb-2 text-blue-600">
                        {year.year}
                      </label>
                      {isEditing ? (
                        <Textarea
                          value={year.subjects}
                          onChange={(e) => handleCurriculumChange(index, e.target.value)}
                          rows={4}
                          placeholder={`Enter ${year.year} subjects and details...`}
                          className="w-full"
                        />
                      ) : (
                        <div className="text-gray-700 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                          {year.subjects || 'No curriculum details added yet.'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset curriculum to original state if cancelled
                      setEditedCurriculum(courseDetails.curriculum);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={loading}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  Edit Course Details
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}