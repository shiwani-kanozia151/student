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

  const fetchNews = React.useCallback(async () => {
    try {
      console.log("NewsTicker: Fetching news data...");
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("type", "news")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("NewsTicker: News data received:", data);
      if (data && data.length > 0) {
        // Check if content is an array (for news items)
        if (Array.isArray(data[0].content)) {
          const newsItems = data[0].content.map((item: any) => {
            return `${item.title} - ${item.content.substring(0, 100)}${item.content.length > 100 ? "..." : ""}`;
          });
          console.log("NewsTicker: Processed news items:", newsItems);
          setAnnouncements(newsItems);
        } else {
          // Fallback for old format
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
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchNews();

    // Set up real-time subscription for news updates
    const unsubscribe = subscribeToContentUpdates((payload) => {
      console.log("NewsTicker: Subscription payload received:", payload);
      if (payload.new && payload.new.type === "news") {
        console.log("NewsTicker: News update detected, refreshing...");
        fetchNews(); // Refetch all news when there's an update
      }
    });

    // Set up a manual refresh interval as a fallback
    const intervalId = setInterval(() => {
      console.log("NewsTicker: Interval refresh of news");
      fetchNews();
    }, 10000); // Refresh every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchNews]);

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
