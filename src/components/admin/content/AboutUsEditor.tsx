import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AboutUsEditorProps {
  initialContent?: {
    id?: string;
    content?: {
      vision?: string;
      mission?: string[];
      coreValues?: {
        title: string;
        description: string;
      }[];
      goals?: string[];
    };
  };
}

const AboutUsEditor = ({ initialContent }: AboutUsEditorProps) => {
  // Fetch the current content from the website to use as default values
  const [vision, setVision] = React.useState(
    initialContent?.content?.vision ||
      "To be a university globally trusted for technical excellence where learning and research integrate to sustain society and industry.",
  );

  const [mission, setMission] = React.useState(
    initialContent?.content?.mission || [
      "To offer undergraduate, postgraduate, doctoral and modular programmes in multi-disciplinary / inter-disciplinary and emerging areas.",
      "To create a converging learning environment to serve a dynamically evolving society.",
      "To promote innovation for sustainable solutions by forging global collaborations with academia and industry in cutting-edge research.",
      "To be an intellectual ecosystem where human capabilities can develop holistically.",
    ],
  );

  const [coreValues, setCoreValues] = React.useState(
    initialContent?.content?.coreValues || [
      {
        title: "Integrity",
        description:
          "Honest in intention, fair in evaluation, transparent in deeds and ethical in our personal and professional conduct that stands personal and public scrutiny.",
      },
      {
        title: "Excellence",
        description:
          "Commitment to continuous improvement coupled with a passion for innovation that drives the pursuit of the best practices; while achievement is always acknowledged, merit will always be recognized.",
      },
      {
        title: "Unity",
        description:
          "Building capacity through trust in others' abilities and cultivating respect as the cornerstone of collective effort.",
      },
      {
        title: "Inclusivity",
        description:
          "No one left behind; no one neglected; none forgotten in the mission of nation-building through higher learning.",
      },
    ],
  );

  const [goals, setGoals] = React.useState(
    initialContent?.content?.goals || [
      "Attracting top talent and global collaborations",
      "Building world-class research infrastructure to facilitate multi- / inter- / trans-disciplinary research",
      "Initiatives towards financial sustainability",
      "Social outreach activities of national / international importance",
      "Top 10 in India ranking in Engineering Discipline",
      "Top 500 in World Ranking in five years",
    ],
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const contentData = {
        type: "about",
        title: "About Us",
        content: {
          vision,
          mission,
          coreValues,
          goals,
        },
      };

      console.log("AboutUsEditor: Saving content data:", contentData);

      if (initialContent?.id) {
        // Update existing content
        console.log(
          "AboutUsEditor: Updating existing content with ID:",
          initialContent.id,
        );
        const { data: updateData, error: updateError } = await supabase
          .from("content")
          .update(contentData)
          .eq("id", initialContent.id)
          .select();

        if (updateError) throw updateError;
        console.log("AboutUsEditor: Update successful:", updateData);
      } else {
        // Create new content
        console.log("AboutUsEditor: Creating new content");
        const { data: insertData, error: insertError } = await supabase
          .from("content")
          .insert([contentData])
          .select();

        if (insertError) throw insertError;
        console.log("AboutUsEditor: Insert successful:", insertData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Force a refresh to show updated content
      alert("About Us content updated successfully!");
      // Force a reload to ensure content is updated
      window.location.reload();
    } catch (err) {
      console.error("Error saving content:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>Content updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Vision</h3>
        <Textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Mission</h3>
        {mission.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const newMission = [...mission];
                newMission[index] = e.target.value;
                setMission(newMission);
              }}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                const newMission = mission.filter((_, i) => i !== index);
                setMission(newMission);
              }}
            >
              ×
            </Button>
          </div>
        ))}
        <Button onClick={() => setMission([...mission, ""])} variant="outline">
          Add Mission Point
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Core Values</h3>
        {coreValues.map((value, index) => (
          <div key={index} className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <Input
                value={value.title}
                onChange={(e) => {
                  const newValues = [...coreValues];
                  newValues[index] = {
                    ...newValues[index],
                    title: e.target.value,
                  };
                  setCoreValues(newValues);
                }}
                placeholder="Value Title"
                className="mb-2"
              />
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  const newValues = coreValues.filter((_, i) => i !== index);
                  setCoreValues(newValues);
                }}
              >
                ×
              </Button>
            </div>
            <Textarea
              value={value.description}
              onChange={(e) => {
                const newValues = [...coreValues];
                newValues[index] = {
                  ...newValues[index],
                  description: e.target.value,
                };
                setCoreValues(newValues);
              }}
              placeholder="Value Description"
              className="min-h-[80px]"
            />
          </div>
        ))}
        <Button
          onClick={() =>
            setCoreValues([...coreValues, { title: "", description: "" }])
          }
          variant="outline"
        >
          Add Core Value
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Goals</h3>
        {goals.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const newGoals = [...goals];
                newGoals[index] = e.target.value;
                setGoals(newGoals);
              }}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                const newGoals = goals.filter((_, i) => i !== index);
                setGoals(newGoals);
              }}
            >
              ×
            </Button>
          </div>
        ))}
        <Button onClick={() => setGoals([...goals, ""])} variant="outline">
          Add Goal
        </Button>
      </div>

      <Button onClick={handleSave} className="w-full" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default AboutUsEditor;
