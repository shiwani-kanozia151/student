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

interface Course {
  id: string;
  type:
    | "btech"
    | "mtech"
    | "phd"
    | "bsc-bed"
    | "msc"
    | "mca"
    | "mba"
    | "ma"
    | "ms";
  name: string;
  description: string;
  duration?: string;
}

interface CourseEditorProps {
  initialCourses?: Course[];
}

const CourseEditor = ({ initialCourses }: CourseEditorProps) => {
  const [courses, setCourses] = React.useState<Course[]>(
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
    ],
  );

  const [newCourse, setNewCourse] = React.useState<{
    type:
      | "btech"
      | "mtech"
      | "phd"
      | "bsc-bed"
      | "msc"
      | "mca"
      | "mba"
      | "ma"
      | "ms";
    name: string;
    description: string;
    duration: string;
  }>({ type: "btech", name: "", description: "", duration: "" });

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.description || !newCourse.duration)
      return;

    setCourses([...courses, { ...newCourse, id: Date.now().toString() }]);
    setNewCourse({ type: "btech", name: "", description: "", duration: "" });
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
          const { error: insertError } = await supabase.from("courses").insert({
            id: course.id,
            name: course.name,
            type: course.type,
            description: course.description,
            // Temporarily remove duration field until column is added
          });

          if (insertError) throw insertError;

          // Small delay between inserts
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Success message
      alert("Courses updated successfully!");

      // Force a refresh to show updated content
      window.location.reload();
    } catch (err) {
      console.error("Error saving courses:", err);
      alert(`Error saving courses: ${err.message}`);
    }
  };

  const coursesByType = courses.reduce(
    (acc, course) => {
      if (!acc[course.type]) {
        acc[course.type] = [];
      }
      acc[course.type].push(course);
      return acc;
    },
    {
      btech: [],
      mtech: [],
      phd: [],
      "bsc-bed": [],
      msc: [],
      mca: [],
      mba: [],
      ma: [],
      ms: [],
    } as Record<string, Course[]>,
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add New Course</h3>
        <div className="space-y-4">
          <Select
            value={newCourse.type}
            onValueChange={(
              value:
                | "btech"
                | "mtech"
                | "phd"
                | "bsc-bed"
                | "msc"
                | "mca"
                | "mba"
                | "ma"
                | "ms",
            ) => setNewCourse({ ...newCourse, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="btech">B.Tech</SelectItem>
              <SelectItem value="mtech">M.Tech</SelectItem>
              <SelectItem value="phd">Ph.D</SelectItem>
              <SelectItem value="bsc-bed">B.Sc. B.Ed.</SelectItem>
              <SelectItem value="msc">M.Sc.</SelectItem>
              <SelectItem value="mca">MCA</SelectItem>
              <SelectItem value="mba">MBA</SelectItem>
              <SelectItem value="ma">MA</SelectItem>
              <SelectItem value="ms">M.S. (by Research)</SelectItem>
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
        <h3 className="text-xl font-semibold">Current Courses</h3>

        <div className="space-y-6">
          {[
            "btech",
            "mtech",
            "phd",
            "bsc-bed",
            "msc",
            "mca",
            "mba",
            "ma",
            "ms",
          ].map((type) => (
            <div key={type} className="border rounded-lg p-4">
              <h4 className="text-lg font-medium mb-4">
                {type === "btech"
                  ? "B.Tech Programs"
                  : type === "mtech"
                    ? "M.Tech Programs"
                    : type === "phd"
                      ? "Ph.D Programs"
                      : type === "bsc-bed"
                        ? "B.Sc. B.Ed. Programs"
                        : type === "msc"
                          ? "M.Sc. Programs"
                          : type === "mca"
                            ? "MCA Programs"
                            : type === "mba"
                              ? "MBA Programs"
                              : type === "ma"
                                ? "MA Programs"
                                : "M.S. (by Research) Programs"}
              </h4>
              <div className="space-y-4">
                {coursesByType[type]?.map((course) => (
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
          ))}
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default CourseEditor;
