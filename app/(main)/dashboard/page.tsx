"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle, CalendarDays, CheckCircle2, Clock,
  Plus, Search, ShieldAlert, Tractor, Users,
  Wrench, UserCheck, Filter, Star,
  CheckCheck, XCircle, Truck, RotateCcw,
} from "lucide-react";
import ToolCard, { ToolProps } from "@/components/ui/ToolCard";
import BookingModal  from "@/components/ui/BookingModal";
import EditToolModal from "@/components/ui/EditToolModal";
import ExpertCard    from "@/components/ui/ExpertCard";
import ReviewModal   from "@/components/ui/ReviewModal";
import ImageUploadInput from "@/components/ui/ImageUploadInput";
import type { ExpertResponse } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiTool {
  id: number; name: string; categoryName: string;
  status: "available" | "borrowed" | "reserved" | "maintenance";
  location: string; ownerName: string; condition: string;
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
    status: t.status, condition: t.condition,
    location: t.location, owner: t.ownerName,
    rating: t.rating, pricePerDay: t.pricePerDay,
    imageUrl: t.imageUrl || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600",
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
function DashboardContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "tools";

  // ── All Tools state ──
  const [tools,        setTools]    = useState<ToolProps[]>([]);
  const [total,        setTotal]    = useState(0);
  const [loading,      setLoading]  = useState(false);
  const [error,        setError]    = useState("");
  const [search,       setSearch]   = useState(searchParams.get("search") || "");
  const [statusFilter, setStatus]   = useState(searchParams.get("status") || "");

  // Update local state when URL search params change
  useEffect(() => {
    const s = searchParams.get("search");
    if (s !== null) {
      setSearch(s);
    }
  }, [searchParams]);

  // ── My Tools state ──
  const [myTools,      setMyTools]      = useState<ToolProps[]>([]);
  const [myLoading,    setMyLoading]    = useState(false);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [editingTool,  setEditingTool]  = useState<ToolProps | null>(null);

  // ── Activity / Bookings state ──
  const [bookings,        setBookings]       = useState<ApiBooking[]>([]);
  const [bookingsRole,    setBookingsRole]   = useState<"borrower" | "owner">("borrower");
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [actionLoading,   setActionLoading]  = useState<number | null>(null);

  // ── Review Modal ──
  const [reviewBooking, setReviewBooking] = useState<{ id: number; toolName: string } | null>(null);

  // ── Maintenance tab state ──
  const [maintTools,   setMaintTools]   = useState<ToolProps[]>([]);
  const [maintLoading, setMaintLoading] = useState(false);

  // ── Experts tab state ──
  const [experts,        setExperts]       = useState<ExpertResponse[]>([]);
  const [expertTotal,    setExpertTotal]   = useState(0);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [expertSearch,   setExpertSearch]  = useState(searchParams.get("search") || "");
  const [availFilter,    setAvailFilter]   = useState("");
  const [showExpertForm, setShowExpertForm] = useState(false);

  useEffect(() => {
    const s = searchParams.get("search");
    if (s !== null) {
      if (currentTab === "experts") setExpertSearch(s);
    }
  }, [searchParams, currentTab]);

  // ── Booking Modal ──
  const [bookingTool, setBookingTool] = useState<ToolProps | null>(null);

  // ── Stats ──
  const totalBorrowed = tools.filter(t => t.status === "borrowed").length;
  const totalReserved = tools.filter(t => t.status === "reserved").length;

  const tabs = [
    { id: "tools",       label: "All Tools"   },
    { id: "my-tools",    label: "My Tools"    },
    { id: "activity",    label: "Activity"    },
    { id: "maintenance", label: "Maintenance" },
    { id: "experts",     label: "Experts"     },
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

  // ── Fetch Maintenance Tools ─────────────────────────────────────────────────
  const fetchMaintTools = useCallback(async () => {
    setMaintLoading(true);
    try {
      const res  = await fetch("/api/tools?status=maintenance&limit=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMaintTools((data.tools as ApiTool[]).map(toToolProps));
    } catch { setMaintTools([]); }
    finally { setMaintLoading(false); }
  }, []);

  // ── Fetch Experts ───────────────────────────────────────────────────────────
  const fetchExperts = useCallback(async () => {
    setExpertsLoading(true);
    try {
      const p = new URLSearchParams();
      if (expertSearch) p.set("search", expertSearch);
      if (availFilter)  p.set("available", availFilter);
      p.set("limit", "20");
      const res  = await fetch(`/api/experts?${p}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExperts(data.experts ?? []);
      setExpertTotal(data.total ?? 0);
    } catch { setExperts([]); }
    finally { setExpertsLoading(false); }
  }, [expertSearch, availFilter]);

  // ── Status Toggle Helpers ───────────────────────────────────────────────────
  const setToolStatus = async (tool: ToolProps, status: string) => {
    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed to update status");
        return;
      }
      fetchMyTools();
      if (currentTab === "maintenance") fetchMaintTools();
    } catch { alert("Failed to update tool status"); }
  };

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

  // ── Update Booking Status ───────────────────────────────────────────────────
  const updateBookingStatus = async (bookingId: number, status: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Action failed");
        return;
      }
      fetchBookings(bookingsRole);
    } catch { alert("Action failed"); }
    finally { setActionLoading(null); }
  };

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentTab === "tools")       fetchTools();
    if (currentTab === "my-tools")    fetchMyTools();
    if (currentTab === "activity")  { fetchBookings(bookingsRole); fetchMyTools(); }
    if (currentTab === "maintenance") fetchMaintTools();
    if (currentTab === "experts")     fetchExperts();
  }, [currentTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentTab === "tools") fetchTools();
  }, [search, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentTab === "activity") fetchBookings(bookingsRole);
  }, [bookingsRole]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentTab === "experts") fetchExperts();
  }, [expertSearch, availFilter]); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          bookingId={reviewBooking.id}
          toolName={reviewBooking.toolName}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => { fetchBookings(bookingsRole); setReviewBooking(null); }}
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
                <button onClick={() => {
                  setShowAddForm(true);
                  setTimeout(() => {
                    document.getElementById("add-tool-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
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
                      onDelete={handleDeleteTool}
                      onMaintain={(tool) => setToolStatus(tool, "maintenance")}
                    />
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
                  <button onClick={() => {
                    setShowAddForm(true);
                    setTimeout(() => {
                      document.getElementById("add-tool-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
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
                  {bookings.map((b) => {
                    const isActing = actionLoading === b.id;
                    // Check if borrower has already reviewed this booking
                    return (
                      <div key={b.id} className="bg-card-bg rounded-2xl border border-card-border p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          {/* Tool image */}
                          <div
                            className="h-16 w-16 rounded-xl bg-card-muted flex-shrink-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${b.tool_image_url || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600"})` }}
                          />
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{b.tool_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.tool_location}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(b.start_date).toLocaleDateString("en-IN")} → {new Date(b.end_date).toLocaleDateString("en-IN")}
                              </span>
                              <span className="font-semibold text-primary">₹{parseFloat(b.total_price).toLocaleString("en-IN")}</span>
                            </div>
                            {bookingsRole === "owner" && (
                              <p className="text-xs text-gray-400 mt-1">Borrower: <span className="font-medium text-gray-700 dark:text-gray-300">{b.borrower_name}</span></p>
                            )}
                            {bookingsRole === "borrower" && (
                              <p className="text-xs text-gray-400 mt-1">Owner: <span className="font-medium text-gray-700 dark:text-gray-300">{b.owner_name}</span></p>
                            )}
                          </div>
                          {/* Status badge */}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLOR[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </span>
                        </div>

                        {/* ── Action Buttons ── */}
                        {bookingsRole === "owner" && (
                          <div className="mt-3 pt-3 border-t border-card-border flex gap-2 flex-wrap">
                            {b.status === "pending" && (
                              <>
                                <button
                                  disabled={isActing}
                                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" />
                                  {isActing ? "..." : "Confirm"}
                                </button>
                                <button
                                  disabled={isActing}
                                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors disabled:opacity-60"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {isActing ? "..." : "Decline"}
                                </button>
                              </>
                            )}
                            {b.status === "confirmed" && (
                              <>
                                <button
                                  disabled={isActing}
                                  onClick={() => updateBookingStatus(b.id, "active")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  {isActing ? "..." : "Mark as Active (Tool Given)"}
                                </button>
                                <button
                                  disabled={isActing}
                                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors disabled:opacity-60"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  {isActing ? "..." : "Cancel"}
                                </button>
                              </>
                            )}
                            {b.status === "active" && (
                              <button
                                disabled={isActing}
                                onClick={() => updateBookingStatus(b.id, "completed")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                {isActing ? "..." : "Mark as Returned"}
                              </button>
                            )}
                          </div>
                        )}

                        {bookingsRole === "borrower" && (
                          <div className="mt-3 pt-3 border-t border-card-border flex gap-2 flex-wrap">
                            {(b.status === "pending" || b.status === "confirmed") && (
                              <button
                                disabled={isActing}
                                onClick={() => updateBookingStatus(b.id, "cancelled")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors disabled:opacity-60"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                {isActing ? "..." : "Cancel Booking"}
                              </button>
                            )}
                            {b.status === "active" && (
                              <button
                                disabled={isActing}
                                onClick={() => updateBookingStatus(b.id, "completed")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                {isActing ? "..." : "Mark as Returned"}
                              </button>
                            )}
                            {b.status === "completed" && (
                              <button
                                onClick={() => setReviewBooking({ id: b.id, toolName: b.tool_name })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                              >
                                <Star className="h-3.5 w-3.5" />
                                Leave a Review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MAINTENANCE ── */}
          {currentTab === "maintenance" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-orange-500" />
                    Tools Under Maintenance
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    These tools are temporarily unavailable for booking.
                  </p>
                </div>
                <button
                  onClick={fetchMaintTools}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-card-muted text-gray-600 dark:text-gray-300 hover:bg-card-border transition-colors"
                >
                  Refresh
                </button>
              </div>

              {/* Info banner */}
              <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 rounded-xl p-4 flex items-start gap-3">
                <Wrench className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 dark:text-orange-300">Mark your tools as &quot;Under Maintenance&quot;</p>
                  <p className="text-orange-600 dark:text-orange-400 mt-0.5">
                    Go to <strong>My Tools</strong> and click the &quot;Maintenance&quot; button on any tool to temporarily block bookings.
                    Come back here to restore it.
                  </p>
                </div>
              </div>

              {maintLoading && <SkeletonGrid count={3} />}

              {!maintLoading && maintTools.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {maintTools.map((t) => (
                    <ToolCard
                      key={t.id}
                      tool={t}
                      onSetAvailable={(tool) => setToolStatus(tool, "available")}
                    />
                  ))}
                </div>
              )}

              {!maintLoading && maintTools.length === 0 && (
                <EmptyState
                  icon={<CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />}
                  title="All tools are operational"
                  message="No tools are currently under maintenance. Great news!"
                />
              )}
            </div>
          )}

          {/* ── EXPERTS ── */}
          {currentTab === "experts" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Agricultural Experts
                    {!expertsLoading && (
                      <span className="text-sm font-normal text-gray-400">({expertTotal} experts)</span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Connect with verified agricultural consultants in your area.
                  </p>
                </div>
                <button
                  onClick={() => setShowExpertForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4" /> Register as Expert
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={expertSearch}
                    onChange={(e) => setExpertSearch(e.target.value)}
                    placeholder="Search by name, specialty, location..."
                    className="pl-9 pr-4 py-2 border border-card-border rounded-lg text-sm bg-card-bg outline-none focus:ring-2 focus:ring-primary w-full sm:w-72"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={availFilter}
                    onChange={(e) => setAvailFilter(e.target.value)}
                    className="px-3 py-2 border border-card-border rounded-lg text-sm bg-card-bg text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Experts</option>
                    <option value="true">Available Now</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              {/* Register Form */}
              {showExpertForm && (
                <RegisterExpertForm
                  onSuccess={() => { setShowExpertForm(false); fetchExperts(); }}
                  onCancel={() => setShowExpertForm(false)}
                />
              )}

              {expertsLoading && <SkeletonGrid count={4} />}

              {!expertsLoading && experts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {experts.map((e) => (
                    <ExpertCard key={e.id} expert={e} />
                  ))}
                </div>
              )}

              {!expertsLoading && experts.length === 0 && (
                <EmptyState
                  icon={<UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
                  title="No experts found"
                  message={expertSearch ? "Try a different search term." : "Be the first to register as an agricultural expert!"}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense fallback={<div className="p-8 flex justify-center text-gray-500">Loading dashboard...</div>}>
      <DashboardContent />
    </React.Suspense>
  );
}

// ── Helper UI Components ────────────────────────────────────────────────────────
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

// ── Add Tool Form ───────────────────────────────────────────────────────────────
function AddToolForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: "", location: "", pricePerDay: "",
    description: "", condition: "good", categoryId: "1",
    imageUrl: "",
  });
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
    <div id="add-tool-form" className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">List a New Tool</h3>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Image upload ─ spans both columns */}
        <div className="md:col-span-2">
          <ImageUploadInput
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
            label="Tool Image"
          />
        </div>

        {/* Text fields */}
        {[
          { label: "Tool Name *",     key: "name",        type: "text",   placeholder: "e.g. John Deere Tractor" },
          { label: "Location *",      key: "location",    type: "text",   placeholder: "e.g. North District" },
          { label: "Price/Day (₹) *", key: "pricePerDay", type: "number", placeholder: "500" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
              required={label.includes("*")}
              type={type}
              min={type === "number" ? "1" : undefined}
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}

        {/* Selects */}
        {[
          { label: "Category", key: "categoryId", options: [["1","Tractors"],["2","Implements"],["3","Irrigation"],["4","Seeding"],["5","Harvesting"],["6","Spraying"],["7","Storage"]] },
          { label: "Condition", key: "condition",  options: [["excellent","Excellent"],["good","Good"],["fair","Fair"],["poor","Poor"]] },
        ].map(({ label, key, options }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}

        {/* Description ─ full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description..."
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
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

// ── Register Expert Form ────────────────────────────────────────────────────────
function RegisterExpertForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const SPECIALTIES = [
    "Soil Health & Fertilisation",
    "Irrigation & Water Management",
    "Pest & Disease Control",
    "Organic Farming",
    "Tractor & Equipment Repair",
    "Greenhouse & Horticulture",
    "Crop Planning & Rotation",
    "Post-Harvest & Storage",
    "Other",
  ];

  const [form, setForm] = useState({
    name: "", specialty: SPECIALTIES[0], bio: "",
    location: "", phone: "", email: "",
    yearsExp: "", ratePerDay: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setErr("");
    try {
      await fetch("/api/users/sync", { method: "POST" });
      const res = await fetch("/api/experts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       form.name,
          specialty:  form.specialty,
          bio:        form.bio        || undefined,
          location:   form.location,
          phone:      form.phone      || undefined,
          email:      form.email      || undefined,
          yearsExp:   form.yearsExp   ? parseInt(form.yearsExp)   : undefined,
          ratePerDay: form.ratePerDay ? parseFloat(form.ratePerDay) : undefined,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Registration failed"); }
      onSuccess();
    } catch (e) { setErr((e as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Register as an Expert</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Share your knowledge with farmers in your region.
      </p>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
          <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Rajan Kumar"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location *</label>
          <input required type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Hassan, Karnataka"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialty *</label>
          <select required value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary">
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Rate per day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consultation Rate/Day (₹) *</label>
          <input required type="number" min="1" value={form.ratePerDay} onChange={(e) => setForm({ ...form, ratePerDay: e.target.value })}
            placeholder="1000"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Years experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Years of Experience</label>
          <input type="number" min="0" value={form.yearsExp} onChange={(e) => setForm({ ...form, yearsExp: e.target.value })}
            placeholder="e.g. 10"
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        {/* Bio — spans full width */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio / About You</label>
          <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell farmers about your expertise, achievements, and how you can help..."
            className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <div className="md:col-span-2 flex gap-3 justify-end">
          <button type="button" onClick={onCancel}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-card-muted text-gray-700 dark:text-gray-200 hover:bg-card-border transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60">
            {submitting ? "Registering..." : "Register as Expert"}
          </button>
        </div>
      </form>
    </div>
  );
}
