// =============================================================
// GET  /api/tools  — List all tools (with search, filter, pagination)
// POST /api/tools  — Create a new tool listing
// =============================================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { query } from '@/lib/db';
import type {
  DbToolWithRating,
  ToolResponse,
  PaginatedToolsResponse,
  CreateToolBody,
} from '@/types';

// ---------------------------------------------------------------
// Helper: map DB row → API response (snake_case → camelCase)
// ---------------------------------------------------------------
function mapTool(row: DbToolWithRating): ToolResponse {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerClerkId: row.owner_clerk_id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    name: row.name,
    description: row.description,
    location: row.location,
    pricePerDay: parseFloat(row.price_per_day),
    status: row.status,
    condition: row.condition,
    imageUrl: row.image_url,
    rating: parseFloat(row.rating as unknown as string) || 0,
    reviewCount: parseInt(row.review_count as unknown as string) || 0,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------
// GET /api/tools
//
// Query params:
//   search   — ILIKE match on name OR location
//   status   — exact tool_status filter
//   category — category_id filter
//   sort     — "price_asc" | "price_desc" | "rating" | "newest" (default)
//   page     — page number (default 1)
//   limit    — items per page (default 12, max 50)
// ---------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search   = searchParams.get('search')   ?? '';
    const status   = searchParams.get('status')   ?? '';
    const category = searchParams.get('category') ?? '';
    const sort     = searchParams.get('sort')      ?? 'newest';
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit    = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12')));
    const offset   = (page - 1) * limit;

    // ----- Build WHERE clauses dynamically ----------------------
    // $1 is always reserved for the search parameter
    const conditions: string[] = [];
    const params: unknown[]    = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(v.name ILIKE $${params.length} OR v.location ILIKE $${params.length})`);
    }

    if (status) {
      params.push(status);
      conditions.push(`v.status = $${params.length}::tool_status`);
    }

    if (category) {
      params.push(parseInt(category));
      conditions.push(`v.category_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // ----- ORDER BY clause --------------------------------------
    const orderMap: Record<string, string> = {
      price_asc:  'v.price_per_day ASC',
      price_desc: 'v.price_per_day DESC',
      rating:     'v.rating DESC',
      newest:     'v.created_at DESC',
    };
    const orderBy = orderMap[sort] ?? 'v.created_at DESC';

    // ----- Pagination params ------------------------------------
    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    // ----- Main paginated query (uses v_tools_with_rating view) --
    // COUNT(*) OVER() returns total matching rows alongside each row,
    // avoiding a second COUNT query.
    const sql = `
      SELECT
        v.*,
        COUNT(*) OVER() AS total_count
      FROM v_tools_with_rating v
      ${where}
      ORDER BY ${orderBy}
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const result = await query<DbToolWithRating & { total_count: string }>(sql, params);

    const total      = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const tools      = result.rows.map(mapTool);
    const totalPages = Math.ceil(total / limit);

    const response: PaginatedToolsResponse = { tools, total, page, limit, totalPages };
    return Response.json(response);
  } catch (err) {
    console.error('[GET /api/tools]', err);
    return Response.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// POST /api/tools  (Protected — requires Clerk auth)
//
// Body (JSON): CreateToolBody
//   { categoryId, name, description?, location,
//     pricePerDay, condition?, imageUrl? }
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Auto-upsert the user record so FK constraint is satisfied
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return Response.json({ error: 'User not found in Clerk' }, { status: 401 });
    }

    await query(
      `INSERT INTO users (clerk_id, name, email, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (clerk_id) DO UPDATE
         SET name       = EXCLUDED.name,
             avatar_url = EXCLUDED.avatar_url,
             updated_at = NOW()`,
      [
        userId,
        `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        clerkUser.emailAddresses[0]?.emailAddress ?? '',
        clerkUser.imageUrl ?? null,
      ]
    );

    // Fetch internal user id
    const userResult = await query<{ id: number }>(
      'SELECT id FROM users WHERE clerk_id = $1',
      [userId]
    );
    const ownerId = userResult.rows[0].id;

    // Parse & validate request body
    const body: CreateToolBody = await request.json();

    if (!body.name || !body.location || !body.pricePerDay || !body.categoryId) {
      return Response.json(
        { error: 'name, location, pricePerDay, and categoryId are required' },
        { status: 400 }
      );
    }

    if (body.pricePerDay <= 0) {
      return Response.json({ error: 'pricePerDay must be greater than 0' }, { status: 400 });
    }

    // Insert the new tool
    const insertResult = await query<DbToolWithRating>(
      `INSERT INTO tools
         (owner_id, category_id, name, description, location, price_per_day, condition, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        ownerId,
        body.categoryId,
        body.name,
        body.description ?? null,
        body.location,
        body.pricePerDay,
        body.condition ?? 'good',
        body.imageUrl ?? null,
      ]
    );

    return Response.json(insertResult.rows[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/tools]', err);
    return Response.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
