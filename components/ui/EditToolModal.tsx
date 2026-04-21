"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { ToolProps } from "./ToolCard";
import ImageUploadInput from "./ImageUploadInput";

interface EditToolModalProps {
  tool: ToolProps;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditToolModal({ tool, onClose, onSuccess }: EditToolModalProps) {
  const [form, setForm] = useState({
    name:        tool.name,
    location:    tool.location,
    pricePerDay: String(tool.pricePerDay),
    status:      tool.status,
    imageUrl:    tool.imageUrl,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tools/${tool.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        form.name,
          location:    form.location,
          pricePerDay: parseFloat(form.pricePerDay),
          status:      form.status,
          imageUrl:    form.imageUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Update failed");
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card-bg rounded-3xl border border-card-border shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-card-border">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Edit Tool</p>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tool.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-card-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <ImageUploadInput
              value={form.imageUrl}
              onChange={(url) => setForm({ ...form, imageUrl: url })}
              label="Tool Image"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tool Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price/Day (₹)</label>
              <input
                required
                type="number"
                min="1"
                value={form.pricePerDay}
                onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
                className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "available" | "borrowed" | "reserved" })}
                className="w-full px-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="borrowed">Borrowed</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-card-muted text-gray-700 dark:text-gray-200 hover:bg-card-border transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
