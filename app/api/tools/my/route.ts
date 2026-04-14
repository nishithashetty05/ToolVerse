// =============================================================
// GET /api/tools/my  — List tools owned by the authenticated user
// =============================================================
// This is a separate route (not /api/tools?owner=me) to keep the
// general tools endpoint clean and this query optimised with
// the idx_tools_owner_id index.
// =============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { query } from '@/lib/db';
import type { DbToolWithRating, ToolResponse } from '@/types';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Fetch all tools where the owner's clerk_id matches the authenticated user.
    // Uses v_tools_with_rating view so we get rating/review data too.
    // The idx_tools_owner_id index on tools.owner_id speeds up this join.
    const result = await query<DbToolWithRating>(
      `SELECT v.*
       FROM v_tools_with_rating v
       WHERE v.owner_clerk_id = $1
       ORDER BY v.created_at DESC`,
      [userId]
    );

    const tools: ToolResponse[] = result.rows.map((row) => ({
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
    }));

    return Response.json({ tools, total: tools.length });
  } catch (err) {
    console.error('[GET /api/tools/my]', err);
    return Response.json({ error: 'Failed to fetch your tools' }, { status: 500 });
  }
}
