// =============================================================
// GET /api/reviews/[toolId]  — Fetch all reviews for a tool
// =============================================================

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const id = parseInt(toolId);
    if (isNaN(id)) return Response.json({ error: 'Invalid tool ID' }, { status: 400 });

    const result = await query<{
      id: number;
      booking_id: number;
      reviewer_name: string;
      reviewer_avatar: string | null;
      tool_id: number;
      rating: number;
      comment: string | null;
      created_at: Date;
    }>(
      `SELECT
         r.id,
         r.booking_id,
         u.name        AS reviewer_name,
         u.avatar_url  AS reviewer_avatar,
         r.tool_id,
         r.rating,
         r.comment,
         r.created_at
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       WHERE r.tool_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    const avgRating =
      result.rows.length > 0
        ? result.rows.reduce((sum, r) => sum + r.rating, 0) / result.rows.length
        : 0;

    return Response.json({
      reviews: result.rows,
      total: result.rows.length,
      avgRating: parseFloat(avgRating.toFixed(1)),
    });
  } catch (err) {
    console.error('[GET /api/reviews/[toolId]]', err);
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
