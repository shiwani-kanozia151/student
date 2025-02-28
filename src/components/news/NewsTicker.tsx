import React from "react";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";

interface NewsTickerProps {
  announcements?: string[];
}

const NewsTicker = ({
  announcements: defaultAnnouncements = [
    "NIRF Ranking 2024 - First among NITs, Ninth in Engineering....",
    "RECAL Scholarship 2024 Application Form, last date extended till January 21, 2025....",
    "Congratulations to our B.Tech Students for receiving prestigious awards....",
  ],
}: NewsTickerProps) => {
  const [announcements, setAnnouncements] =
    React.useState(defaultAnnouncements);

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("type", "news")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const newsItems = data.map((item) => {
            if (
              typeof item.content === "object" &&
              item.content.title &&
              item.content.content
            ) {
              return `${item.content.title} - ${item.content.content.substring(0, 100)}${item.content.content.length > 100 ? "..." : ""}`;
            }
            return item.title;
          });
          setAnnouncements(newsItems);
        }
      } catch (err) {
        console.error("Error fetching news:", err);
      }
    };

    fetchNews();

    // Set up real-time subscription for news updates
    const unsubscribe = subscribeToContentUpdates((payload) => {
      if (payload.new && payload.new.type === "news") {
        fetchNews(); // Refetch all news when there's an update
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
