import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface AdministrationSection {
  id: string;
  title: string;
  content: string;
}

// The administration content is stored with type "academic" due to database constraints
const ADMIN_CONTENT_TYPE = "academic";
const ADMIN_CONTENT_TITLE = "Administration Content";

const AdministrationEditor = () => {
  const [sections, setSections] = React.useState<AdministrationSection[]>([
    {
      id: "1",
      title: "Overview",
      content:
        "The NITs were carved out of 17 Regional Engineering Colleges across India and are now the fully funded institutions under the Central Government and declared as an Institute of National importance under the NATIONAL INSTITUTES OF TECHNOLOGY ACT, 2007. The move was intended to make the institutions centers of excellence and being developed as autonomous and flexible academic institutions of excellence to meet the sweeping changes taking place in the industrial environment in post liberalized India and also the rapidly changing scene of technical education globally. NIT Tiruchirappalli is one among the 31 NITs and its basic structure of organisation, functions and powers of the Institute are briefed in the NIT Acts & Statutes. A large number of rules, regulations, ordinances, policy decisions etc. have been formulated by the Board of Governors, Senate and other authorities of the Institute for regulating the day-to-day work of the expanded activities of the Institute.",
    },
    {
      id: "2",
      title: "Procedure followed in Decision Making Process",
      content:
        "The Institute has a Director, Six Deans, Registrar and Heads of the Departments/section, who carry out the various functions of the Institute as per procedures laid down in the Statues of the Institute. The decision is communicated to public by notices, announcements, website and advertisements. The final authority to vet the final decision is the Director / Board of Governors / Council for NITs/ Visitor of the Institute. The Institute takes decision regarding students' affairs, faculty & staff affairs, facilities of the Institute and its infrastructure.",
    },
    {
      id: "3",
      title: "Mode of Public Participation",
      content:
        "The Institute encourages public participation and guidance through members representing them in the NIT Council and the Board",
    },
  ]);
  
  const [loading, setLoading] = React.useState(true);
  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");

  // Load administration content on initial render
  useEffect(() => {
    async function loadAdminContent() {
      try {
        setLoading(true);
        // First look for content with title "Administration Content"
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("type", ADMIN_CONTENT_TYPE)
          .eq("title", ADMIN_CONTENT_TITLE)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // If error is not "no rows returned", then it's a real error
          console.error("Error loading administration content:", error);
          return;
        }
        
        if (data && data.content) {
          console.log("Loaded administration content:", data);
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

  const handleAddSection = () => {
    if (!newTitle || !newContent) return;

    setSections([
      ...sections,
      {
        id: Date.now().toString(),
        title: newTitle,
        content: newContent,
      },
    ]);

    setNewTitle("");
    setNewContent("");
  };

  const handleDelete = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const handleSave = async () => {
    try {
      // The database constraint only allows: 'about', 'news', 'academic'
      const { error } = await supabase.from("content").upsert([
        {
          type: ADMIN_CONTENT_TYPE, // Using an allowed type from the constraint
          title: ADMIN_CONTENT_TITLE,
          content: sections,
        },
      ]);

      if (error) {
        throw error;
      }

      // Force a refresh to show updated content
      alert("Administration content updated successfully!");
      // Don't reload the page, it will cause the data to be lost
      // window.location.reload();
    } catch (err) {
      console.error("Error saving administration content:", err);
      alert(`Error saving content: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Loading administration content...</div>;
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add Administration Section</h3>
        <Input
          placeholder="Section Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Textarea
          placeholder="Section Content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[100px]"
        />
        <Button onClick={handleAddSection}>Add Section</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          Current Administration Sections
        </h3>
        {sections.map((section) => (
          <div key={section.id} className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold">{section.title}</h4>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(section.id)}
              >
                Delete
              </Button>
            </div>
            <Textarea
              value={section.content}
              onChange={(e) => {
                setSections(
                  sections.map((s) =>
                    s.id === section.id ? { ...s, content: e.target.value } : s,
                  ),
                );
              }}
              className="min-h-[100px]"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default AdministrationEditor;
