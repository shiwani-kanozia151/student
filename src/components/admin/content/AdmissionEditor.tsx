import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface AdmissionSection {
  id: string;
  title: string;
  content: string;
}

interface AdmissionLink {
  id: string;
  name: string;
  url: string;
}

const AdmissionEditor = () => {
  const [sections, setSections] = React.useState<AdmissionSection[]>([
    {
      id: "1",
      title: "Overview",
      content:
        "Admission to the various courses offered by this institution are specific to the programme and details can be found under each specific programme.",
    },
    {
      id: "2",
      title: "Contact Details",
      content:
        "Centralized Admission Cell\nNational Institute of Technology\nTiruchirappalli – 620 015\nTamil Nadu, India\n\nPhone: +91-431-2503931 (B. Tech. / B. Arch.) ; +91-431-2504940 (M. Tech. / M. Arch. / M. Sc. / MCA / MBA / MA) (During the admission schedule only)\nE-Mail: ug@nitt.edu (B. Tech. / B. Arch.) ; pg@nitt.edu (M. Tech. / M. Arch. / M. Sc. / MCA / MBA / MA) ;\nmsadmission@nitt.edu (MS) ; phdadmission@nitt.edu (Ph.D.)",
    },
  ]);

  const [links, setLinks] = React.useState<AdmissionLink[]>([
    {
      id: "1",
      name: "Joint Seat Allocation Authority (JoSAA)",
      url: "https://josaa.nic.in/",
    },
    {
      id: "2",
      name: "Central Seat Allocation Board (CSAB)",
      url: "https://csab.nic.in/",
    },
    {
      id: "3",
      name: "Direct Admission of Students Abroad (DASA)",
      url: "https://dasanit.org/dasa2024/",
    },
    {
      id: "4",
      name: "Indian Council for Cultural Relations (ICCR)",
      url: "https://www.iccr.gov.in",
    },
    {
      id: "5",
      name: "Study in India (SII)",
      url: "https://www.studyinindia.gov.in/",
    },
  ]);

  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");
  const [newLinkName, setNewLinkName] = React.useState("");
  const [newLinkUrl, setNewLinkUrl] = React.useState("");

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

  const handleAddLink = () => {
    if (!newLinkName || !newLinkUrl) return;

    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        name: newLinkName,
        url: newLinkUrl,
      },
    ]);

    setNewLinkName("");
    setNewLinkUrl("");
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const handleSave = async () => {
    try {
      // Save changes to backend
      const { error } = await supabase.from("content").upsert([
        {
          type: "admission",
          title: "Admission Content",
          content: {
            sections,
            links,
          },
        },
      ]);

      if (error) throw error;

      // Force a refresh to show updated content
      alert("Admission content updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error saving admission content:", err);
      alert(`Error saving content: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add Admission Section</h3>
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
        <h3 className="text-xl font-semibold">Current Admission Sections</h3>
        {sections.map((section) => (
          <div key={section.id} className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <h4 className="font-semibold">{section.title}</h4>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteSection(section.id)}
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

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add Admission Link</h3>
        <Input
          placeholder="Link Name"
          value={newLinkName}
          onChange={(e) => setNewLinkName(e.target.value)}
        />
        <Input
          placeholder="Link URL"
          value={newLinkUrl}
          onChange={(e) => setNewLinkUrl(e.target.value)}
        />
        <Button onClick={handleAddLink}>Add Link</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Current Admission Links</h3>
        {links.map((link) => (
          <div key={link.id} className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{link.name}</h4>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {link.url}
                </a>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteLink(link.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default AdmissionEditor;
