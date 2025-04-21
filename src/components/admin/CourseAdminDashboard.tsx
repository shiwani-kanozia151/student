import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
const CourseAdminDashboard = () => {
    const navigate = useNavigate();
    const [assignedCourses, setAssignedCourses] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
  
    React.useEffect(() => {
      const fetchAssignedCourses = async () => {
        const adminEmail = localStorage.getItem("adminEmail");
        const { data, error } = await supabase
          .from("course_editors")
          .select("course_id")
          .eq("editor_email", adminEmail);
  
        if (error) {
          console.error("Error fetching assigned courses:", error);
          return;
        }
  
        if (data && data.length > 0) {
          const courseIds = data.map(item => item.course_id);
          const { data: coursesData } = await supabase
            .from("courses")
            .select("*")
            .in("id", courseIds);
  
          setAssignedCourses(coursesData || []);
        }
        setLoading(false);
      };
  
      fetchAssignedCourses();
    }, []);
  
    if (loading) {
      return <div>Loading your assigned courses...</div>;
    }
  
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold mb-6">Course Editor Dashboard</h1>
        
        {assignedCourses.length === 0 ? (
          <div>No courses assigned to you yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignedCourses.map((course: any) => (
              <div key={course.id} className="bg-white p-4 rounded shadow">
                <h3 className="font-medium">{course.name}</h3>
                <Button 
                  onClick={() => navigate(`/course-admin/edit/${course.id}`)}
                  className="mt-2"
                >
                  Edit Course
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

export default CourseAdminDashboard;