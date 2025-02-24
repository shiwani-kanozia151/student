import React from "react";
import { Button } from "@/components/ui/button";
import { isAuthorized } from "@/lib/adminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AboutUsEditor from "./content/AboutUsEditor";
import NewsEditor from "./content/NewsEditor";
import AcademicEditor from "./content/AcademicEditor";
import CourseEditor from "./content/CourseEditor";

const ContentAdmin = () => {
  const [courses, setCourses] = React.useState<any[]>([]);
  const [content, setContent] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchCourses();
    fetchContent();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching courses:", error);
      return;
    }

    setCourses(data);
  };

  const fetchContent = async () => {
    const { data, error } = await supabase
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching content:", error);
      return;
    }

    setContent(data);
  };

  const updateContent = async (type: string, content: any) => {
    const { error } = await supabase.from("content").upsert({
      type,
      content,
      title:
        type === "about" ? "About Us" : type === "news" ? "News" : "Academic",
    });

    if (error) {
      console.error("Error updating content:", error);
      return;
    }

    fetchContent();
  };

  const addCourse = async (
    type: "btech" | "mtech" | "phd",
    name: string,
    description: string,
  ) => {
    const { error } = await supabase.from("courses").insert({
      type,
      name,
      description,
    });

    if (error) {
      console.error("Error adding course:", error);
      return;
    }

    fetchCourses();
  };

  const updateCourse = async (id: string, updates: any) => {
    const { error } = await supabase
      .from("courses")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating course:", error);
      return;
    }

    fetchCourses();
  };
  const adminEmail = localStorage.getItem("adminEmail");
  const adminRole = localStorage.getItem("adminRole");

  React.useEffect(() => {
    if (!adminEmail || !isAuthorized(adminEmail, "content")) {
      window.location.href = "/admin/login";
    }
  }, [adminEmail]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Content Management
          </h1>
          <Button
            onClick={() => (window.location.href = "/admin")}
            variant="outline"
          >
            Switch Role
          </Button>
        </div>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full mb-6">
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0">
            <AboutUsEditor />
          </TabsContent>

          <TabsContent value="news" className="mt-0">
            <NewsEditor />
          </TabsContent>

          <TabsContent value="academic" className="mt-0">
            <AcademicEditor />
          </TabsContent>

          <TabsContent value="courses" className="mt-0">
            <CourseEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentAdmin;
