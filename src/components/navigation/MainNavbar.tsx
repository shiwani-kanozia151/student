import React from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { subscribeToContentUpdates } from "@/lib/realtime";

interface MainNavbarProps {
  onLoginClick?: () => void;
}

const MainNavbar = ({ onLoginClick = () => {} }: MainNavbarProps) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = React.useState([
    { title: "About Us", href: "/about" },
    { title: "Administration", href: "/administration" },
    { title: "Academic", href: "/academic" },
    { title: "Admission", href: "/admission" },
    { title: "Courses", href: "/courses" },
    { title: "Student Login", href: "#", onClick: onLoginClick },
  ]);

  const fetchNavItems = React.useCallback(async () => {
    try {
      console.log("Fetching navbar items...");
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("type", "navbar");

      if (error) throw error;

      if (data && data.length > 0) {
        console.log("Navbar data received:", data[0].content);
        const navItems = data[0].content;

        // Always ensure the Student Login item is present
        const loginItem = navItems.find(
          (item) => item.title === "Student Login",
        ) || { title: "Student Login", href: "#", onClick: true };

        // Make sure Courses item is present
        const coursesItem = navItems.find(
          (item) => item.title === "Courses",
        ) || { title: "Courses", href: "/courses" };

        // Map the items and handle the onClick special case
        const mappedItems = navItems.map((item) => {
          if (item.title === "Student Login" || item.onClick) {
            return { ...item, onClick: onLoginClick };
          }
          return item;
        });

        // If login item doesn't exist in the fetched data, add it
        if (!navItems.find((item) => item.title === "Student Login")) {
          mappedItems.push({
            title: "Student Login",
            href: "#",
            onClick: onLoginClick,
          });
        }

        // If courses item doesn't exist in the fetched data, add it
        if (!navItems.find((item) => item.title === "Courses")) {
          mappedItems.push({
            title: "Courses",
            href: "/courses",
          });
        }

        console.log("Setting menu items to:", mappedItems);
        setMenuItems(mappedItems);
      }
    } catch (err) {
      console.error("Error fetching navigation items:", err);
    }
  }, [onLoginClick]);

  React.useEffect(() => {
    fetchNavItems();

    // Set up real-time subscription for navbar updates
    const unsubscribe = subscribeToContentUpdates((payload) => {
      console.log("Navbar subscription payload:", payload);
      if (payload.new && payload.new.type === "navbar") {
        console.log("Navbar update detected, refreshing...");
        fetchNavItems(); // Refetch when there's an update
      }
    });

    // Set up a manual refresh interval as a fallback
    const intervalId = setInterval(() => {
      console.log("Interval refresh of navbar");
      fetchNavItems();
    }, 10000); // Refresh every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchNavItems]);

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { href: string; onClick?: () => void },
  ) => {
    e.preventDefault();
    if (item.onClick) {
      item.onClick();
    } else if (item.href.startsWith("/")) {
      // Navigate to any path that starts with a slash
      navigate(item.href);
    } else {
      // For other links that aren't implemented yet
      console.log(`Navigating to ${item.href} - not implemented yet`);
    }
  };

  return (
    <nav className="w-full bg-[#002147] text-white border-t border-blue-400">
      <div className="container mx-auto px-4">
        <ul className="flex items-center justify-start space-x-8">
          {menuItems.map((item) => (
            <li key={item.title}>
              <a
                href={item.href}
                onClick={(e) => handleNavigation(e, item)}
                className={cn(
                  "block py-3 text-base hover:text-blue-200 transition-colors",
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default MainNavbar;
