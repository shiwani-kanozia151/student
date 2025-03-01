import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NavItem {
  id: string;
  title: string;
  href: string;
  onClick?: boolean;
}

interface NavbarEditorProps {
  initialNavItems?: NavItem[];
}

const NavbarEditor = ({ initialNavItems }: NavbarEditorProps) => {
  const [navItems, setNavItems] = React.useState<NavItem[]>(
    initialNavItems || [
      { id: "1", title: "About Us", href: "/about" },
      { id: "2", title: "Administration", href: "/administration" },
      { id: "3", title: "Academic", href: "/academic" },
      { id: "4", title: "Admission", href: "/admission" },
      { id: "5", title: "Courses", href: "/courses" },
      { id: "6", title: "Student Login", href: "#", onClick: true },
    ],
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleAddNavItem = () => {
    setNavItems([
      ...navItems,
      { id: Date.now().toString(), title: "", href: "" },
    ]);
  };

  const handleRemoveNavItem = (id: string) => {
    setNavItems(navItems.filter((item) => item.id !== id));
  };

  const handleNavItemChange = (
    id: string,
    field: keyof NavItem,
    value: string | boolean,
  ) => {
    setNavItems(
      navItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Filter out items with empty titles
      const validNavItems = navItems.filter((item) => item.title.trim() !== "");

      const { error: saveError } = await supabase.from("content").upsert([
        {
          type: "navbar",
          title: "Main Navigation",
          content: validNavItems,
        },
      ]);

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Force a refresh of the page to show updated content
      window.location.reload();
    } catch (err) {
      console.error("Error saving navbar items:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold">Navigation Menu Items</h3>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>Navigation updated successfully!</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {navItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              placeholder="Menu Title"
              value={item.title}
              onChange={(e) =>
                handleNavItemChange(item.id, "title", e.target.value)
              }
              className="flex-1"
            />
            <Input
              placeholder="URL Path"
              value={item.href}
              onChange={(e) =>
                handleNavItemChange(item.id, "href", e.target.value)
              }
              className="flex-1"
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleRemoveNavItem(item.id)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleAddNavItem} variant="outline">
          Add Menu Item
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default NavbarEditor;
