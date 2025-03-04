import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";

interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
  duration?: string;
}

interface MappedCourse extends Course {
  type: "ug" | "pg" | "phd";
}

const CourseSelection = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = React.useState<
    "all" | "ug" | "pg" | "phd"
  >("all");
  const [courses, setCourses] = React.useState<MappedCourse[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchCourses = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log("CourseSelection: Fetching courses...");
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("type");

      if (error) throw error;

      console.log("CourseSelection: Courses fetched:", data);
      if (data) {
        // Map database courses to UI courses with proper types
        const mappedCourses = data.map((course) => {
          // Map database type to UI type
          let uiType: "ug" | "pg" | "phd";
          if (course.type === "btech" || course.type === "bsc-bed") {
            uiType = "ug";
          } else if (
            course.type === "mtech" ||
            course.type === "msc" ||
            course.type === "mca" ||
            course.type === "mba" ||
            course.type === "ma"
          ) {
            uiType = "pg";
          } else {
            uiType = "phd";
          }

          return {
            ...course,
            type: uiType,
          };
        });

        setCourses(mappedCourses);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCourses();

    // Set up real-time subscription for course updates
    const unsubscribe = subscribeToContentUpdates((payload) => {
      console.log("CourseSelection: Subscription payload received:", payload);
      if (payload.table === "courses") {
        console.log("CourseSelection: Course change detected, refreshing...");
        fetchCourses(); // Refetch all courses when there's an update
      }
    });

    // Listen for custom course update events
    const handleCustomUpdate = () => {
      console.log("CourseSelection: Custom course update event detected");
      fetchCourses();
    };
    window.addEventListener("course-update", handleCustomUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("course-update", handleCustomUpdate);
    };
  }, [fetchCourses]);

  const filteredCourses =
    selectedType === "all"
      ? courses
      : courses.filter((course) => course.type === selectedType);

  const handleCourseSelect = (courseId: string) => {
    navigate(`/student/application/${courseId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Available Courses
          </h1>
          <div className="flex gap-2">
            <Button
              variant={selectedType === "all" ? "default" : "outline"}
              onClick={() => setSelectedType("all")}
            >
              All
            </Button>
            <Button
              variant={selectedType === "ug" ? "default" : "outline"}
              onClick={() => setSelectedType("ug")}
            >
              Undergraduate
            </Button>
            <Button
              variant={selectedType === "pg" ? "default" : "outline"}
              onClick={() => setSelectedType("pg")}
            >
              Postgraduate
            </Button>
            <Button
              variant={selectedType === "phd" ? "default" : "outline"}
              onClick={() => setSelectedType("phd")}
            >
              Ph.D
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <CardHeader className="bg-[#0A2240]/5 pb-4">
                <CardTitle>{course.name}</CardTitle>
                <CardDescription>
                  {course.type === "ug"
                    ? "Undergraduate"
                    : course.type === "pg"
                      ? "Postgraduate"
                      : "Research"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-gray-700">{course.description}</p>
              </CardContent>
              <CardFooter className="border-t bg-gray-50 flex justify-end">
                <Button onClick={() => handleCourseSelect(course.id)}>
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseSelection;
