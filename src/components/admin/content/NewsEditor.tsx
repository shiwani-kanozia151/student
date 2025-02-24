import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
}

const NewsEditor = () => {
  const [newsItems, setNewsItems] = React.useState<NewsItem[]>([
    {
      id: "1",
      title: "NIRF Ranking 2024",
      content: "First among NITs, Ninth in Engineering....",
      date: new Date().toISOString(),
    },
  ]);

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

  const handleSave = () => {
    // Save changes to backend
    console.log("Saving news:", newsItems);
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
