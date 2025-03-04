import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

const NewsEditor = () => {
  const [newsItems, setNewsItems] = React.useState<NewsItem[]>([]);

  // Fetch existing news items on component mount
  React.useEffect(() => {
    const fetchNewsItems = async () => {
      try {
        const { data, error } = await supabase
          .from("content")
          .select("*")
          .eq("type", "news")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0 && Array.isArray(data[0].content)) {
          setNewsItems(data[0].content);
        } else {
          // Default news items if none found
          setNewsItems([
            {
              id: "1",
              title: "NIRF Ranking 2024",
              content: "First among NITs, Ninth in Engineering....",
              date: new Date().toISOString(),
            },
            {
              id: "2",
              title: "RECAL Scholarship 2024",
              content:
                "Application Form, last date extended till January 21, 2025....",
              date: new Date().toISOString(),
            },
            {
              id: "3",
              title: "Congratulations to our B.Tech Students",
              content: "For receiving prestigious awards....",
              date: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching news items:", err);
      }
    };

    fetchNewsItems();
  }, []);

  const [newTitle, setNewTitle] = React.useState("");
  const [newContent, setNewContent] = React.useState("");

  const handleAddNews = () => {
    if (!newTitle || !newContent) return;

    setNewsItems([
      ...newsItems,
      {
        id: Date.now().toString(),
        title: newTitle,
        content: newContent,
        date: new Date().toISOString(),
      },
    ]);

    setNewTitle("");
    setNewContent("");
  };

  const handleDelete = (id: string) => {
    setNewsItems(newsItems.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    try {
      console.log("NewsEditor: Saving news items:", newsItems);

      // First, delete existing news content
      const { data: existingNews, error: fetchError } = await supabase
        .from("content")
        .select("id")
        .eq("type", "news");

      if (fetchError) throw fetchError;

      // Delete existing news items
      for (const news of existingNews || []) {
        const { error: deleteError } = await supabase
          .from("content")
          .delete()
          .eq("id", news.id);

        if (deleteError) throw deleteError;
      }

      // Wait a moment to ensure deletions are processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create new news content
      const { error } = await supabase.from("content").insert([
        {
          type: "news",
          title: "News Updates",
          content: newsItems,
        },
      ]);

      if (error) throw error;

      // Force a refresh to show updated content
      alert("News updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Error saving news:", err);
      alert(`Error saving news: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Add News Item</h3>
        <Input
          placeholder="News Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <Textarea
          placeholder="News Content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[100px]"
        />
        <Button onClick={handleAddNews}>Add News</Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Current News Items</h3>
        {newsItems.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{item.title}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(item.date).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </Button>
            </div>
            <p className="text-gray-700">{item.content}</p>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full">
        Save Changes
      </Button>
    </div>
  );
};

export default NewsEditor;
