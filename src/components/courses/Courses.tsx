import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";

interface Course {
  id: string;
  name: string;
  type: string;
  description: string;
  duration?: string;
}

const Courses = () => {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchCourses = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching courses...");
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("type");

      if (error) throw error;

      console.log("Courses fetched:", data);
      if (data) {
        setCourses(data);
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
      console.log("Subscription payload received:", payload);
      if (payload.table === "courses") {
        console.log("Course change detected, refreshing...");
        fetchCourses(); // Refetch all courses when there's an update
      }
    });

    // Set up a manual refresh interval as a fallback
    const intervalId = setInterval(() => {
      console.log("Interval refresh of courses");
      fetchCourses();
    }, 10000); // Refresh every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchCourses]);
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  // Group courses by type
  const coursesByType = courses.reduce(
    (acc, course) => {
      const type = course.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(course);
      return acc;
    },
    {} as Record<string, Course[]>,
  );

  // Define program categories with all possible course types
  const programCategories = {
    undergraduate: ["btech", "bsc-bed"],
    postgraduate: ["mtech", "msc", "mca", "mba", "ma"],
    research: ["ms", "phd"],
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">Courses</h1>

        <div className="mb-12">
          <p className="text-gray-700 mb-6">
            The National Institute of Technology Tiruchirappalli offers a wide
            range of undergraduate, postgraduate, and doctoral programs across
            various disciplines. Below is a comprehensive list of courses
            available at our institution.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Undergraduate Programs
              </h2>
              <ul className="space-y-3">
                {programCategories.undergraduate.map((type) => {
                  if (!coursesByType[type] || coursesByType[type].length === 0)
                    return null;

                  const displayName =
                    type === "btech" ? "B. Tech. / B. Arch." : "B.Sc. B.Ed.";
                  const firstCourse = coursesByType[type][0];

                  return (
                    <li
                      key={type}
                      className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <Link
                        to={`/courses/${type}`}
                        className="block font-medium"
                      >
                        {displayName}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {type === "btech"
                          ? "Undergraduate engineering and architecture programs"
                          : "Integrated science and education program"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Postgraduate Programs
              </h2>
              <ul className="space-y-3">
                {programCategories.postgraduate.map((type) => {
                  if (!coursesByType[type] || coursesByType[type].length === 0)
                    return null;

                  let displayName = "";
                  let description = "";
                  const firstCourse = coursesByType[type][0];

                  switch (type) {
                    case "mtech":
                      displayName = "M. Tech. / M. Arch.";
                      description =
                        "Postgraduate engineering and architecture programs";
                      break;
                    case "msc":
                      displayName = "M. Sc.";
                      description = "Postgraduate science programs";
                      break;
                    case "mca":
                      displayName = "MCA";
                      description = "Master of Computer Applications";
                      break;
                    case "mba":
                      displayName = "MBA";
                      description = "Master of Business Administration";
                      break;
                    case "ma":
                      displayName = "MA";
                      description = "Master of Arts programs";
                      break;
                  }

                  return (
                    <li
                      key={type}
                      className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <Link
                        to={`/courses/${type}`}
                        className="block font-medium"
                      >
                        {displayName}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-[#002147] mb-4">
                Research Programs
              </h2>
              <ul className="space-y-3">
                {programCategories.research.map((type) => {
                  if (!coursesByType[type] || coursesByType[type].length === 0)
                    return null;

                  const displayName =
                    type === "ms" ? "M.S. (by Research)" : "Ph. D.";
                  const description =
                    type === "ms"
                      ? "Master of Science by research"
                      : "Doctoral research programs across disciplines";
                  const firstCourse = coursesByType[type][0];

                  return (
                    <li
                      key={type}
                      className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <Link
                        to={`/courses/${type}`}
                        className="block font-medium"
                      >
                        {displayName}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {description}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
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
        </div>
      </main>
    </div>
  );
};

export default Courses;
