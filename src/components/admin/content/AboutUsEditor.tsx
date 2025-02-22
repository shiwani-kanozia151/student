import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const AboutUsEditor = () => {
  const [vision, setVision] = React.useState(
    "To be a university globally trusted for technical excellence where learning and research integrate to sustain society and industry.",
  );
  const [mission, setMission] = React.useState([
    "To offer undergraduate, postgraduate, doctoral and modular programmes in multi-disciplinary / inter-disciplinary and emerging areas.",
    "To create a converging learning environment to serve a dynamically evolving society.",
    "To promote innovation for sustainable solutions by forging global collaborations with academia and industry in cutting-edge research.",
    "To be an intellectual ecosystem where human capabilities can develop holistically.",
  ]);

  const handleSave = () => {
    // Save changes to backend
    console.log("Saving changes:", { vision, mission });
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
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

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default AboutUsEditor;
