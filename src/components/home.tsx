import React from "react";
import { useNavigate } from "react-router-dom";
import MainNavbar from "./navigation/MainNavbar";
import InstitutionalHeader from "./header/InstitutionalHeader";
import NewsTicker from "./news/NewsTicker";
import StudentLoginModal from "./auth/StudentLoginModal";
import StudentLoginSelector from "./auth/StudentLoginSelector";
import StudentAuth from "./auth/StudentAuth";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";

interface ContentData {
  vision?: string;
  mission?: string[];
}

const Home = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [showAuthFlow, setShowAuthFlow] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);
  const [contentData, setContentData] = React.useState<ContentData>({
    vision:
      "To be a university globally trusted for technical excellence where learning and research integrate to sustain society and industry.",
    mission: [
      "To offer undergraduate, postgraduate, doctoral and modular programmes in multi-disciplinary / inter-disciplinary and emerging areas.",
      "To create a converging learning environment to serve a dynamically evolving society.",
      "To promote innovation for sustainable solutions by forging global collaborations with academia and industry in cutting-edge research.",
      "To be an intellectual ecosystem where human capabilities can develop holistically.",
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
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <StudentLoginSelector
        isOpen={isLoginOpen && !showAuthFlow}
        onClose={() => setIsLoginOpen(false)}
        onNewStudent={() => {
          setIsNewUser(true);
          setShowAuthFlow(true);
        }}
        onExistingStudent={() => {
          setIsNewUser(false);
          setShowAuthFlow(true);
        }}
      />
      {isNewUser ? (
        <StudentAuth
          isOpen={showAuthFlow}
          onClose={() => {
            setShowAuthFlow(false);
            setIsLoginOpen(false);
          }}
          onAuthenticated={(data) => {
            console.log("Registration completed:", data);
            setShowAuthFlow(false);
            setIsLoginOpen(false);
            navigate("/student/courses");
          }}
        />
      ) : (
        <StudentLoginModal
          isOpen={showAuthFlow}
          onClose={() => {
            setShowAuthFlow(false);
            setIsLoginOpen(false);
          }}
          onLogin={(data) => {
            console.log("Login completed:", data);
            setShowAuthFlow(false);
            setIsLoginOpen(false);
            navigate("/student/courses");
          }}
        />
      )}
      <InstitutionalHeader
        institutionName={{
          english: "National Institute of Technology Tiruchirappalli",
          hindi: "राष्ट्रीय प्रौद्योगिकी संस्थान तिरुचिरापल्ली",
          tamil: "தேசிய தொழில்நுட்பக் கழகம் திருச்சிராப்பள்ளி",
        }}
        logoUrl="/nit-trichy-logo.png"
      />
      <MainNavbar onLoginClick={() => setIsLoginOpen(true)} />
      <NewsTicker />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-4">Vision</h2>
            <p className="text-gray-700">{contentData.vision}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-4">Mission</h2>
            <ul className="space-y-4 text-gray-700">
              {contentData.mission?.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
