import React from "react";

interface NewsTickerProps {
  announcements?: string[];
}

const NewsTicker = ({
  announcements = [
    "NIRF Ranking 2024 - First among NITs, Ninth in Engineering....",
    "RECAL Scholarship 2024 Application Form, last date extended till January 21, 2025....",
    "Congratulations to our B.Tech Students for receiving prestigious awards....",
  ],
}: NewsTickerProps) => {
  return (
    <div className="w-full bg-gray-100 border-y border-gray-200">
      <div className="container mx-auto px-4 py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          {announcements.map((announcement, index) => (
            <span key={index} className="text-[#002147] mx-8">
              {announcement}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
