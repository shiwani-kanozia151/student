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
  type: "btech" | "mtech" | "phd";
  name: string;
  description: string;
}

const CourseEditor = () => {
  const [courses, setCourses] = React.useState<Course[]>([
    {
      id: "1",
      type: "btech",
      name: "Computer Science and Engineering",
      description: "B.Tech program in Computer Science and Engineering",
    },
    {
      id: "2",
      type: "mtech",
      name: "Data Science and AI",
      description: "M.Tech program in Data Science and Artificial Intelligence",
    },
  ]);

  const [newCourse, setNewCourse] = React.useState<{
    type: "btech" | "mtech" | "phd";
    name: string;
    description: string;
  }>({ type: "btech", name: "", description: "" });

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.description) return;

    setCourses([...courses, { ...newCourse, id: Date.now().toString() }]);
    setNewCourse({ type: "btech", name: "", description: "" });
  };

  const handleDelete = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  const handleSave = async () => {
    try {
      // Save changes to backend
      for (const course of courses) {
        const { error } = await supabase.from("courses").upsert([
          {
            id: course.id,
            name: course.name,
            type: course.type,
            description: course.description,
          },
        ]);

        if (error) throw error;
      }

      // Force a refresh to show updated content
      window.location.reload();
    } catch (err) {
      console.error("Error saving courses:", err);
    }
  };

  const coursesByType = courses.reduce(
    (acc, course) => {
      acc[course.type].push(course);
      return acc;
    },
    { btech: [], mtech: [], phd: [] } as Record<string, Course[]>,
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add New Course</h3>
        <div className="space-y-4">
          <Select
            value={newCourse.type}
            onValueChange={(value: "btech" | "mtech" | "phd") =>
              setNewCourse({ ...newCourse, type: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="btech">B.Tech</SelectItem>
              <SelectItem value="mtech">M.Tech</SelectItem>
              <SelectItem value="phd">Ph.D</SelectItem>
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
          <Button onClick={handleAddCourse}>Add Course</Button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Current Courses</h3>

        <div className="space-y-6">
          {["btech", "mtech", "phd"].map((type) => (
            <div key={type} className="border rounded-lg p-4">
              <h4 className="text-lg font-medium mb-4">
                {type === "btech"
                  ? "B.Tech Programs"
                  : type === "mtech"
                    ? "M.Tech Programs"
                    : "Ph.D Programs"}
              </h4>
              <div className="space-y-4">
                {coursesByType[type].map((course) => (
                  <div
                    key={course.id}
                    className="flex items-start justify-between border-b pb-4"
                  >
                    <div className="space-y-2">
                      <h5 className="font-medium">{course.name}</h5>
                      <p className="text-sm text-gray-600">
                        {course.description}
                      </p>
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
