import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AboutUsEditor from "./content/AboutUsEditor";
import NewsEditor from "./content/NewsEditor";
import AcademicEditor from "./content/AcademicEditor";
import AdministrationEditor from "./content/AdministrationEditor";

import CourseEditor from "./content/CourseEditor";
import NavbarEditor from "./content/NavbarEditor";
import { supabase } from "@/lib/supabase";

const ContentAdmin = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    courses: any[];
    content: any[];
  }>({ courses: [], content: [] });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesResponse, contentResponse] = await Promise.all([
          supabase
            .from("courses")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("content")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        if (coursesResponse.error) throw coursesResponse.error;
        if (contentResponse.error) throw contentResponse.error;

        setData({
          courses: coursesResponse.data || [],
          content: contentResponse.data || [],
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#0A2240]">
            Content Management
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full mb-6">
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="administration">Administration</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="navbar">Navigation</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0">
            <AboutUsEditor
              initialContent={data.content.find((c) => c.type === "about")}
            />
          </TabsContent>

          <TabsContent value="news" className="mt-0">
            <NewsEditor
              initialNews={data.content.filter((c) => c.type === "news")}
            />
          </TabsContent>

          <TabsContent value="academic" className="mt-0">
            <AcademicEditor
              initialContent={data.content.filter((c) => c.type === "academic")}
            />
          </TabsContent>

          <TabsContent value="administration" className="mt-0">
            <AdministrationEditor />
          </TabsContent>

          <TabsContent value="courses" className="mt-0">
            <CourseEditor initialCourses={data.courses} />
          </TabsContent>

          <TabsContent value="navbar" className="mt-0">
            <NavbarEditor
              initialNavItems={
                data.content.find((c) => c.type === "navbar")?.content
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentAdmin;
