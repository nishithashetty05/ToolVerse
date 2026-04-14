"use client";

import { useState } from "react";
import { CalendarDays, MapPin, X, Loader2, IndianRupee } from "lucide-react";
import type { ToolProps } from "./ToolCard";

interface BookingModalProps {
  tool: ToolProps;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ tool, onClose, onSuccess }: BookingModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [notes,     setNotes]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  // Compute days and total price whenever dates change
  const days = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000))
    : 0;
  const totalPrice = days * tool.pricePerDay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (days <= 0) {
      setError("End date must be after start date.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Sync user to DB first (idempotent)
      await fetch("/api/users/sync", { method: "POST" });

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId:    parseInt(tool.id),
          startDate,
          endDate,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card-bg rounded-3xl border border-card-border shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-card-border">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Book Tool</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{tool.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              {tool.location}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-card-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CalendarDays className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Booking Confirmed!</h3>
              <p className="text-gray-500 text-sm">Your booking request has been submitted.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tool price summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">Price per day</span>
                <span className="font-bold text-primary text-lg">₹{tool.pricePerDay}</span>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value >= endDate) setEndDate("");
                    }}
                    className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Live price calculation */}
              {days > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>{days} day{days > 1 ? "s" : ""} × ₹{tool.pricePerDay}</span>
                    <span className="font-bold text-green-700 dark:text-green-400 text-base">
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requirements or message to the owner..."
                  className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !startDate || !endDate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><IndianRupee className="h-4 w-4" /> Confirm Booking{days > 0 ? ` — ₹${totalPrice.toLocaleString("en-IN")}` : ""}</>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
