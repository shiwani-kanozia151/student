import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// The administration content is stored with type "academic" due to database constraints
const ADMIN_CONTENT_TYPE = "academic";
const ADMIN_CONTENT_TITLE = "Administration Content";

interface AdministrationSection {
  id: string;
  title: string;
  content: string;
}

const Administration = () => {
  const [sections, setSections] = useState<AdministrationSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminContent() {
      try {
        setLoading(true);
        // Look for content with type "academic" and title "Administration Content"
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("type", ADMIN_CONTENT_TYPE)
          .eq("title", ADMIN_CONTENT_TITLE)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error loading administration content:", error);
          return;
        }
        
        if (data && data.content) {
          console.log("Loaded administration content for public page:", data);
          // Use the saved content if available
          setSections(data.content);
        }
      } catch (err) {
        console.error("Failed to load administration content:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadAdminContent();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A2240]"></div>
      </div>
    );
  }

  // Fall back to default content if no sections are loaded
  if (sections.length === 0) {
    // Default content
    return (
      <div className="min-h-screen bg-white">
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-[#002147] mb-8">
            Administration
          </h1>

          <div className="mb-12">
            <p className="text-gray-700 mb-6">
              The NITs were carved out of 17 Regional Engineering Colleges across
              India and are now the fully funded institutions under the Central
              Government and declared as an Institute of National importance under
              the NATIONAL INSTITUTES OF TECHNOLOGY ACT, 2007. The move was
              intended to make the institutions centers of excellence and being
              developed as autonomous and flexible academic institutions of
              excellence to meet the sweeping changes taking place in the
              industrial environment in post liberalized India and also the
              rapidly changing scene of technical education globally. NIT
              Tiruchirappalli is one among the 31 NITs and its basic structure of
              organisation, functions and powers of the Institute are briefed in
              the NIT Acts & Statutes. A large number of rules, regulations,
              ordinances, policy decisions etc. have been formulated by the Board
              of Governors, Senate and other authorities of the Institute for
              regulating the day-to-day work of the expanded activities of the
              Institute.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-4">
              Procedure followed in Decision Making Process
            </h2>
            <p className="text-gray-700">
              The Institute has a Director, Six Deans, Registrar and Heads of the
              Departments/section, who carry out the various functions of the
              Institute as per procedures laid down in the Statues of the
              Institute. The decision is communicated to public by notices,
              announcements, website and advertisements. The final authority to
              vet the final decision is the Director / Board of Governors /
              Council for NITs/ Visitor of the Institute. The Institute takes
              decision regarding students' affairs, faculty & staff affairs,
              facilities of the Institute and its infrastructure.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-4">
              Mode of Public Participation
            </h2>
            <p className="text-gray-700">
              The Institute encourages public participation and guidance through
              members representing them in the NIT Council and the Board
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Display dynamic content from database
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">
          Administration
        </h1>

        {sections.map((section) => (
          <div key={section.id} className="mb-12">
            <h2 className="text-2xl font-bold text-[#002147] mb-4">
              {section.title}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        ))}
      </main>
    </div>
  );
};

export default Administration;
