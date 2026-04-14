// =============================================================
// GET    /api/tools/[id]  — Get a single tool by ID
// PUT    /api/tools/[id]  — Update a tool (owner only)
// DELETE /api/tools/[id]  — Delete a tool (owner only)
// =============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { query } from '@/lib/db';
import type { DbToolWithRating, UpdateToolBody } from '@/types';

// ---------------------------------------------------------------
// GET /api/tools/[id]
// ---------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise — must be awaited
    const { id } = await params;
    const toolId = parseInt(id);

    if (isNaN(toolId)) {
      return Response.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    const result = await query<DbToolWithRating>(
      `SELECT * FROM v_tools_with_rating WHERE id = $1`,
      [toolId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Tool not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('[GET /api/tools/[id]]', err);
    return Response.json({ error: 'Failed to fetch tool' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// PUT /api/tools/[id]  (Protected — owner only)
//
// Body (JSON): UpdateToolBody (all fields optional)
//   { name?, description?, location?, pricePerDay?,
//     condition?, imageUrl?, status? }
// ---------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const toolId = parseInt(id);
    if (isNaN(toolId)) {
      return Response.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    // Verify ownership: join tools → users to check clerk_id
    const ownerCheck = await query<{ id: number; owner_clerk_id: string }>(
      `SELECT t.id, u.clerk_id AS owner_clerk_id
       FROM tools t
       JOIN users u ON u.id = t.owner_id
       WHERE t.id = $1`,
      [toolId]
    );

    if (ownerCheck.rows.length === 0) {
      return Response.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].owner_clerk_id !== userId) {
      return Response.json({ error: 'Forbidden — you do not own this tool' }, { status: 403 });
    }

    // Parse body and build dynamic SET clause
    const body: UpdateToolBody = await request.json();

    // Map camelCase body keys → snake_case DB columns
    const fieldMap: Record<string, string> = {
      name:        'name',
      description: 'description',
      location:    'location',
      pricePerDay: 'price_per_day',
      condition:   'condition',
      imageUrl:    'image_url',
      status:      'status',
    };

    const setClauses: string[] = [];
    const values: unknown[]    = [];

    for (const [bodyKey, dbCol] of Object.entries(fieldMap)) {
      if (bodyKey in body && body[bodyKey as keyof UpdateToolBody] !== undefined) {
        values.push(body[bodyKey as keyof UpdateToolBody]);
        setClauses.push(`${dbCol} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(toolId);
    const sql = `
      UPDATE tools
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await query(sql, values);
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('[PUT /api/tools/[id]]', err);
    return Response.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// DELETE /api/tools/[id]  (Protected — owner only)
// ---------------------------------------------------------------
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const toolId = parseInt(id);
    if (isNaN(toolId)) {
      return Response.json({ error: 'Invalid tool ID' }, { status: 400 });
    }

    // Verify ownership before deleting
    const ownerCheck = await query<{ owner_clerk_id: string }>(
      `SELECT u.clerk_id AS owner_clerk_id
       FROM tools t
       JOIN users u ON u.id = t.owner_id
       WHERE t.id = $1`,
      [toolId]
    );

    if (ownerCheck.rows.length === 0) {
      return Response.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].owner_clerk_id !== userId) {
      return Response.json({ error: 'Forbidden — you do not own this tool' }, { status: 403 });
    }

    // Check for active bookings before deleting
    const activeBookings = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM bookings
       WHERE tool_id = $1 AND status IN ('pending', 'confirmed', 'active')`,
      [toolId]
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      return Response.json(
        { error: 'Cannot delete tool with active bookings' },
        { status: 409 }
      );
    }

    await query('DELETE FROM tools WHERE id = $1', [toolId]);
    return Response.json({ message: 'Tool deleted successfully' });
  } catch (err) {
    console.error('[DELETE /api/tools/[id]]', err);
    return Response.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
