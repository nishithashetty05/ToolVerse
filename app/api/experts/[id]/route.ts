// =============================================================
// GET    /api/experts/[id]  — Get a single expert
// PUT    /api/experts/[id]  — Update expert profile (owner only)
// DELETE /api/experts/[id]  — Remove expert profile (owner only)
// =============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { query } from '@/lib/db';
import type { DbExpert, UpdateExpertBody } from '@/types';

// ---------------------------------------------------------------
// GET /api/experts/[id]
// ---------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expertId = parseInt(id);

    if (isNaN(expertId)) {
      return Response.json({ error: 'Invalid expert ID' }, { status: 400 });
    }

    const result = await query<DbExpert>(
      `SELECT e.* FROM experts e WHERE e.id = $1`,
      [expertId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Expert not found' }, { status: 404 });
    }

    const row = result.rows[0];
    return Response.json({
      id:         row.id,
      userId:     row.user_id,
      name:       row.name,
      specialty:  row.specialty,
      bio:        row.bio,
      location:   row.location,
      phone:      row.phone,
      email:      row.email,
      avatarUrl:  row.avatar_url,
      yearsExp:   row.years_exp,
      ratePerDay: parseFloat(row.rate_per_day) || 0,
      available:  row.available,
      createdAt:  row.created_at.toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/experts/[id]]', err);
    return Response.json({ error: 'Failed to fetch expert' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// PUT /api/experts/[id]  (Protected — profile owner only)
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
    const expertId = parseInt(id);
    if (isNaN(expertId)) {
      return Response.json({ error: 'Invalid expert ID' }, { status: 400 });
    }

    // Verify ownership via clerk_id → users → experts
    const ownerCheck = await query<{ user_clerk_id: string }>(
      `SELECT u.clerk_id AS user_clerk_id
       FROM experts e
       JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [expertId]
    );

    if (ownerCheck.rows.length === 0) {
      return Response.json({ error: 'Expert not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_clerk_id !== userId) {
      return Response.json({ error: 'Forbidden — you do not own this profile' }, { status: 403 });
    }

    const body: UpdateExpertBody = await request.json();

    const fieldMap: Record<string, string> = {
      name:       'name',
      specialty:  'specialty',
      bio:        'bio',
      location:   'location',
      phone:      'phone',
      email:      'email',
      avatarUrl:  'avatar_url',
      yearsExp:   'years_exp',
      ratePerDay: 'rate_per_day',
      available:  'available',
    };

    const setClauses: string[] = [];
    const values: unknown[]    = [];

    for (const [bodyKey, dbCol] of Object.entries(fieldMap)) {
      if (bodyKey in body && body[bodyKey as keyof UpdateExpertBody] !== undefined) {
        values.push(body[bodyKey as keyof UpdateExpertBody]);
        setClauses.push(`${dbCol} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(expertId);
    const sql = `
      UPDATE experts
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await query<DbExpert>(sql, values);
    const row = result.rows[0];
    return Response.json({
      id:         row.id,
      userId:     row.user_id,
      name:       row.name,
      specialty:  row.specialty,
      bio:        row.bio,
      location:   row.location,
      phone:      row.phone,
      email:      row.email,
      avatarUrl:  row.avatar_url,
      yearsExp:   row.years_exp,
      ratePerDay: parseFloat(row.rate_per_day) || 0,
      available:  row.available,
      createdAt:  row.created_at.toISOString(),
    });
  } catch (err) {
    console.error('[PUT /api/experts/[id]]', err);
    return Response.json({ error: 'Failed to update expert' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// DELETE /api/experts/[id]  (Protected — profile owner only)
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
    const expertId = parseInt(id);
    if (isNaN(expertId)) {
      return Response.json({ error: 'Invalid expert ID' }, { status: 400 });
    }

    const ownerCheck = await query<{ user_clerk_id: string }>(
      `SELECT u.clerk_id AS user_clerk_id
       FROM experts e
       JOIN users u ON u.id = e.user_id
       WHERE e.id = $1`,
      [expertId]
    );

    if (ownerCheck.rows.length === 0) {
      return Response.json({ error: 'Expert not found' }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_clerk_id !== userId) {
      return Response.json({ error: 'Forbidden — you do not own this profile' }, { status: 403 });
    }

    await query('DELETE FROM experts WHERE id = $1', [expertId]);
    return Response.json({ message: 'Expert profile deleted' });
  } catch (err) {
    console.error('[DELETE /api/experts/[id]]', err);
    return Response.json({ error: 'Failed to delete expert' }, { status: 500 });
  }
}
