import React from "react";

interface InstitutionalHeaderProps {
  institutionName?: {
    english?: string;
    hindi?: string;
    tamil?: string;
  };
  logoUrl?: string;
}

const InstitutionalHeader = ({
  institutionName = {
    english: "NATIONAL INSTITUTE OF TECHNOLOGY",
    hindi: "राष्ट्रीय प्रौद्योगिकी संस्थान",
    tamil: "தேசிய தொழில்நுட்பக் கழகம்",
  },
  logoUrl = "/vite.svg",
}: InstitutionalHeaderProps) => {
  return (
    <div className="w-full bg-[#002147] text-white py-4">
      <div className="container mx-auto flex items-center justify-center gap-6 px-4">
        <div className="flex items-center gap-6">
          <img src={logoUrl} alt="NIT Trichy Logo" className="h-24 w-24" />
          <div className="flex gap-8 items-center">
            <div className="text-xl font-semibold">
              {institutionName.english}
            </div>
            <div className="text-xl font-semibold">{institutionName.hindi}</div>
            <div className="text-xl font-semibold">{institutionName.tamil}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalHeader;
