"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Clock, Search, ShieldAlert, Tractor, Users } from "lucide-react";
import ToolCard, { ToolProps } from "@/components/ui/ToolCard";

const MOCK_TOOLS: ToolProps[] = [
  {
    id: "1",
    name: "John Deere 5050 D Tractor",
    category: "Tractors",
    status: "available",
    location: "Farm A, North District",
    owner: "Ramesh Singh",
    rating: 4.8,
    pricePerDay: 1500,
    addedDate: "2025-01-15",
    condition: "Excellent",
    imageUrl: "https://images.unsplash.com/photo-1592982537447-6f23f6d7eb59?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "2",
    name: "Heavy Duty Rotavator",
    category: "Implements",
    status: "borrowed",
    location: "Farm B, East District",
    owner: "Amit Kumar",
    rating: 4.5,
    pricePerDay: 500,
    addedDate: "2025-02-20",
    condition: "Good",
    dueDate: "2026-04-15",
    borrower: "Carlos Rivera",
    imageUrl: "https://images.unsplash.com/photo-1586524245648-52c6f3795ab6?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "3",
    name: "Honda Water Pump 5HP",
    category: "Irrigation",
    status: "reserved",
    location: "Village Hub",
    owner: "Suresh Patel",
    rating: 4.9,
    pricePerDay: 300,
    addedDate: "2025-03-10",
    condition: "Fair",
    imageUrl: "https://images.unsplash.com/photo-1563820227187-25e4fba6ea81?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "4",
    name: "Automatic Seed Drill",
    category: "Seeding",
    status: "available",
    location: "Farm C, West District",
    owner: "Vikram Sharma",
    rating: 4.2,
    pricePerDay: 800,
    addedDate: "2025-03-15",
    condition: "Excellent",
    imageUrl: "https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?auto=format&fit=crop&q=80&w=600",
  },
];

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "tools";

  const tabs = [
    { id: "tools", label: "All Tools" },
    { id: "my-tools", label: "My Tools" },
    { id: "activity", label: "Activity" },
    { id: "maintenance", label: "Maintenance" },
    { id: "experts", label: "Experts" },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your tools, reservations, and activities.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tools", value: "142", icon: Tractor, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Borrowed", value: "24", icon: Clock, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
          { label: "Reservations", value: "18", icon: Users, color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
          { label: "Alerts", value: "3", icon: ShieldAlert, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {currentTab === "tools" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Available for Rent</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-sm font-medium hover:bg-card-muted transition-colors hidden sm:block">
                  Filter
                </button>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    className="pl-9 pr-4 py-2 border border-card-border rounded-lg text-sm bg-card-bg outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {MOCK_TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {currentTab === "my-tools" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <Tractor className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You haven't listed any tools</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">List your unused agricultural equipment and start earning by supporting your local farming community.</p>
            <button className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
              Add New Tool
            </button>
          </div>
        )}

        {["activity", "maintenance", "experts"].includes(currentTab) && (
          <div className="bg-card-muted border border-card-border rounded-2xl p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Coming Soon</h3>
            <p className="text-gray-500">The {tabs.find(t => t.id === currentTab)?.label} feature is currently under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}
