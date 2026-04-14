"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, Tractor, User, Wrench } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Tools", href: "/dashboard?tab=my-tools", icon: Tractor },
    { name: "Activity", href: "/dashboard?tab=activity", icon: Wrench },
    { name: "Profile", href: "/profile", icon: User },
    // Removed Admin panel per user request
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card-bg border-r border-card-border flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-card-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Tractor className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent">
              ToolVerse
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname === "/dashboard" && item.href.includes("?tab") && false); // Simplified active state for tabs would rely on searchParams but pathname is fine for base.
            // A more robust check for base paths
            const isStrictlyActive = pathname === item.href.split('?')[0];

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  isStrictlyActive
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-card-muted hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isStrictlyActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-card-border">
          <SignOutButton signOutOptions={{ redirectUrl: '/' }}>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  );
}
