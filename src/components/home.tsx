import React from "react";
import MainNavbar from "./navigation/MainNavbar";
import InstitutionalHeader from "./header/InstitutionalHeader";
import NewsTicker from "./news/NewsTicker";
import StudentLoginModal from "./auth/StudentLoginModal";
import NewStudentRegistration from "./auth/NewStudentRegistration";
import StudentLoginSelector from "./auth/StudentLoginSelector";

const Home = () => {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);
  const [showAuthFlow, setShowAuthFlow] = React.useState(false);
  const [isNewUser, setIsNewUser] = React.useState(false);

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
        <NewStudentRegistration
          isOpen={showAuthFlow}
          onClose={() => {
            setShowAuthFlow(false);
            setIsLoginOpen(false);
          }}
          onRegister={(data) => {
            console.log("Registration completed:", data);
            setShowAuthFlow(false);
            setIsLoginOpen(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-4">Vision</h2>
            <p className="text-gray-700">
              To be a university globally trusted for technical excellence where
              learning and research integrate to sustain society and industry.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#002147] mb-4">Mission</h2>
            <ul className="space-y-4 text-gray-700">
              <li>
                To offer undergraduate, postgraduate, doctoral and modular
                programmes in multi-disciplinary / inter-disciplinary and
                emerging areas.
              </li>
              <li>
                To create a converging learning environment to serve a
                dynamically evolving society.
              </li>
              <li>
                To promote innovation for sustainable solutions by forging
                global collaborations with academia and industry in cutting-edge
                research.
              </li>
              <li>
                To be an intellectual ecosystem where human capabilities can
                develop holistically.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
