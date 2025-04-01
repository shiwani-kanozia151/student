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
  category: "ug" | "pg" | "research";
  originalType: string;
}

// Define consistent course type categories
const COURSE_CATEGORIES = {
  UG: ["ug_btech", "ug_bsc_bed"],
  PG: ["pg_mtech", "pg_mca", "pg_ma", "pg_msc", "pg_mba"],
  RESEARCH: ["phd", "ms_research"]
};

const CourseSelection = () => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<"category" | "courses">("category");
  const [selectedCategory, setSelectedCategory] = React.useState<
    "ug" | "pg" | "research" | null
  >(null);
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
        // Map database courses to UI courses with proper categories
        const mappedCourses = data.map((course) => {
          // Map database type to UI category
          let category: "ug" | "pg" | "research" | null = null;
          
          if (COURSE_CATEGORIES.UG.includes(course.type)) {
            category = "ug";
          } else if (COURSE_CATEGORIES.PG.includes(course.type)) {
            category = "pg";
          } else if (COURSE_CATEGORIES.RESEARCH.includes(course.type)) {
            category = "research";
          } else {
            console.warn(`Unknown course type: ${course.type}`);
            return null;
          }

          return {
            ...course,
            category,
            originalType: course.type,
          };
        }).filter(Boolean) as MappedCourse[]; // Filter out null values

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
        fetchCourses();
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

  const filteredCourses = selectedCategory
    ? courses.filter((course) => course.category === selectedCategory)
    : [];

  const handleCategorySelect = (category: "ug" | "pg" | "research") => {
    setSelectedCategory(category);
    setStep("courses");
  };

  const handleCourseSelect = (courseId: string) => {
    navigate(`/student/application/${courseId}`);
  };

  const handleBackToCategories = () => {
    setStep("category");
    setSelectedCategory(null);
  };

  // Get display name for course type
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "ug_btech":
        return "B.Tech";
      case "pg_mtech":
        return "M.Tech";
      case "phd":
        return "Ph.D";
      case "ug_bsc_bed":
        return "B.Sc. B.Ed.";
      case "pg_msc":
        return "M.Sc.";
      case "pg_mca":
        return "MCA";
      case "pg_mba":
        return "MBA";
      case "pg_ma":
        return "MA";
      case "ms_research":
        return "M.S. (by Research)";
      default:
        return type.toUpperCase();
    }
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
        {step === "category" ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#0A2240] mb-4">
                Select Program Category
              </h1>
              <p className="text-gray-600">
                Choose a program category to view available courses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCategorySelect("ug")}
              >
                <CardHeader className="bg-[#0A2240]/5">
                  <CardTitle>Undergraduate Programs</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">
                    B.Tech, B.Sc. B.Ed. and other undergraduate programs
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 flex justify-end">
                  <Button>View Programs</Button>
                </CardFooter>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCategorySelect("pg")}
              >
                <CardHeader className="bg-[#0A2240]/5">
                  <CardTitle>Postgraduate Programs</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">
                    M.Tech, M.Sc, MBA, MCA, and other postgraduate programs
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 flex justify-end">
                  <Button>View Programs</Button>
                </CardFooter>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCategorySelect("research")}
              >
                <CardHeader className="bg-[#0A2240]/5">
                  <CardTitle>Research Programs</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">
                    Ph.D and M.S. by Research programs
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 flex justify-end">
                  <Button>View Programs</Button>
                </CardFooter>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#0A2240]">
                {selectedCategory === "ug"
                  ? "Undergraduate Programs"
                  : selectedCategory === "pg"
                    ? "Postgraduate Programs"
                    : "Research Programs"}
              </h1>
              <Button variant="outline" onClick={handleBackToCategories}>
                Back to Categories
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="bg-[#0A2240]/5 pb-4">
                    <CardTitle>{course.name}</CardTitle>
                    <CardDescription>
                      {getTypeDisplayName(course.originalType)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-700">{course.description}</p>
                    {course.duration && (
                      <p className="text-sm text-gray-500 mt-2">
                        Duration: {course.duration}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 flex justify-end">
                    <Button onClick={() => handleCourseSelect(course.id)}>
                      Apply Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}

              {filteredCourses.length === 0 && (
                <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    No courses available in this category
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseSelection;