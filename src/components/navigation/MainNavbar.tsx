import React from "react";
import { cn } from "@/lib/utils";

interface MainNavbarProps {
  onLoginClick?: () => void;
}

const MainNavbar = ({ onLoginClick = () => {} }: MainNavbarProps) => {
  const menuItems = [
    { title: "About Us", href: "/about" },
    { title: "Administration", href: "/administration" },
    { title: "Academic", href: "/academic" },
    { title: "Admission", href: "/admission" },
    { title: "Courses", href: "/courses" },
    { title: "Research & Consultancy", href: "/research" },
    { title: "Student Login", href: "#", onClick: onLoginClick },
  ];

  return (
    <nav className="w-full bg-[#002147] text-white border-t border-blue-400">
      <div className="container mx-auto px-4">
        <ul className="flex items-center justify-start space-x-8">
          {menuItems.map((item) => (
            <li key={item.title}>
              <a
                href={item.href}
                onClick={item.onClick || undefined}
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
