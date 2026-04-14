import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="glass dark:glass-dark sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-primary md:hidden mr-4 p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden md:flex items-center text-xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
          Agriculture Tools
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search tools..."
            className="w-full sm:w-64 bg-card-muted rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all border border-card-border"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <button className="relative p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-2">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-gray-900"></span>
        </button>

        <div className="flex items-center">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
