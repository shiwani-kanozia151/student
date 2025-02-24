import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AcademicSection {
  id: string;
  title: string;
  content: string;
}

const AcademicEditor = () => {
  const [sections, setSections] = React.useState<AcademicSection[]>([
    {
      id: "1",
      title: "Academic Calendar",
      content: "The academic year is divided into two semesters...",
    },
    {
      id: "2",
      title: "Examination System",
      content: "The institute follows a continuous evaluation system...",
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

  const handleSave = () => {
    // Save changes to backend
    console.log("Saving academic sections:", sections);
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
