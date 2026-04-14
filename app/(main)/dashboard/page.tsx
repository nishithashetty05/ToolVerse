"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, CalendarDays, CheckCircle2, Clock,
  Plus, Search, ShieldAlert, Tractor, Users,
} from "lucide-react";
import ToolCard, { ToolProps } from "@/components/ui/ToolCard";
import BookingModal  from "@/components/ui/BookingModal";
import EditToolModal from "@/components/ui/EditToolModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiTool {
  id: number; name: string; categoryName: string;
  status: "available" | "borrowed" | "reserved";
  location: string; ownerName: string;
  rating: number; pricePerDay: number; imageUrl: string | null;
}

interface ApiBooking {
  id: number; tool_id: number; tool_name: string;
  tool_location: string; tool_image_url: string | null;
  borrower_name: string; owner_name: string;
  start_date: string; end_date: string;
  total_price: string; status: string; notes: string | null;
  created_at: string;
}

function toToolProps(t: ApiTool): ToolProps {
  return {
    id: String(t.id), name: t.name, category: t.categoryName,
    status: t.status === "reserved" ? "reserved" : t.status === "borrowed" ? "borrowed" : "available",
    location: t.location, owner: t.ownerName,
    rating: t.rating, pricePerDay: t.pricePerDay,
    imageUrl: t.imageUrl ?? "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
  };
}

