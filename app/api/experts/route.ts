// =============================================================
// GET  /api/experts  — List experts (search, filter, paginate)
// POST /api/experts  — Register as an expert (auth required)
// =============================================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { query } from '@/lib/db';
import type { DbExpert, ExpertResponse, CreateExpertBody } from '@/types';

// ---------------------------------------------------------------
// Helper: map DB row → API response
// ---------------------------------------------------------------
function mapExpert(row: DbExpert): ExpertResponse {
  return {
    id:          row.id,
    userId:      row.user_id,
    name:        row.name,
    specialty:   row.specialty,
    bio:         row.bio,
    location:    row.location,
    phone:       row.phone,
    email:       row.email,
    avatarUrl:   row.avatar_url,
    yearsExp:    row.years_exp,
    ratePerDay:  parseFloat(row.rate_per_day) || 0,
    available:   row.available,
    createdAt:   row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------
// GET /api/experts
//
// Query params:
//   search    — ILIKE match on name, specialty, or location
//   available — "true" | "false"
//   specialty — exact specialty filter
//   page      — page number (default 1)
//   limit     — items per page (default 12, max 50)
// ---------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search    = searchParams.get('search')    ?? '';
    const available = searchParams.get('available') ?? '';
    const specialty = searchParams.get('specialty') ?? '';
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit     = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '12')));
    const offset    = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[]    = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(
        `(e.name ILIKE $${params.length} OR e.specialty ILIKE $${params.length} OR e.location ILIKE $${params.length})`
      );
    }

    if (available === 'true') {
      conditions.push(`e.available = true`);
    } else if (available === 'false') {
      conditions.push(`e.available = false`);
    }

    if (specialty) {
      params.push(specialty);
      conditions.push(`e.specialty = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const sql = `
      SELECT
        e.*,
        COUNT(*) OVER() AS total_count
      FROM experts e
      ${where}
      ORDER BY e.available DESC, e.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const result = await query<DbExpert & { total_count: string }>(sql, params);

    const total      = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
    const experts    = result.rows.map(mapExpert);
    const totalPages = Math.ceil(total / limit);

    return Response.json({ experts, total, page, limit, totalPages });
  } catch (err) {
    console.error('[GET /api/experts]', err);
    return Response.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// POST /api/experts  (Protected — Clerk auth required)
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Auto-upsert user record
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

    const userResult = await query<{ id: number }>(
      'SELECT id FROM users WHERE clerk_id = $1',
      [userId]
    );
    const internalUserId = userResult.rows[0].id;

    const body: CreateExpertBody = await request.json();

    if (!body.name || !body.specialty || !body.location || !body.ratePerDay) {
      return Response.json(
        { error: 'name, specialty, location, and ratePerDay are required' },
        { status: 400 }
      );
    }

    if (body.ratePerDay <= 0) {
      return Response.json({ error: 'ratePerDay must be greater than 0' }, { status: 400 });
    }

    const result = await query<DbExpert>(
      `INSERT INTO experts
         (user_id, name, specialty, bio, location, phone, email, avatar_url, years_exp, rate_per_day)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        internalUserId,
        body.name,
        body.specialty,
        body.bio         ?? null,
        body.location,
        body.phone       ?? null,
        body.email       ?? null,
        body.avatarUrl   ?? clerkUser.imageUrl ?? null,
        body.yearsExp    ?? null,
        body.ratePerDay,
      ]
    );

    return Response.json(mapExpert(result.rows[0]), { status: 201 });
  } catch (err) {
    console.error('[POST /api/experts]', err);
    return Response.json({ error: 'Failed to register expert' }, { status: 500 });
  }
}
