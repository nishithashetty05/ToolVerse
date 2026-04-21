// =============================================================
// ToolVerse — TypeScript types mirroring the PostgreSQL schema
// =============================================================

export type ToolStatus = 'available' | 'reserved' | 'borrowed' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type ToolCondition = 'excellent' | 'good' | 'fair' | 'poor';

// ---------------------------------------------------------------
// Database row types (snake_case, matching column names)
// ---------------------------------------------------------------

export interface DbUser {
  id: number;
  clerk_id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: Date;
}

export interface DbTool {
  id: number;
  owner_id: number;
  category_id: number;
  name: string;
  description: string | null;
  location: string;
  price_per_day: string; // pg returns NUMERIC as string
  status: ToolStatus;
  condition: ToolCondition;
  image_url: string | null;
  contact_phone: string | null;
  created_at: Date;
  updated_at: Date;
}

/** Result from the v_tools_with_rating view */
export interface DbToolWithRating extends DbTool {
  category_name: string;
  owner_name: string;
  owner_clerk_id: string;
  rating: string;       // AVG() returns string from pg
  review_count: string; // COUNT() returns string from pg
}

export interface DbBooking {
  id: number;
  tool_id: number;
  borrower_id: number;
  start_date: Date;
  end_date: Date;
  total_price: string;
  status: BookingStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbReview {
  id: number;
  booking_id: number;
  reviewer_id: number;
  tool_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
}

// ---------------------------------------------------------------
// API response shapes (camelCase, for frontend consumption)
// ---------------------------------------------------------------

export interface ToolResponse {
  id: number;
  ownerId: number;
  ownerName: string;
  ownerClerkId: string;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  location: string;
  pricePerDay: number;
  status: ToolStatus;
  condition: ToolCondition;
  imageUrl: string | null;
  contactPhone: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface BookingResponse {
  id: number;
  toolId: number;
  borrowerId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedToolsResponse {
  tools: ToolResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------
// API request body types
// ---------------------------------------------------------------

export interface CreateToolBody {
  categoryId: number;
  name: string;
  description?: string;
  location: string;
  pricePerDay: number;
  condition?: ToolCondition;
  imageUrl?: string;
  contactPhone?: string;
}

export interface UpdateToolBody extends Partial<CreateToolBody> {
  status?: ToolStatus;
}

export interface CreateBookingBody {
  toolId: number;
  startDate: string; // ISO date string 'YYYY-MM-DD'
  endDate: string;
  notes?: string;
}

// ---------------------------------------------------------------
// Experts
// ---------------------------------------------------------------

export interface DbExpert {
  id: number;
  user_id: number | null;
  name: string;
  specialty: string;
  bio: string | null;
  location: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  years_exp: number | null;
  rate_per_day: string; // NUMERIC returned as string by pg
  available: boolean;
  created_at: Date;
}

export interface ExpertResponse {
  id: number;
  userId: number | null;
  name: string;
  specialty: string;
  bio: string | null;
  location: string;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  yearsExp: number | null;
  ratePerDay: number;
  available: boolean;
  createdAt: string;
}

export interface CreateExpertBody {
  name: string;
  specialty: string;
  bio?: string;
  location: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  yearsExp?: number;
  ratePerDay: number;
}

export type UpdateExpertBody = Partial<CreateExpertBody> & { available?: boolean };
