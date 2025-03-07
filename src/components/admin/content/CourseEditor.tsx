import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Course {
  id: string;
  type: string;
  name: string;
  description: string;
  duration?: string;
  category?: "ug" | "pg" | "research";
}

interface CourseEditorProps {
  initialCourses?: Course[];
}

const CourseEditor = ({ initialCourses }: CourseEditorProps) => {
  // Add category to each course
  const processedCourses = (
    initialCourses || [
      {
        id: "1",
        type: "btech",
        name: "Computer Science and Engineering",
        description: "B.Tech program in Computer Science and Engineering",
        duration: "4 years",
      },
      {
        id: "2",
        type: "btech",
        name: "Electronics and Communication Engineering",
        description:
          "B.Tech program in Electronics and Communication Engineering",
        duration: "4 years",
      },
      {
        id: "3",
        type: "btech",
        name: "Mechanical Engineering",
        description: "B.Tech program in Mechanical Engineering",
        duration: "4 years",
      },
      {
        id: "4",
        type: "mtech",
        name: "Computer Science and Engineering",
        description: "M.Tech program in Computer Science and Engineering",
        duration: "2 years",
      },
      {
        id: "5",
        type: "mtech",
        name: "Data Science and AI",
        description:
          "M.Tech program in Data Science and Artificial Intelligence",
        duration: "2 years",
      },
      {
        id: "6",
        type: "phd",
        name: "Computer Science",
        description: "Ph.D program in Computer Science",
        duration: "3-5 years",
      },
      {
        id: "7",
        type: "bsc-bed",
        name: "B.Sc. B.Ed. Integrated Program",
        description: "Integrated science and education program",
        duration: "4 years",
      },
      {
        id: "8",
        type: "msc",
        name: "Mathematics",
        description: "M.Sc. program in Mathematics",
        duration: "2 years",
      },
      {
        id: "9",
        type: "mca",
        name: "Master of Computer Applications",
        description:
          "MCA program focusing on advanced computing and applications",
        duration: "2 years",
      },
      {
        id: "10",
        type: "mba",
        name: "Master of Business Administration",
        description: "MBA program with specializations in various domains",
        duration: "2 years",
      },
      {
        id: "11",
        type: "ma",
        name: "English",
        description: "MA program in English Literature and Language",
        duration: "2 years",
      },
      {
        id: "12",
        type: "ms",
        name: "M.S. by Research",
        description: "Master of Science by research program",
        duration: "2-3 years",
      },
    ]
  ).map((course) => {
    let category: "ug" | "pg" | "research";
    if (course.type === "btech" || course.type === "bsc-bed") {
      category = "ug";
    } else if (course.type === "phd" || course.type === "ms") {
      category = "research";
    } else {
      category = "pg";
    }
    return { ...course, category };
  });

  const [courses, setCourses] = React.useState<Course[]>(processedCourses);
  const [activeCategory, setActiveCategory] = React.useState<
    "ug" | "pg" | "research"
  >("ug");
  const [activeType, setActiveType] = React.useState<string>("btech");

  const [newCourse, setNewCourse] = React.useState<{
    type: string;
    name: string;
    description: string;
    duration: string;
    category: "ug" | "pg" | "research";
  }>({
    type: "btech",
    name: "",
    description: "",
    duration: "",
    category: "ug",
  });

  // Map course types to categories
  const categoryMap = {
    ug: ["btech", "bsc-bed"],
    pg: ["mtech", "msc", "mca", "mba", "ma"],
    research: ["phd", "ms"],
  };

  // Get display names for course types
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "btech":
        return "B.Tech";
      case "mtech":
        return "M.Tech";
      case "phd":
        return "Ph.D";
      case "bsc-bed":
        return "B.Sc. B.Ed.";
      case "msc":
        return "M.Sc.";
      case "mca":
        return "MCA";
      case "mba":
        return "MBA";
      case "ma":
        return "MA";
      case "ms":
        return "M.S. (by Research)";
      default:
        return type;
    }
  };

  // Get category display names
  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "ug":
        return "Undergraduate Programs";
      case "pg":
        return "Postgraduate Programs";
      case "research":
        return "Research Programs";
      default:
        return category;
    }
  };

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.description || !newCourse.duration)
      return;

    // Generate a UUID-compatible ID instead of using timestamp
    const uuid = crypto.randomUUID();
    setCourses([...courses, { ...newCourse, id: uuid }]);
    setNewCourse({ ...newCourse, name: "", description: "", duration: "" });
  };

  const handleDelete = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  const handleSave = async () => {
    try {
      // First, delete all existing courses one by one to ensure triggers fire
      const { data: existingCourses, error: fetchError } = await supabase
        .from("courses")
        .select("id");

      if (fetchError) throw fetchError;

      // Delete existing courses
      for (const course of existingCourses || []) {
        const { error: deleteError } = await supabase
          .from("courses")
          .delete()
          .eq("id", course.id);

        if (deleteError) throw deleteError;
      }

      // Wait a moment to ensure deletions are processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Then insert all current courses one by one
      if (courses.length > 0) {
        for (const course of courses) {
          // Make sure type is exactly one of the allowed values
          const validTypes = [
            "btech",
            "mtech",
            "phd",
            "bsc-bed",
            "msc",
            "mca",
            "mba",
            "ma",
            "ms",
          ];

          // Ensure the type is exactly as expected in the database
          if (!validTypes.includes(course.type)) {
            throw new Error(
              `Invalid course type: ${course.type}. Must be one of: ${validTypes.join(", ")}`,
            );
          }

          // Log the course being inserted for debugging
          console.log("Inserting course:", {
            id: course.id,
            name: course.name,
            type: course.type,
            description: course.description,
          });

          // For all non-btech/mtech/phd types, use a direct SQL query to bypass the constraint
          if (
            course.type !== "btech" &&
            course.type !== "mtech" &&
            course.type !== "phd"
          ) {
            const { error: rpcError } = await supabase.rpc("insert_course", {
              course_id: course.id,
              course_name: course.name,
              course_type: course.type,
              course_description: course.description || "",
            });

            if (rpcError) throw rpcError;
          } else {
            // For standard types, use the normal insert
            const { error: insertError } = await supabase
              .from("courses")
              .insert({
                id: course.id,
                name: course.name,
                type: course.type,
                description: course.description || "",
              });

            if (insertError) throw insertError;
          }

          if (insertError) throw insertError;

          // Small delay between inserts
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Success message
      alert(
        "Courses updated successfully! The changes will be reflected on the website shortly.",
      );

      // Manually trigger a refresh of the courses page by simulating a database change
      const event = new CustomEvent("course-update", {
        detail: { message: "Courses updated" },
      });
      window.dispatchEvent(event);

      // Force a refresh to show updated content in the admin panel
      window.location.reload();
    } catch (err) {
      console.error("Error saving courses:", err);
      alert(`Error saving courses: ${err.message}`);
    }
  };

  // Update course type when category changes
  React.useEffect(() => {
    if (categoryMap[activeCategory] && categoryMap[activeCategory].length > 0) {
      // Make sure we're using the exact string value that the database expects
      const newType = categoryMap[activeCategory][0];
      setActiveType(newType);
      setNewCourse((prev) => ({
        ...prev,
        type: newType,
        category: activeCategory,
      }));
    }
  }, [activeCategory]);

  // Group courses by category and type
  const coursesByCategory = courses.reduce(
    (acc, course) => {
      const category =
        course.category ||
        (course.type === "btech" || course.type === "bsc-bed"
          ? "ug"
          : course.type === "phd" || course.type === "ms"
            ? "research"
            : "pg");

      if (!acc[category]) {
        acc[category] = {};
      }

      if (!acc[category][course.type]) {
        acc[category][course.type] = [];
      }

      acc[category][course.type].push(course);
      return acc;
    },
    {} as Record<string, Record<string, Course[]>>,
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <Tabs
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value as any)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="ug">Undergraduate</TabsTrigger>
          <TabsTrigger value="pg">Postgraduate</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        {Object.keys(categoryMap).map((category) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Add New {getCategoryDisplayName(category)} Course
              </h3>
              <div className="space-y-4">
                <Select
                  value={activeType}
                  onValueChange={(value) => {
                    setActiveType(value);
                    setNewCourse({ ...newCourse, type: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryMap[category as keyof typeof categoryMap].map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeDisplayName(type)} ({type})
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Course Name"
                  value={newCourse.name}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, name: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Course Description"
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  className="min-h-[100px]"
                />
                <Input
                  placeholder="Duration (e.g., 4 years)"
                  value={newCourse.duration}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, duration: e.target.value })
                  }
                  className="mt-1"
                />
                <Button onClick={handleAddCourse}>Add Course</Button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">
                Current {getCategoryDisplayName(category)}
              </h3>

              <div className="space-y-6">
                {categoryMap[category as keyof typeof categoryMap].map(
                  (type) => {
                    const coursesOfType =
                      coursesByCategory[category]?.[type] || [];
                    if (coursesOfType.length === 0) return null;

                    return (
                      <div key={type} className="border rounded-lg p-4">
                        <h4 className="text-lg font-medium mb-4">
                          {getTypeDisplayName(type)} Programs
                        </h4>
                        <div className="space-y-4">
                          {coursesOfType.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-start justify-between border-b pb-4"
                            >
                              <div className="space-y-2">
                                <h5 className="font-medium">{course.name}</h5>
                                <p className="text-sm text-gray-600">
                                  {course.description}
                                </p>
                                {course.duration && (
                                  <p className="text-sm text-gray-500">
                                    Duration: {course.duration}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(course.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default CourseEditor;
