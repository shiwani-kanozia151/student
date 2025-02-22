import React from "react";
import { Button } from "@/components/ui/button";
import { isAuthorized } from "@/lib/adminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AboutUsEditor from "./content/AboutUsEditor";

const ContentAdmin = () => {
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
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                News & Announcements
              </h2>
              {/* News Editor Component */}
            </div>
          </TabsContent>

          <TabsContent value="academic" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Academic Content</h2>
              {/* Academic Content Editor */}
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-0">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Course Management</h2>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">B.Tech Programs</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                      <span>Computer Science and Engineering</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Electronics and Communication Engineering</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Mechanical Engineering</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                  </ul>
                  <Button className="mt-4" variant="outline">
                    Add B.Tech Program
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">M.Tech Programs</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                      <span>Data Science and AI</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Communication Systems</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                  </ul>
                  <Button className="mt-4" variant="outline">
                    Add M.Tech Program
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Ph.D Programs</h3>
                  <ul className="space-y-4">
                    <li className="flex items-center justify-between">
                      <span>Computer Science</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Electronics</span>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </li>
                  </ul>
                  <Button className="mt-4" variant="outline">
                    Add Ph.D Program
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContentAdmin;
