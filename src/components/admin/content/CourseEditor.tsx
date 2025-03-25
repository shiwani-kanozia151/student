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

// Define valid course types based on your database constraints
const VALID_COURSE_TYPES = [
  'ug_btech',
  'ug_bsc_bed',
  'pg_mtech',
  'pg_mca',
  'pg_ma',
  'pg_msc',
  'pg_mba',
  'phd'
] as const;

type CourseType = typeof VALID_COURSE_TYPES[number];

interface Course {
  id: string;
  type: CourseType;
  name: string;
  description: string;
  duration: string;
  curriculum?: string[];
  eligibility?: string;
  category?: "ug" | "pg" | "research";
}

interface CourseEditorProps {
  initialCourses?: Course[];
}

const CourseEditor = ({ initialCourses }: CourseEditorProps) => {
  // Initialize courses with proper types and additional fields
  const processedCourses = (
    initialCourses || [
      {
        id: "1",
        type: "ug_btech",
        name: "Computer Science and Engineering",
        description: "B.Tech program in Computer Science and Engineering",
        duration: "4 years",
        curriculum: [
          "First Year: Basic Sciences and Engineering",
          "Second Year: Core Subjects",
          "Third Year: Specializations",
          "Fourth Year: Projects and Electives"
        ],
        eligibility: "10+2 with Physics, Chemistry, and Mathematics"
      },
      // Other courses with similar structure...
    ]
  ).map((course) => {
    let category: "ug" | "pg" | "research" = "pg"; // default
    if (course.type.startsWith('ug_')) {
      category = "ug";
    } else if (course.type.startsWith('pg_')) {
      category = "pg";
    } else if (course.type === 'phd') {
      category = "research";
    }
    return { ...course, category };
  });

  const [courses, setCourses] = React.useState<Course[]>(processedCourses);
  const [activeCategory, setActiveCategory] = React.useState<"ug" | "pg" | "research">("ug");
  const [activeType, setActiveType] = React.useState<CourseType>("ug_btech");
  const [newCourse, setNewCourse] = React.useState<Omit<Course, 'id'> & { curriculumInput: string }>({
    type: "ug_btech",
    name: "",
    description: "",
    duration: "",
    curriculum: [],
    eligibility: "",
    curriculumInput: "", // Temporary input for curriculum items
    category: "ug"
  });

  // Map course types to categories
  const categoryMap = {
    ug: ["ug_btech", "ug_bsc_bed"],
    pg: ["pg_mtech", "pg_mca", "pg_ma", "pg_msc", "pg_mba"],
    research: ["phd"]
  };

  // Helper functions
  const getTypeDisplayName = (type: CourseType) => {
    switch (type) {
      case "ug_btech": return "B.Tech";
      case "ug_bsc_bed": return "B.Sc B.Ed";
      case "pg_mtech": return "M.Tech";
      case "pg_mca": return "MCA";
      case "pg_ma": return "MA";
      case "pg_msc": return "M.Sc";
      case "pg_mba": return "MBA";
      case "phd": return "Ph.D";
      default: return type;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "ug": return "Undergraduate Programs";
      case "pg": return "Postgraduate Programs";
      case "research": return "Research Programs";
      default: return category;
    }
  };

  const handleAddCurriculumItem = () => {
    if (newCourse.curriculumInput.trim()) {
      setNewCourse({
        ...newCourse,
        curriculum: [...(newCourse.curriculum || []), newCourse.curriculumInput],
        curriculumInput: ""
      });
    }
  };

  const handleRemoveCurriculumItem = (index: number) => {
    setNewCourse({
      ...newCourse,
      curriculum: newCourse.curriculum?.filter((_, i) => i !== index)
    });
  };

  const handleAddCourse = () => {
    if (!newCourse.name || !newCourse.description || !newCourse.duration) return;

    const uuid = crypto.randomUUID();
    setCourses([...courses, { 
      ...newCourse, 
      id: uuid,
      curriculum: newCourse.curriculum || []
    }]);
    
    // Reset form but keep current category/type
    setNewCourse({
      type: categoryMap[activeCategory][0] as CourseType,
      name: "",
      description: "",
      duration: "",
      curriculum: [],
      eligibility: "",
      curriculumInput: "",
      category: activeCategory
    });
  };

  const handleDelete = (id: string) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  const handleSave = async () => {
    try {
      // Delete existing courses
      const { data: existingCourses, error: fetchError } = await supabase
        .from("courses")
        .select("id");

      if (fetchError) throw fetchError;

      for (const course of existingCourses || []) {
        const { error: deleteError } = await supabase
          .from("courses")
          .delete()
          .eq("id", course.id);
        if (deleteError) throw deleteError;
      }

      // Insert current courses
      for (const course of courses) {
        if (!VALID_COURSE_TYPES.includes(course.type)) {
          throw new Error(`Invalid course type: ${course.type}`);
        }

        const { error } = await supabase.from("courses").insert({
          id: course.id,
          name: course.name,
          type: course.type,
          description: course.description,
          duration: course.duration,
          curriculum: course.curriculum || [],
          eligibility: course.eligibility || ""
        });

        if (error) throw error;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      alert("Courses updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error saving courses:", err);
      alert(`Error saving courses: ${err.message}`);
    }
  };

  // Update course type when category changes
  React.useEffect(() => {
    if (categoryMap[activeCategory]?.length > 0) {
      const newType = categoryMap[activeCategory][0] as CourseType;
      setActiveType(newType);
      setNewCourse(prev => ({
        ...prev,
        type: newType,
        category: activeCategory
      }));
    }
  }, [activeCategory]);

  // Group courses by category and type
  const coursesByCategory = React.useMemo(() => {
    return courses.reduce((acc, course) => {
      const category = course.category || 
        (course.type.startsWith('ug_') ? "ug" : 
         course.type.startsWith('pg_') ? "pg" : "research");

      if (!acc[category]) acc[category] = {};
      if (!acc[category][course.type]) acc[category][course.type] = [];
      
      acc[category][course.type].push(course);
      return acc;
    }, {} as Record<string, Record<string, Course[]>>);
  }, [courses]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)} className="w-full">
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="ug">Undergraduate</TabsTrigger>
          <TabsTrigger value="pg">Postgraduate</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        {Object.entries(categoryMap).map(([category, types]) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Add New {getCategoryDisplayName(category)} Course
              </h3>
              
              <div className="space-y-4">
                <Select
                  value={newCourse.type}
                  onValueChange={(value) => {
                    setActiveType(value as CourseType);
                    setNewCourse({ ...newCourse, type: value as CourseType });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeDisplayName(type as CourseType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Course Name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  required
                />

                <Textarea
                  placeholder="Course Description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="min-h-[100px]"
                  required
                />

                <Input
                  placeholder="Duration (e.g., 4 years)"
                  value={newCourse.duration}
                  onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                  required
                />

                <Textarea
                  placeholder="Eligibility Criteria"
                  value={newCourse.eligibility || ""}
                  onChange={(e) => setNewCourse({ ...newCourse, eligibility: e.target.value })}
                  className="min-h-[60px]"
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Curriculum</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add curriculum item (e.g., 'Year 1: Core Subjects')"
                      value={newCourse.curriculumInput}
                      onChange={(e) => setNewCourse({ ...newCourse, curriculumInput: e.target.value })}
                    />
                    <Button type="button" onClick={handleAddCurriculumItem}>
                      Add
                    </Button>
                  </div>
                  {newCourse.curriculum?.length > 0 && (
                    <ul className="border rounded-md p-2 space-y-1">
                      {newCourse.curriculum.map((item, index) => (
                        <li key={index} className="flex justify-between items-center">
                          <span>{item}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCurriculumItem(index)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button onClick={handleAddCourse}>Add Course</Button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">
                Current {getCategoryDisplayName(category)}
              </h3>

              <div className="space-y-6">
                {types.map((type) => {
                  const coursesOfType = coursesByCategory[category]?.[type] || [];
                  if (coursesOfType.length === 0) return null;

                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <h4 className="text-lg font-medium mb-4">
                        {getTypeDisplayName(type as CourseType)} Programs
                      </h4>
                      <div className="space-y-4">
                        {coursesOfType.map((course) => (
                          <div key={course.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <h5 className="font-medium">{course.name}</h5>
                                <p className="text-sm text-gray-600">{course.description}</p>
                                <p className="text-sm text-gray-500">Duration: {course.duration}</p>
                                {course.eligibility && (
                                  <p className="text-sm text-gray-500">Eligibility: {course.eligibility}</p>
                                )}
                                {course.curriculum?.length > 0 && (
                                  <details className="text-sm text-gray-500">
                                    <summary className="cursor-pointer">View Curriculum</summary>
                                    <ul className="list-disc pl-5 mt-1">
                                      {course.curriculum.map((item, i) => (
                                        <li key={i}>{item}</li>
                                      ))}
                                    </ul>
                                  </details>
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
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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