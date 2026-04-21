"use client";

import { MapPin, Phone, Mail, Clock, Star, BadgeCheck, DollarSign } from "lucide-react";
import type { ExpertResponse } from "@/types";

const SPECIALTY_COLORS: Record<string, string> = {
  "Soil Health & Fertilisation":  "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400",
  "Irrigation & Water Management": "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  "Pest & Disease Control":       "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
  "Organic Farming":              "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400",
  "Tractor & Equipment Repair":   "bg-gray-100   text-gray-700   dark:bg-gray-800      dark:text-gray-300",
  "Greenhouse & Horticulture":    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function specialtyColor(specialty: string): string {
  return SPECIALTY_COLORS[specialty] ?? "bg-primary/10 text-primary";
}

interface ExpertCardProps {
  expert: ExpertResponse;
}

export default function ExpertCard({ expert }: ExpertCardProps) {


  return (
    <div className="bg-card-bg rounded-2xl border border-card-border overflow-hidden hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col">
      {/* Header gradient band */}
      <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative flex-shrink-0">
        {/* Availability pill */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            expert.available
              ? "bg-green-500/90 text-white"
              : "bg-gray-400/80 text-white"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full bg-white ${expert.available ? "animate-pulse" : ""}`} />
          {expert.available ? "Available" : "Unavailable"}
        </div>
      </div>

      {/* Avatar — overlaps the header */}
      <div className="relative px-5 -mt-10 flex-shrink-0">
        {expert.avatarUrl ? (
          <img
            src={expert.avatarUrl}
            alt={expert.name}
            className="h-20 w-20 rounded-2xl object-cover border-4 border-card-bg shadow-lg"
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl border-4 border-card-bg shadow-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-2xl font-bold">
            {getInitials(expert.name)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-3 pb-5 flex flex-col flex-1">
        {/* Name + verified */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
              {expert.name}
              <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
            </h3>
          </div>
          {expert.yearsExp !== null && (
            <div className="flex items-center gap-1 bg-card-muted px-2 py-0.5 rounded-md flex-shrink-0">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {expert.yearsExp}yr
              </span>
            </div>
          )}
        </div>

        {/* Specialty badge */}
        <span
          className={`inline-block self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${specialtyColor(expert.specialty)}`}
        >
          {expert.specialty}
        </span>

        {/* Bio */}
        {expert.bio && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
            {expert.bio}
          </p>
        )}

        {/* Meta grid */}
        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-1">{expert.location}</span>
          </div>
          {expert.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{expert.phone}</span>
            </div>
          )}
          {expert.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="line-clamp-1">{expert.email}</span>
            </div>
          )}
          {expert.yearsExp !== null && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span>{expert.yearsExp} years experience</span>
            </div>
          )}
        </div>

        {/* Rate */}
        <div className="pt-3 border-t border-card-border flex items-center gap-3 mt-auto">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ₹{expert.ratePerDay.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-500">/day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
