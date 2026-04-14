"use client";

import Image from "next/image";
import { useState } from "react";
import { Calendar, ChevronDown, Clock, MapPin, Star, User, X } from "lucide-react";

export type ToolStatus = "available" | "borrowed" | "reserved";

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
  addedDate?: string;
  condition?: string;
  dueDate?: string;
  borrower?: string;
}

export default function ToolCard({ tool }: { tool: ToolProps }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    available: { color: "bg-available text-green-800 dark:text-green-100", dot: "bg-green-500", label: "Available" },
    borrowed: { color: "bg-borrowed text-red-800 dark:text-red-100", dot: "bg-red-500", label: "Borrowed" },
    reserved: { color: "bg-reserved text-yellow-800 dark:text-yellow-100", dot: "bg-yellow-500", label: "Reserved" },
  };

  const currentStatus = statusConfig[tool.status];

  return (
    <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
      {/* Image Area */}
      <div className="relative h-48 w-full bg-card-muted overflow-hidden">
        {/* We would use next/image in real app, but for generic styling we use a div with background or placeholder */}
        <div 
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url(${tool.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Status Badge */}
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
          tool.status === 'available' ? 'bg-green-500/90 text-white' : 
          tool.status === 'borrowed' ? 'bg-red-500/90 text-white' : 
          'bg-yellow-500/90 text-white'
        }`}>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {currentStatus.label}
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100">
          ₹{tool.pricePerDay} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/day</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">{tool.category}</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{tool.name}</h3>
          </div>
          <div className="flex items-center gap-1 bg-card-muted px-2 py-1 rounded-md">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold">{tool.rating}</span>
          </div>
        </div>

        <div className="space-y-2 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
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

        {/* Expanded Extra Details Before Action Buttons (e.g. Due Date) */}
        {isExpanded && tool.status === 'borrowed' && (
          <div className="mt-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              Due: {tool.dueDate || "N/A"} · Borrowed by {tool.borrower || "Unknown"}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className={`mt-4 pt-4 border-t border-card-border flex gap-2 ${isExpanded && tool.status === 'borrowed' ? 'border-t-0 pt-0' : ''}`}>
          {tool.status === 'available' ? (
            <>
              <button className="flex-1 bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                Borrow Now
              </button>
              <button className="flex-1 bg-white hover:bg-gray-50 text-green-700 border border-green-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                Reserve
              </button>
            </>
          ) : (
            <button className="flex-1 bg-green-700 hover:bg-green-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
              Join Waitlist
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-white hover:bg-gray-50 text-gray-500 border border-gray-300 p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center">
            {isExpanded ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded Details Table */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-card-border/50 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Added Date</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{tool.addedDate || "2025-01-01"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Daily Rate</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">₹{tool.pricePerDay}/day</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">Condition</span>
              <span className={`font-medium ${
                tool.condition?.toLowerCase() === 'excellent' ? 'text-green-600' : 
                tool.condition?.toLowerCase() === 'good' ? 'text-blue-600' : 
                'text-yellow-600'
              }`}>
                {tool.condition || "Good"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
