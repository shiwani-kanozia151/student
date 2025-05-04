import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AboutUsEditor from "./content/AboutUsEditor";
import NewsEditor from "./content/NewsEditor";
import AcademicEditor from "./content/AcademicEditor";
import AdministrationEditor from "./content/AdministrationEditor";
import CourseEditor from "./content/CourseEditor";
import NavbarEditor from "./content/NavbarEditor";
import CourseEditorManager from "./content/CourseEditorManager";
import { supabase } from "@/lib/supabase";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 p-4">Error loading component</div>;
    }
    return this.props.children;
  }
}

interface NewsEditorProps {
  initialNews: any[];
}

interface AcademicEditorProps {
  initialContent: any[];
}

interface AboutUsEditorProps {
  initialContent: any;
}

interface NavbarEditorProps {
  initialNavItems: any;
}

const TypedNewsEditor = NewsEditor as React.ComponentType<NewsEditorProps>;
const TypedAcademicEditor = AcademicEditor as React.ComponentType<AcademicEditorProps>;
const TypedAboutUsEditor = AboutUsEditor as React.ComponentType<AboutUsEditorProps>;
const TypedNavbarEditor = NavbarEditor as React.ComponentType<NavbarEditorProps>;

const ContentAdmin = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    courses: any[];
    content: any[];
  }>({ courses: [], content: [] });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      if (contentError) throw contentError;

      setData({
        courses: coursesData || [],
        content: contentData || [],
      });
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setData({ courses: [], content: [] });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
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
          <h1 className="text-2xl font-bold text-[#0A2240]">Content Management</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-7 w-full mb-6">
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="administration">Administration</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="course-editors">Course Editors</TabsTrigger>
            <TabsTrigger value="navbar">Navigation</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-0">
            <TypedAboutUsEditor
              initialContent={data.content.find((c) => c.type === "about")}
            />
          </TabsContent>

          <TabsContent value="news" className="mt-0">
            <TypedNewsEditor
              initialNews={data.content.filter((c) => c.type === "news")}
            />
          </TabsContent>

          <TabsContent value="academic" className="mt-0">
            <TypedAcademicEditor
              initialContent={data.content.filter((c) => c.type === "academic")}
            />
          </TabsContent>

          <TabsContent value="administration" className="mt-0">
            <AdministrationEditor />
          </TabsContent>

          <TabsContent value="courses" className="mt-0">
            <ErrorBoundary>
              {data.courses?.length > 0 ? (
                <CourseEditor initialCourses={data.courses} />
              ) : (
                <div className="text-gray-500 p-4">No courses available</div>
              )}
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="course-editors" className="mt-0">
            <CourseEditorManager />
          </TabsContent>

          <TabsContent value="navbar" className="mt-0">
            <TypedNavbarEditor
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