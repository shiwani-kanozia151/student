import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

interface AcademicSection {
  id: string;
  title: string;
  content: string;
}

const AcademicEditor = () => {
  const [sections, setSections] = React.useState<AcademicSection[]>([
    {
      id: "1",
      title: "Academic System",
      content:
        "The academic system at the National Institute of Technology (NIT) in Tiruchirappalli is renowned for its rigorous standards and commitment to excellence in education. As one of the premier engineering institutions in India, NIT, Tiruchirappalli offers a comprehensive range of undergraduate, postgraduate, and doctoral programs across various disciplines, including engineering, science, management, and architecture. The academic curriculum is designed to impart both theoretical knowledge and practical skills, ensuring that students are well-equipped to meet the demands of the rapidly evolving technological landscape.",
    },
    {
      id: "2",
      title: "Holistic Approach",
      content:
        "NIT, Tiruchirappalli's academic system emphasizes a holistic approach to education, with a strong emphasis on research, innovation, and industry collaboration. The institute boasts state-of-the-art laboratories, research facilities, and centers of excellence, providing students with ample opportunities to engage in cutting-edge research and project work. Additionally, the faculty members at NIT, Tiruchirappalli are renowned experts in their respective fields, dedicated to nurturing students' intellectual curiosity and fostering a spirit of inquiry and innovation.",
    },
    {
      id: "3",
      title: "Contact Details",
      content:
        "Dean (Academic)\nNational Institute of Technology\nTiruchirappalli - 620 015\nTamil Nadu, India\n\nTelephone: +91 (431) 2503014 (Office), 2503013 (Direct)\nFax: +91 (431) 2500133 (O/o the Director)\nE-mail: deanap@nitt.edu",
    },
  ]);

  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");

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
      // Save changes to backend
      const { error } = await supabase.from("content").upsert([
        {
          type: "academic",
          title: "Academic Content",
          content: sections,
        },
      ]);

      if (error) throw error;

      // Force a refresh to show updated content
      alert("Academic content updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error saving academic content:", err);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add Academic Section</h3>
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
        <h3 className="text-xl font-semibold">Current Academic Sections</h3>
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

export default AcademicEditor;
