"use client";

import { useState } from "react";
import { MapPin, Star, User, CalendarDays, Pencil, Trash2, Wrench, CheckCircle } from "lucide-react";

export type ToolStatus = "available" | "borrowed" | "reserved" | "maintenance";

export interface ToolProps {
  id: string;
  name: string;
  category: string;
  status: ToolStatus;
  location: string;
  owner: string;
  rating: number;
  imageUrl: string;
  pricePerDay: number;
}

interface ToolCardProps {
  tool: ToolProps;
  onBook?:         (tool: ToolProps) => void;  // All Tools tab
  onEdit?:         (tool: ToolProps) => void;  // My Tools tab
  onDelete?:       (tool: ToolProps) => void;  // My Tools tab
  onMaintain?:     (tool: ToolProps) => void;  // My Tools tab → mark maintenance
  onSetAvailable?: (tool: ToolProps) => void;  // Maintenance tab → restore
}

export default function ToolCard({
  tool, onBook, onEdit, onDelete, onMaintain, onSetAvailable,
}: ToolCardProps) {
  const [deleting, setDeleting] = useState(false);

  const statusConfig: Record<ToolStatus, { badge: string; label: string }> = {
    available:   { badge: "bg-green-500/90 text-white",  label: "Available"   },
    borrowed:    { badge: "bg-red-500/90 text-white",    label: "Borrowed"    },
    reserved:    { badge: "bg-yellow-500/90 text-white", label: "Reserved"    },
    maintenance: { badge: "bg-orange-500/90 text-white", label: "Maintenance" },
  };

  const currentStatus = statusConfig[tool.status] ?? statusConfig.available;
  const isOwnerView   = !!(onEdit || onDelete || onMaintain || onSetAvailable);

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Delete "${tool.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    onDelete(tool);
    setDeleting(false);
  };

  return (
    <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col">
      {/* Image Area */}
      <div className="relative h-48 w-full bg-card-muted overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url(${tool.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status Badge */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${currentStatus.badge}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {currentStatus.label}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100">
          ₹{tool.pricePerDay} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/day</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">{tool.category}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{tool.name}</h3>
          </div>
          <div className="flex items-center gap-1 bg-card-muted px-2 py-1 rounded-md flex-shrink-0 ml-2">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold">{Number(tool.rating).toFixed(1)}</span>
          </div>
        </div>

        <div className="space-y-2 mt-3 text-sm text-gray-600 dark:text-gray-400 flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{tool.location}</span>
          </div>
          <div className="flex text-xs items-center gap-2 border-t border-card-border pt-3 mt-3">
            <div className="h-6 w-6 rounded-full bg-card-muted flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 text-gray-500" />
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Owner: </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{tool.owner}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-card-border">

          {/* All Tools view: Book Now */}
          {!isOwnerView && onBook && (
            <button
              onClick={() => onBook(tool)}
              disabled={tool.status !== "available"}
              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                tool.status === "available"
                  ? "bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/20 active:scale-95"
                  : "bg-card-muted text-gray-400 cursor-not-allowed"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              {tool.status === "available" ? "Book Now" : "Not Available"}
            </button>
          )}

          {/* Maintenance tab: Set Available button */}
          {onSetAvailable && (
            <button
              onClick={() => onSetAvailable(tool)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Set Available
            </button>
          )}

          {/* My Tools view: Edit + Delete + Mark Maintenance */}
          {!onSetAvailable && isOwnerView && (
            <div className="flex gap-2 flex-wrap">
              {onEdit && (
                <button
                  onClick={() => onEdit(tool)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium bg-card-muted text-gray-700 dark:text-gray-200 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {onMaintain && tool.status !== "maintenance" && (
                <button
                  onClick={() => onMaintain(tool)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  Maintenance
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium bg-card-muted text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deleting ? "..." : "Delete"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