const STATUS_COLOR: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  active:    "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
  completed: "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-300",
  cancelled: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "tools";

  // ── All Tools state ──
  const [tools,        setTools]    = useState<ToolProps[]>([]);
  const [total,        setTotal]    = useState(0);
  const [loading,      setLoading]  = useState(false);
  const [error,        setError]    = useState("");
  const [search,       setSearch]   = useState("");
  const [statusFilter, setStatus]   = useState("");

  // ── My Tools state ──
  const [myTools,      setMyTools]      = useState<ToolProps[]>([]);
  const [myLoading,    setMyLoading]    = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [editingTool,  setEditingTool]  = useState<ToolProps | null>(null);

  // ── Activity / Bookings state ──
  const [bookings,       setBookings]      = useState<ApiBooking[]>([]);
  const [bookingsRole,   setBookingsRole]  = useState<"borrower" | "owner">("borrower");
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ── Booking Modal ──
  const [bookingTool, setBookingTool] = useState<ToolProps | null>(null);

  // ── Stats ──
  const totalBorrowed = tools.filter(t => t.status === "borrowed").length;
  const totalReserved = tools.filter(t => t.status === "reserved").length;

  const tabs = [
    { id: "tools",       label: "All Tools"    },
    { id: "my-tools",    label: "My Tools"     },
    { id: "activity",    label: "Activity"     },
    { id: "maintenance", label: "Maintenance"  },
    { id: "experts",     label: "Experts"      },
  ];

  // ── Fetch All Tools ─────────────────────────────────────────────────────────
  const fetchTools = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const p = new URLSearchParams();
      if (search)       p.set("search", search);
      if (statusFilter) p.set("status", statusFilter);
      p.set("limit", "20");
      const res  = await fetch(`/api/tools?${p}`);
      if (!res.ok) throw new Error("Failed to load tools");
      const data = await res.json();
      setTools((data.tools as ApiTool[]).map(toToolProps));
      setTotal(data.total ?? 0);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  // ── Fetch My Tools ──────────────────────────────────────────────────────────
  const fetchMyTools = useCallback(async () => {
    setMyLoading(true);
    try {
      const res  = await fetch("/api/tools/my");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMyTools((data.tools as ApiTool[]).map(toToolProps));
    } catch { setMyTools([]); }
    finally { setMyLoading(false); }
  }, []);

  // ── Fetch Bookings ──────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async (role: "borrower" | "owner") => {
    setBookingsLoading(true);
    try {
      const res  = await fetch(`/api/bookings?role=${role}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch { setBookings([]); }
    finally { setBookingsLoading(false); }
  }, []);

  // ── Delete Tool ─────────────────────────────────────────────────────────────
  const handleDeleteTool = async (tool: ToolProps) => {
    try {
      const res = await fetch(`/api/tools/${tool.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Delete failed");
        return;
      }
      fetchMyTools();
    } catch { alert("Failed to delete tool"); }
  };

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentTab === "tools")    fetchTools();
    if (currentTab === "my-tools") fetchMyTools();
    if (currentTab === "activity") fetchBookings(bookingsRole);
  }, [currentTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentTab === "tools") fetchTools();
  }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentTab === "activity") fetchBookings(bookingsRole);
  }, [bookingsRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Booking Modal */}
      {bookingTool && (
        <BookingModal
          tool={bookingTool}
          onClose={() => setBookingTool(null)}
          onSuccess={() => { fetchTools(); setBookingTool(null); }}
        />
      )}

      {/* Edit Modal */}
      {editingTool && (
        <EditToolModal
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSuccess={() => { fetchMyTools(); setEditingTool(null); }}
        />
      )}

      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your tools, reservations, and activities.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Tools",  value: String(total),          icon: Tractor,    color: "bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-400"   },
            { label: "Borrowed",     value: String(totalBorrowed),  icon: Clock,      color: "bg-red-100    text-red-600    dark:bg-red-900/30    dark:text-red-400"    },
            { label: "Reservations", value: String(totalReserved),  icon: Users,      color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
            { label: "My Listings",  value: String(myTools.length), icon: ShieldAlert,color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
          ].map((s, i) => (
            <div key={i} className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-xl ${s.color}`}><s.icon className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-card-border">
          <nav className="-mb-px flex space-x-8 overflow-x-auto pb-1 no-scrollbar">
            {tabs.map((tab) => (
              <Link key={tab.id} href={`/dashboard?tab=${tab.id}`}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}>
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="pt-2">

          {/* ── ALL TOOLS ── */}
          {currentTab === "tools" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Available for Rent
                  {!loading && <span className="ml-2 text-sm font-normal text-gray-400">({total} tools)</span>}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 border border-card-border rounded-lg text-sm bg-card-bg text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary">
                    <option value="">All Status</option>
                    <option value="available">Available</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="reserved">Reserved</option>
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search tools or location..."
                      className="pl-9 pr-4 py-2 border border-card-border rounded-lg text-sm bg-card-bg outline-none focus:ring-2 focus:ring-primary w-full sm:w-56" />
                  </div>
                </div>
              </div>

              {loading && <SkeletonGrid count={4} />}

              {!loading && error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
                  {error} — check DATABASE_URL in .env and ensure PostgreSQL is running.
                </div>
              )}

              {!loading && !error && tools.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {tools.map((t) => (
                    <ToolCard key={t.id} tool={t} onBook={() => setBookingTool(t)} />
                  ))}
                </div>
              )}

              {!loading && !error && tools.length === 0 && (
                <EmptyState icon={<Tractor className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
                  title="No tools found" message="Try a different search or filter." />
              )}
            </div>
          )}

          {/* ── MY TOOLS ── */}
          {currentTab === "my-tools" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Tool Listings</h2>
                <button onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> Add New Tool
                </button>
              </div>

              {myLoading && <SkeletonGrid count={3} />}

              {!myLoading && myTools.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {myTools.map((t) => (
                    <ToolCard key={t.id} tool={t}
                      onEdit={() => setEditingTool(t)}
                      onDelete={handleDeleteTool} />
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
                    List your unused agricultural equipment and start earning.
                  </p>
                  <button onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30">
                    <Plus className="h-4 w-4" /> Add New Tool
                  </button>
                </div>
              )}

              {showAddForm && (
                <AddToolForm
                  onSuccess={() => { setShowAddForm(false); fetchMyTools(); }}
                  onCancel={() => setShowAddForm(false)}
                />
              )}
            </div>
          )}

          {/* ── ACTIVITY (MY BOOKINGS) ── */}
          {currentTab === "activity" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Bookings</h2>
                <div className="flex rounded-xl border border-card-border overflow-hidden text-sm font-medium">
                  {(["borrower", "owner"] as const).map((role) => (
                    <button key={role}
                      onClick={() => setBookingsRole(role)}
                      className={`px-4 py-2 transition-colors ${
                        bookingsRole === role
                          ? "bg-primary text-white"
                          : "bg-card-bg text-gray-600 dark:text-gray-400 hover:bg-card-muted"
                      }`}>
                      {role === "borrower" ? "I Borrowed" : "On My Tools"}
                    </button>
                  ))}
                </div>
              </div>

              {bookingsLoading && (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-card-bg rounded-2xl border border-card-border animate-pulse" />
                  ))}
                </div>
              )}

              {!bookingsLoading && bookings.length === 0 && (
                <EmptyState
                  icon={<CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
                  title="No bookings yet"
                  message={bookingsRole === "borrower" ? "You haven't booked any tools yet." : "No one has booked your tools yet."}
                />
              )}

              {!bookingsLoading && bookings.length > 0 && (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className="bg-card-bg rounded-2xl border border-card-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
                      {/* Tool image */}
                      <div
                        className="h-16 w-16 rounded-xl bg-card-muted flex-shrink-0 bg-cover bg-center"
                        style={{ backgroundImage: b.tool_image_url ? `url(${b.tool_image_url})` : undefined }}
                      />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{b.tool_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.tool_location}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(b.start_date).toLocaleDateString("en-IN")} →{" "}
                            {new Date(b.end_date).toLocaleDateString("en-IN")}
                          </span>
                          <span className="font-semibold text-primary">₹{parseFloat(b.total_price).toLocaleString("en-IN")}</span>
                        </div>
                        {bookingsRole === "owner" && (
                          <p className="text-xs text-gray-400 mt-1">Borrower: <span className="font-medium text-gray-700 dark:text-gray-300">{b.borrower_name}</span></p>
                        )}
                      </div>
                      {/* Status badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COMING SOON ── */}
          {["maintenance", "experts"].includes(currentTab) && (
            <EmptyState
              icon={<AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
              title="Coming Soon"
              message={`The ${tabs.find((t) => t.id === currentTab)?.label} feature is under development.`}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── Helper UI Components ───────────────────────────────────────────────────────
function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-card-bg rounded-2xl border border-card-border h-72 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="bg-card-muted border border-card-border rounded-2xl p-12 text-center">
      {icon}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

// ── Add Tool Form ──────────────────────────────────────────────────────────────
function AddToolForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name:"", location:"", pricePerDay:"", description:"", condition:"good", categoryId:"1", imageUrl:"" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setErr("");
    try {
      await fetch("/api/users/sync", { method: "POST" });
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, location: form.location,
          pricePerDay: parseFloat(form.pricePerDay),
          description: form.description || undefined,
          condition: form.condition, categoryId: parseInt(form.categoryId),
          imageUrl: form.imageUrl || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      onSuccess();
    } catch (e) { setErr((e as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">List a New Tool</h3>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label:"Tool Name *",     key:"name",        type:"text",   placeholder:"e.g. John Deere Tractor" },
          { label:"Location *",      key:"location",    type:"text",   placeholder:"e.g. North District" },
          { label:"Price/Day (₹) *", key:"pricePerDay", type:"number", placeholder:"500" },
          { label:"Image URL",       key:"imageUrl",    type:"text",   placeholder:"https://..." },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input required={label.includes("*")} type={type} min={type === "number" ? "1" : undefined}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        ))}

        {[
          { label:"Category", key:"categoryId", options:[["1","Tractors"],["2","Implements"],["3","Irrigation"],["4","Seeding"],["5","Harvesting"],["6","Spraying"],["7","Storage"]] },
          { label:"Condition", key:"condition",  options:[["excellent","Excellent"],["good","Good"],["fair","Fair"],["poor","Poor"]] },
        ].map(({ label, key, options }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary">
              {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description..."
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
