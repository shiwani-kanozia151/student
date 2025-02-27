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

interface Course {
  id: string;
  name: string;
  type: "ug" | "pg" | "phd";
  description: string;
  duration: string;
}

const courses: Course[] = [
  {
    id: "btech-cse",
    name: "B.Tech in Computer Science and Engineering",
    type: "ug",
    description:
      "Four-year undergraduate program focusing on computer science fundamentals, programming, and software engineering.",
    duration: "4 years",
  },
  {
    id: "btech-ece",
    name: "B.Tech in Electronics and Communication Engineering",
    type: "ug",
    description:
      "Four-year undergraduate program covering electronics, communication systems, and signal processing.",
    duration: "4 years",
  },
  {
    id: "btech-mech",
    name: "B.Tech in Mechanical Engineering",
    type: "ug",
    description:
      "Four-year undergraduate program in mechanical systems, thermodynamics, and manufacturing.",
    duration: "4 years",
  },
  {
    id: "mtech-cse",
    name: "M.Tech in Computer Science and Engineering",
    type: "pg",
    description:
      "Two-year postgraduate program with specializations in AI, data science, and advanced computing.",
    duration: "2 years",
  },
  {
    id: "mtech-ece",
    name: "M.Tech in Electronics and Communication",
    type: "pg",
    description:
      "Two-year postgraduate program with focus on advanced electronics and communication systems.",
    duration: "2 years",
  },
  {
    id: "phd-cse",
    name: "Ph.D in Computer Science",
    type: "phd",
    description:
      "Research-focused doctoral program in computer science and related fields.",
    duration: "3-5 years",
  },
];

const CourseSelection = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = React.useState<
    "all" | "ug" | "pg" | "phd"
  >("all");

  const filteredCourses =
    selectedType === "all"
      ? courses
      : courses.filter((course) => course.type === selectedType);

  const handleCourseSelect = (courseId: string) => {
    navigate(`/student/application/${courseId}`);
  };

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
                <CardDescription>{course.duration}</CardDescription>
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
