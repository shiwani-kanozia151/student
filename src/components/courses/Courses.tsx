import React from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
  duration?: string;
  curriculum?: string[];
  eligibility?: string;
}

// Define category mappings based on your database types
const CATEGORY_MAP: Record<string, { name: string; types: string[] }> = {
  undergraduate: {
    name: "Undergraduate Programs",
    types: ["ug_btech", "ug_bsc_bed"]
  },
  postgraduate: {
    name: "Postgraduate Programs",
    types: ["pg_mtech", "pg_mca", "pg_ma", "pg_msc", "pg_mba"]
  },
  research: {
    name: "Research Programs",
    types: ["phd", "ms_research"]
  }
};

const Courses = () => {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedCourse, setExpandedCourse] = React.useState<string | null>(null);

  const fetchCourses = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setCourses(data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCourses();

    const unsubscribe = subscribeToContentUpdates((payload) => {
      if (payload.table === "courses") {
        fetchCourses();
      }
    });

    const handleCustomUpdate = () => fetchCourses();
    window.addEventListener("course-update", handleCustomUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener("course-update", handleCustomUpdate);
    };
  }, [fetchCourses]);

  // Group courses by category and type
  const groupedCourses = React.useMemo(() => {
    return courses.reduce((acc, course) => {
      // Find which category this course belongs to
      const category = Object.keys(CATEGORY_MAP).find(key =>
        CATEGORY_MAP[key].types.includes(course.type)
      ) || 'other';

      if (!acc[category]) acc[category] = {};
      if (!acc[category][course.type]) acc[category][course.type] = [];
      
      acc[category][course.type].push(course);
      return acc;
    }, {} as Record<string, Record<string, Course[]>>);
  }, [courses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  // Helper function to get display name for course type
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "ug_btech": return "B.Tech Programs";
      case "ug_bsc_bed": return "B.Sc B.Ed Programs";
      case "pg_mtech": return "M.Tech Programs";
      case "pg_mca": return "MCA Programs";
      case "pg_ma": return "MA Programs";
      case "pg_msc": return "M.Sc Programs";
      case "pg_mba": return "MBA Programs";
      case "phd": return "Ph.D Programs";
      case "ms_research": return "M.S. (Research) Programs";
      default: return `${type} Programs`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">Courses</h1>

        <div className="mb-12">
          <p className="text-gray-700 mb-6">
            The National Institute of Technology Tiruchirappalli offers a wide
            range of undergraduate, postgraduate, and doctoral programs across
            various disciplines.
          </p>

          {/* Categories Section */}
          {Object.entries(CATEGORY_MAP).map(([categoryKey, category]) => (
            <div key={categoryKey} className="mb-12">
              <h2 className="text-2xl font-bold text-[#002147] mb-6">
                {category.name}
              </h2>

              {/* Programs by Type */}
              {category.types.map((type) => {
                const coursesOfType = groupedCourses[categoryKey]?.[type] || [];
                if (coursesOfType.length === 0) return null;

                return (
                  <div key={type} className="mb-8">
                    <h3 className="text-xl font-semibold text-[#002147] mb-4">
                      {getTypeDisplayName(type)}
                    </h3>
                    
                    <div className="space-y-4">
                      {coursesOfType.map((course) => (
                        <div 
                          key={course.id}
                          className="border rounded-lg overflow-hidden shadow-sm"
                        >
                          <div 
                            className="p-4 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                            onClick={() => setExpandedCourse(
                              expandedCourse === course.id ? null : course.id
                            )}
                          >
                            <div>
                              <h4 className="font-medium">{course.name}</h4>
                              {course.duration && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Duration: {course.duration}
                                </p>
                              )}
                            </div>
                            {expandedCourse === course.id ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </div>

                          {expandedCourse === course.id && (
                            <div className="p-4 border-t">
                              <p className="mb-3">{course.description}</p>
                              
                              {course.eligibility && (
                                <div className="mb-3">
                                  <h5 className="font-medium">Eligibility:</h5>
                                  <p>{course.eligibility}</p>
                                </div>
                              )}

                              {course.curriculum?.length > 0 && (
                                <div>
                                  <h5 className="font-medium">Curriculum:</h5>
                                  <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {course.curriculum.map((item, i) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Contact Information */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-[#002147] mb-4">
              Contact Information
            </h2>
            <div className="p-4 bg-white rounded border border-gray-200">
              <p className="font-medium mb-2">Academic Section</p>
              <p className="mb-1">National Institute of Technology</p>
              <p className="mb-1">Tiruchirappalli – 620 015</p>
              <p className="mb-4">Tamil Nadu, India</p>
              <p className="mb-1">
                <span className="font-medium">Email:</span> academic@nitt.edu
              </p>
              <p>
                <span className="font-medium">Phone:</span> +91-431-2503910
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Courses;