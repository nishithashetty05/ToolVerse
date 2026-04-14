"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Clock, Plus, Search, ShieldAlert, Tractor, Users } from "lucide-react";
import ToolCard, { ToolProps } from "@/components/ui/ToolCard";

<<<<<<< HEAD
interface ApiTool {
  id: number;
  name: string;
  categoryName: string;
  status: "available" | "borrowed" | "reserved";
  location: string;
  ownerName: string;
  rating: number;
  pricePerDay: number;
  imageUrl: string | null;
}

interface StatsData {
  total: number;
  borrowed: number;
  reserved: number;
}

function toToolProps(t: ApiTool): ToolProps {
  return {
    id: String(t.id),
    name: t.name,
    category: t.categoryName,
    status: t.status === "reserved" ? "reserved" : t.status === "borrowed" ? "borrowed" : "available",
    location: t.location,
    owner: t.ownerName,
    rating: t.rating,
    pricePerDay: t.pricePerDay,
    imageUrl: t.imageUrl ?? "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
  };
}
=======
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
>>>>>>> 581fd655550528962547e1a05b6dc7ca8dd219b4

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "tools";

  // ── All Tools state ──
  const [tools, setTools]         = useState<ToolProps[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");

  // ── My Tools state ──
  const [myTools, setMyTools]       = useState<ToolProps[]>([]);
  const [myLoading, setMyLoading]   = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // ── Stats ──
  const [stats, setStats] = useState<StatsData>({ total: 0, borrowed: 0, reserved: 0 });

  const tabs = [
    { id: "tools",       label: "All Tools" },
    { id: "my-tools",    label: "My Tools" },
    { id: "activity",    label: "Activity" },
    { id: "maintenance", label: "Maintenance" },
    { id: "experts",     label: "Experts" },
  ];

  // ── Fetch All Tools ──
  const fetchTools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "20");

      const res  = await fetch(`/api/tools?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tools");
      const data = await res.json();

      const mapped = (data.tools as ApiTool[]).map(toToolProps);
      setTools(mapped);
      setTotal(data.total ?? 0);

      // Compute stats from all fetched tools
      setStats({
        total:    data.total ?? 0,
        borrowed: (data.tools as ApiTool[]).filter((t) => t.status === "borrowed").length,
        reserved: (data.tools as ApiTool[]).filter((t) => t.status === "reserved").length,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  // ── Fetch My Tools ──
  const fetchMyTools = useCallback(async () => {
    setMyLoading(true);
    try {
      const res  = await fetch("/api/tools/my");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMyTools((data.tools as ApiTool[]).map(toToolProps));
    } catch {
      setMyTools([]);
    } finally {
      setMyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === "tools")    fetchTools();
    if (currentTab === "my-tools") fetchMyTools();
  }, [currentTab, fetchTools, fetchMyTools]);

  // Re-fetch all tools when search/filter changes
  useEffect(() => {
    if (currentTab === "tools") fetchTools();
  }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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
          { label: "Total Tools",   value: String(stats.total),    icon: Tractor,     color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
          { label: "Borrowed",      value: String(stats.borrowed), icon: Clock,       color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
          { label: "Reservations",  value: String(stats.reserved), icon: Users,       color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
          { label: "My Listings",   value: String(myTools.length), icon: ShieldAlert, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
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

<<<<<<< HEAD
      {/* Tabs */}
      <div className="border-b border-card-border">
        <nav className="-mb-px flex space-x-8 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/dashboard?tab=${tab.id}`}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${currentTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}
              `}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

=======
>>>>>>> 581fd655550528962547e1a05b6dc7ca8dd219b4
      {/* Tab Content */}
      <div className="pt-2">

        {/* ── ALL TOOLS TAB ── */}
        {currentTab === "tools" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available for Rent
                {!loading && <span className="ml-2 text-sm font-normal text-gray-400">({total} tools)</span>}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-card-border rounded-lg text-sm bg-card-bg text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                  <option value="reserved">Reserved</option>
                </select>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tools or location..."
                    className="pl-9 pr-4 py-2 border border-card-border rounded-lg text-sm bg-card-bg outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-56"
                  />
                </div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card-bg rounded-2xl border border-card-border h-72 animate-pulse" />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
                {error} — make sure your DATABASE_URL is set and the dev server is running.
              </div>
            )}

            {/* Tools Grid */}
            {!loading && !error && tools.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && tools.length === 0 && (
              <div className="bg-card-muted border border-card-border rounded-2xl p-12 text-center">
                <Tractor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No tools found</h3>
                <p className="text-gray-500">Try a different search or filter.</p>
              </div>
            )}
          </div>
        )}

        {/* ── MY TOOLS TAB ── */}
        {currentTab === "my-tools" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tool Listings</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add New Tool
              </button>
            </div>

            {myLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-card-bg rounded-2xl border border-card-border h-72 animate-pulse" />
                ))}
              </div>
            )}

            {!myLoading && myTools.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}

            {!myLoading && myTools.length === 0 && !showAddForm && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <Tractor className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No tools listed yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  List your unused agricultural equipment and start earning by supporting your local farming community.
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
                >
                  <Plus className="h-4 w-4" />
                  Add New Tool
                </button>
              </div>
            )}

            {/* Inline Add Tool Form */}
            {showAddForm && (
              <AddToolForm
                onSuccess={() => { setShowAddForm(false); fetchMyTools(); }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </div>
        )}

        {/* ── OTHER TABS ── */}
        {["activity", "maintenance", "experts"].includes(currentTab) && (
          <div className="bg-card-muted border border-card-border rounded-2xl p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Coming Soon</h3>
            <p className="text-gray-500">The {tabs.find((t) => t.id === currentTab)?.label} feature is currently under development.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add Tool inline form ──────────────────────────────────────────────────────
function AddToolForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: "", location: "", pricePerDay: "", description: "",
    condition: "good", categoryId: "1", imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr]               = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    try {
      // Sync user first
      await fetch("/api/users/sync", { method: "POST" });

      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          location:    form.location,
          pricePerDay: parseFloat(form.pricePerDay),
          description: form.description || undefined,
          condition:   form.condition,
          categoryId:  parseInt(form.categoryId),
          imageUrl:    form.imageUrl || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to create tool");
      }
      onSuccess();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">List a New Tool</h3>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tool Name *</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. John Deere Tractor"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
          <input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. North District, Farm A"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per Day (₹) *</label>
          <input required type="number" min="1" value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
            placeholder="500"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary">
            <option value="1">Tractors</option>
            <option value="2">Implements</option>
            <option value="3">Irrigation</option>
            <option value="4">Seeding</option>
            <option value="5">Harvesting</option>
            <option value="6">Spraying</option>
            <option value="7">Storage</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
          <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary">
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL (optional)</label>
          <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the tool..."
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
        <div className="md:col-span-2 flex gap-3 justify-end">
          <button type="button" onClick={onCancel}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-card-muted text-gray-700 dark:text-gray-200 hover:bg-card-border transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60">
            {submitting ? "Saving..." : "List Tool"}
          </button>
        </div>
      </form>
    </div>
  );
}
