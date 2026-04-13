import Image from "next/image";
import { Clock, MapPin, Star } from "lucide-react";

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
}

export default function ToolCard({ tool }: { tool: ToolProps }) {
  const statusConfig = {
    available: { color: "bg-available text-green-800 dark:text-green-100", dot: "bg-green-500", label: "Available" },
    borrowed: { color: "bg-borrowed text-red-800 dark:text-red-100", dot: "bg-red-500", label: "Borrowed" },
    reserved: { color: "bg-reserved text-yellow-800 dark:text-yellow-100", dot: "bg-yellow-500", label: "Reserved" },
  };

  const currentStatus = statusConfig[tool.status];

  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
      {/* Image Area */}
      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
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
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold">{tool.rating}</span>
          </div>
        </div>

        <div className="space-y-2 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="line-clamp-1">{tool.location}</span>
          </div>
          <div className="flex text-xs items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
             <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
               <User className="h-3 w-3 text-gray-500" />
             </div>
             <div>
               <span className="text-gray-500 dark:text-gray-400">Owner: </span>
               <span className="font-medium text-gray-800 dark:text-gray-200">{tool.owner}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
