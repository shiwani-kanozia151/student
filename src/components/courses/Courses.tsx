import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

// 1. Define types matching your database
type CourseType = "btech" | "bsc_bed" | "mtech" | "mca" | "ma" | "msc" | "mba" | "phd" | "ms_research";

interface Course {
  id: string;
  name: string;
  type: CourseType;
  description: string;
  duration: string;
  curriculum?: string[];
  eligibility?: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // 2. Fetch courses with proper error handling
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("name");

      if (error) throw error;
      
      // Debug: Log fetched data
      console.log("Fetched courses:", data);
      
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Set up real-time updates
  useEffect(() => {
    fetchCourses();

    const channel = supabase
      .channel("courses_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses",
        },
        () => {
          console.log("Course change detected - refreshing...");
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Group courses by type
  const groupedCourses = {
    btech: courses.filter(course => course.type === "btech"),
    mca: courses.filter(course => course.type === "mca"),
    // Add other types as needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  // 5. Render courses
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">Courses</h1>

        {/* Undergraduate Programs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-6">
            Undergraduate Programs
          </h2>

          {groupedCourses.btech.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-[#002147] mb-4">
                B.Tech Programs
              </h3>
              <div className="space-y-4">
                {groupedCourses.btech.map((course) => (
                  <CourseCard 
                    key={course.id}
                    course={course}
                    expanded={expandedCourse === course.id}
                    onToggle={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Postgraduate Programs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-6">
            Postgraduate Programs
          </h2>

          {groupedCourses.mca.length > 0 && (
            <>
              <h3 className="text-xl font-semibold text-[#002147] mb-4">
                MCA Programs
              </h3>
              <div className="space-y-4">
                {groupedCourses.mca.map((course) => (
                  <CourseCard 
                    key={course.id}
                    course={course}
                    expanded={expandedCourse === course.id}
                    onToggle={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

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
      </main>
    </div>
  );
};

// 6. Course Card Component
const CourseCard = ({ course, expanded, onToggle }: { course: Course, expanded: boolean, onToggle: () => void }) => (
  <div className="border rounded-lg overflow-hidden shadow-sm">
    <div 
      className="p-4 cursor-pointer flex justify-between items-center bg-gray-50 hover:bg-gray-100"
      onClick={onToggle}
    >
      <div>
        <h4 className="font-medium">{course.name}</h4>
        <p className="text-sm text-gray-600 mt-1">
          Duration: {course.duration}
        </p>
      </div>
      {expanded ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </div>

    {expanded && (
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
);

export default Courses;