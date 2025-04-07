import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

type CourseType = "btech" | "ug_btech" | "bsc_bed" | "mtech" | "mca" | "ma" | "msc" | "mba" | "phd" | "ms_research" | string;

interface Course {
  id: string;
  name: string;
  type: CourseType;
  description: string;
  duration: string;
  curriculum?: string[];
  eligibility?: string;
  is_active?: boolean;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log("[DEBUG] Fetching courses from Supabase...");
      
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("name");

      if (error) throw error;
      
      console.log("[DEBUG] Raw course data:", data);
      
      const visibleCourses = (data || []).filter(course => {
        const isVisible = course.is_active !== false;
        if (!isVisible) {
          console.log(`[DEBUG] Filtered out inactive course: ${course.name} (ID: ${course.id})`);
        }
        return isVisible;
      });

      console.log("[DEBUG] Visible courses:", visibleCourses);
      setCourses(visibleCourses);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

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
          console.log("[DEBUG] Course change detected - refreshing...");
          fetchCourses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Enhanced course grouping with all program types
  const groupedCourses = {
    btech: courses.filter(course => 
      ["btech", "ug_btech", "b.tech", "undergrad_btech"].includes(
        course.type.toLowerCase().replace(/\s+/g, '')
      )
    ),
    mtech: courses.filter(course => 
      ["mtech", "m.tech"].includes(course.type.toLowerCase())
    ),
    mca: courses.filter(course => 
      ["mca"].includes(course.type.toLowerCase())
    ),
    phd: courses.filter(course => 
      ["phd", "ph.d", "doctorate"].includes(course.type.toLowerCase())
    ),
    other: courses.filter(course => {
      const normalizedType = course.type.toLowerCase().replace(/\s+/g, '');
      return !["btech", "ug_btech", "b.tech", "undergrad_btech", "mtech", "m.tech", "mca", "phd", "ph.d", "doctorate"].includes(normalizedType);
    })
  };

  useEffect(() => {
    if (!loading) {
      console.log("[DEBUG] Grouped courses:", {
        btech: groupedCourses.btech,
        mtech: groupedCourses.mtech,
        mca: groupedCourses.mca,
        phd: groupedCourses.phd,
        other: groupedCourses.other
      });
      console.log("[DEBUG] All course types found:", 
        [...new Set(courses.map(c => c.type))]
      );
    }
  }, [loading, groupedCourses, courses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">Courses</h1>

        {/* Undergraduate Programs */}
        {groupedCourses.btech.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-6">
              Undergraduate Programs
            </h2>
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
          </div>
        )}

        {/* Postgraduate Programs */}
        {(groupedCourses.mtech.length > 0 || groupedCourses.mca.length > 0) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-6">
              Postgraduate Programs
            </h2>
            
            {groupedCourses.mtech.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-[#002147] mb-4">
                  M.Tech Programs
                </h3>
                <div className="space-y-4">
                  {groupedCourses.mtech.map((course) => (
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

            {groupedCourses.mca.length > 0 && (
              <>
                <h3 className="text-xl font-semibold text-[#002147] mb-4 mt-6">
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
        )}

        {/* Research Programs */}
        {groupedCourses.phd.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-6">
              Research Programs
            </h2>
            <h3 className="text-xl font-semibold text-[#002147] mb-4">
              Ph.D Programs
            </h3>
            <div className="space-y-4">
              {groupedCourses.phd.map((course) => (
                <CourseCard 
                  key={course.id}
                  course={course}
                  expanded={expandedCourse === course.id}
                  onToggle={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Programs */}
        {groupedCourses.other.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-6">
              Other Programs
            </h2>
            <div className="space-y-4">
              {groupedCourses.other.map((course) => (
                <CourseCard 
                  key={course.id}
                  course={course}
                  expanded={expandedCourse === course.id}
                  onToggle={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                />
              ))}
            </div>
          </div>
        )}

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