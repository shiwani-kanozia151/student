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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import CourseEditorManager from "./CourseEditorManager";

const VALID_COURSE_TYPES = [
  'btech', 'bsc_bed', 'mtech', 'mca', 'ma', 
  'msc', 'mba', 'phd', 'ms_research'
] as const;

type CourseType = typeof VALID_COURSE_TYPES[number];
type CourseCategory = "ug" | "pg" | "research";

interface CurriculumItem {
  year?: string;
  subjects?: string[] | string;
  [key: string]: any;
}

interface Course {
  id: string;
  type: CourseType;
  name: string;
  description: string;
  duration: string;
  curriculum?: string[] | CurriculumItem | string | null;
  eligibility?: string;
  category?: CourseCategory;
}

interface CourseEditorProps {
  initialCourses?: Course[];
}

const CurriculumRenderer = ({ curriculum }: { curriculum: any }) => {
  if (!curriculum) return null;

  let parsedCurriculum = curriculum;
  if (typeof curriculum === 'string') {
    try {
      parsedCurriculum = JSON.parse(curriculum);
    } catch {
      return <div className="text-sm text-gray-500">{curriculum}</div>;
    }
  }

  if (Array.isArray(parsedCurriculum)) {
    return (
      <ul className="list-disc pl-5 mt-1">
        {parsedCurriculum.map((item, i) => (
          <li key={i} className="text-sm">
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof parsedCurriculum === 'object' && parsedCurriculum !== null) {
    return (
      <ul className="list-disc pl-5 mt-1">
        {Object.entries(parsedCurriculum).map(([key, value]) => (
          <li key={key} className="text-sm">
            <strong>{key}:</strong> {Array.isArray(value) 
              ? value.join(', ') 
              : typeof value === 'object' 
                ? JSON.stringify(value) 
                : String(value)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="text-sm text-gray-500">
      {JSON.stringify(parsedCurriculum)}
    </div>
  );
};

const CourseEditor = ({ initialCourses = [] }: CourseEditorProps) => {
  const getCategoryFromType = (type: CourseType): CourseCategory => {
    if (['btech', 'bsc_bed'].includes(type)) return 'ug';
    if (['phd', 'ms_research'].includes(type)) return 'research';
    return 'pg';
  };

  const getTypeDisplayName = (type: CourseType): string => {
    const typeMap: Record<CourseType, string> = {
      "btech": "B.Tech", "bsc_bed": "B.Sc B.Ed", "mtech": "M.Tech",
      "mca": "MCA", "ma": "MA", "msc": "M.Sc", "mba": "MBA",
      "phd": "Ph.D", "ms_research": "M.S. (Research)"
    };
    return typeMap[type];
  };

  const normalizeCurriculum = (curriculum: any) => {
    if (!curriculum) return null;
    if (Array.isArray(curriculum)) return curriculum;
    if (typeof curriculum === 'object') return curriculum;
    if (typeof curriculum === 'string') {
      try {
        return JSON.parse(curriculum);
      } catch {
        return curriculum;
      }
    }
    return null;
  };

  const processedCourses = initialCourses.length > 0 ? initialCourses.map(course => ({
    ...course,
    curriculum: normalizeCurriculum(course.curriculum),
    category: course.category || getCategoryFromType(course.type)
  })) : [
    {
      id: "1",
      type: "btech",
      name: "Computer Science and Engineering",
      description: "B.Tech program in Computer Science and Engineering",
      duration: "4 years",
      curriculum: [
        "First Year: Basic Sciences and Engineering",
        "Second Year: Core Subjects",
        "Third Year: Specializations",
        "Fourth Year: Projects and Electives"
      ],
      eligibility: "10+2 with Physics, Chemistry, and Mathematics",
      category: "ug"
    }
  ];

  const [courses, setCourses] = React.useState<Course[]>(processedCourses);
  const [activeCategory, setActiveCategory] = React.useState<CourseCategory>("ug");
  const [newCourse, setNewCourse] = React.useState<Omit<Course, 'id'> & { curriculumInput: string }>({
    type: "btech",
    name: "",
    description: "",
    duration: "",
    curriculum: [],
    eligibility: "",
    curriculumInput: "",
    category: "ug"
  });

  const categoryMap: Record<CourseCategory, CourseType[]> = {
    ug: ["btech", "bsc_bed"],
    pg: ["mtech", "mca", "ma", "msc", "mba"],
    research: ["phd", "ms_research"]
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
    
    setNewCourse({
      type: categoryMap[activeCategory][0],
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
      const invalidCourses = courses.filter(
        course => !VALID_COURSE_TYPES.includes(course.type)
      );
      
      if (invalidCourses.length > 0) {
        throw new Error(`Invalid course types: ${
          invalidCourses.map(c => c.type).join(", ")
        }`);
      }

      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .neq('id', '');

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('courses')
        .insert(courses.map(course => ({
          id: course.id,
          name: course.name,
          type: course.type,
          description: course.description,
          duration: course.duration,
          curriculum: course.curriculum || null,
          eligibility: course.eligibility || null
        })));

      if (insertError) throw insertError;

      alert("Courses saved successfully!");
      window.location.reload();
    } catch (err: any) {
      console.error("Error saving courses:", err);
      alert(`Error saving courses: ${err.message}`);
    }
  };

  const coursesByCategory = React.useMemo(() => {
    return courses.reduce((acc, course) => {
      const category = course.category || getCategoryFromType(course.type);
      if (!acc[category]) acc[category] = {};
      if (!acc[category][course.type]) acc[category][course.type] = [];
      acc[category][course.type].push(course);
      return acc;
    }, {} as Record<CourseCategory, Partial<Record<CourseType, Course[]>>>);
  }, [courses]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <Tabs 
        value={activeCategory} 
        onValueChange={(v) => setActiveCategory(v as CourseCategory)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full mb-6">
          <TabsTrigger value="ug">Undergraduate</TabsTrigger>
          <TabsTrigger value="pg">Postgraduate</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="course-editors">Course Editors</TabsTrigger>
        </TabsList>

        {Object.entries(categoryMap).map(([category, types]) => (
          <TabsContent key={category} value={category} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Add New {category === 'ug' ? 'Undergraduate' : 
                        category === 'pg' ? 'Postgraduate' : 'Research'} Course
              </h3>
              
              <div className="space-y-4">
                <Select
                  value={newCourse.type}
                  onValueChange={(value) => {
                    const courseType = value as CourseType;
                    setNewCourse({ 
                      ...newCourse, 
                      type: courseType,
                      category: getCategoryFromType(courseType)
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeDisplayName(type)}
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
                Current {category === 'ug' ? 'Undergraduate' : 
                        category === 'pg' ? 'Postgraduate' : 'Research'} Courses
              </h3>

              <div className="space-y-6">
                {types.map((type) => {
                  const coursesOfType = coursesByCategory[category as CourseCategory]?.[type] || [];
                  if (coursesOfType.length === 0) return null;

                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <h4 className="text-lg font-medium mb-4">
                        {getTypeDisplayName(type)} Programs
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
                                {course.curriculum && (
                                  <details className="text-sm text-gray-500">
                                    <summary className="cursor-pointer">View Curriculum</summary>
                                    <div className="mt-2">
                                      <CurriculumRenderer curriculum={course.curriculum} />
                                    </div>
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
        <TabsContent value="course-editors">
          <CourseEditorManager />
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default CourseEditor;