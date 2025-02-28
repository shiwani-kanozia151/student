import React from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";

interface ContentData {
  vision?: string;
  mission?: string[];
  coreValues?: {
    title: string;
    description: string;
  }[];
  goals?: string[];
}

const AboutUs = () => {
  const [contentData, setContentData] = React.useState<ContentData>({
    vision:
      "To be a university globally trusted for technical excellence where learning and research integrate to sustain society and industry.",
    mission: [
      "To offer undergraduate, postgraduate, doctoral and modular programmes in multi-disciplinary / inter-disciplinary and emerging areas.",
      "To create a converging learning environment to serve a dynamically evolving society.",
      "To promote innovation for sustainable solutions by forging global collaborations with academia and industry in cutting-edge research.",
      "To be an intellectual ecosystem where human capabilities can develop holistically.",
    ],
    coreValues: [
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
    goals: [
      "Attracting top talent and global collaborations",
      "Building world-class research infrastructure to facilitate multi- / inter- / trans-disciplinary research",
      "Initiatives towards financial sustainability",
      "Social outreach activities of national / international importance",
      "Top 10 in India ranking in Engineering Discipline",
      "Top 500 in World Ranking in five years",
    ],
  });

  // Fetch content data on component mount
  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("type", "about");

        if (error) throw error;

        if (data && data.length > 0) {
          const aboutContent = data[0].content;
          setContentData({
            vision: aboutContent.vision || contentData.vision,
            mission: aboutContent.mission || contentData.mission,
            coreValues: aboutContent.coreValues || contentData.coreValues,
            goals: aboutContent.goals || contentData.goals,
          });
        }
      } catch (err) {
        console.error("Error fetching content:", err);
      }
    };

    fetchContent();

    // Set up real-time subscription for content updates
    const unsubscribe = subscribeToContentUpdates((payload) => {
      if (payload.new && payload.new.type === "about") {
        const newContent = payload.new.content;
        setContentData({
          vision: newContent.vision || contentData.vision,
          mission: newContent.mission || contentData.mission,
          coreValues: newContent.coreValues || contentData.coreValues,
          goals: newContent.goals || contentData.goals,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#002147] mb-8">
          About NIT Tiruchirappalli
        </h1>

        <div className="mb-12">
          <p className="text-gray-700 mb-6">
            NIT Tiruchirappalli, through its Vision, Mission and Core Values,
            defines herself as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>An Indian institution with world standards</li>
            <li>
              A global pool of talented students, committed faculty and
              conscientious researchers
            </li>
            <li>
              Responsive to real-world problems and, through a synergy of
              education and research, engineer a better society
            </li>
          </ul>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">VISION</h2>
          <p className="text-gray-700">{contentData.vision}</p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">MISSION</h2>
          <ul className="space-y-4 text-gray-700">
            {contentData.mission?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">
            Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentData.coreValues?.map((value, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-[#002147] mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-700">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#002147] mb-4">Goals</h2>
          <p className="text-gray-700 mb-4">
            International Accreditation and Ranking in tertiary education
            largely guide goal-setting. The perception built by the
            stakeholders, crucially influence the process of repositioning.
            Benchmarking with global universities who are in the top 200 in
            world rankings in terms of teaching, innovation and research,
            funding and internationalisation. Hence, the need to set the
            following goals:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            {contentData.goals?.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
