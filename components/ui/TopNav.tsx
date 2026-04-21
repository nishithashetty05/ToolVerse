"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard?tab=tools&search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/dashboard?tab=tools`);
    }
  };

  return (
    <header className="bg-transparent h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-primary md:hidden mr-4 p-2 -ml-2 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="hidden md:flex items-center text-xl font-serif font-bold text-primary">
          Agriculture Tools
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full sm:w-64 bg-card-muted rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all border border-card-border"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </form>

        <div className="flex items-center">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
