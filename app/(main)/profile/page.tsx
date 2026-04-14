"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Camera, MapPin, Phone, User as UserIcon, Mail, Loader2 } from "lucide-react";

interface DbProfile {
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatarUrl: string | null;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile]   = useState<DbProfile | null>(null);
  const [form, setForm]         = useState({ name: "", phone: "", location: "" });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Fetch DB profile (syncs user to DB on first load too)
  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      try {
        // Upsert user into DB
        await fetch("/api/users/sync", { method: "POST" });
        // Fetch their DB profile
        const res  = await fetch("/api/users/sync");
        if (!res.ok) throw new Error("Could not load profile");
        const data: DbProfile = await res.json();
        setProfile(data);
        setForm({
          name:     data.name     ?? "",
          phone:    data.phone    ?? "",
          location: data.location ?? "",
        });
      } catch (e) {
        setFetchError((e as Error).message);
      }
    })();
  }, [isLoaded, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      // Update name in Clerk
      await user?.update({ firstName: form.name.split(" ")[0], lastName: form.name.split(" ").slice(1).join(" ") });
      // Re-sync to DB with updated name
      await fetch("/api/users/sync", { method: "POST" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || !profile) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">View and update your personal information.</p>
      </div>

      {fetchError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
          {fetchError}
        </div>
      )}

      <div className="bg-card-bg rounded-3xl border border-card-border shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="h-32 bg-primary relative">
          <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center mix-blend-overlay opacity-20" />
        </div>

        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-card-bg bg-card-muted flex items-center justify-center overflow-hidden">
                {user?.imageUrl
                  ? <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                  : <UserIcon className="h-12 w-12 text-gray-400" />
                }
              </div>
              <button className="absolute bottom-0 right-0 bg-card-bg p-1.5 rounded-full border border-card-border shadow-sm text-gray-600 hover:text-primary transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-3">
              {saved && (
                <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  ✓ Saved!
                </span>
              )}
              <button
                form="profile-form"
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email is managed by Clerk and cannot be changed here.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-10 pr-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location / Village</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Village Hub, North District"
                    className="block w-full pl-10 pr-3 py-2.5 border border-card-border rounded-xl bg-card-muted text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Clerk-synced read-only info */}
            <div className="bg-card-muted rounded-xl border border-card-border p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Account Info</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span>Clerk ID: <code className="text-xs bg-white/50 dark:bg-black/20 px-1 rounded">{user?.id}</code></span>
                <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
