// =============================================================
// POST /api/users/sync  — Upsert Clerk user into PostgreSQL
//
// Call this from client-side after successful Clerk sign-in,
// or use a Clerk webhook for server-side sync.
//
// This ensures every authenticated user has a matching row in
// the `users` table before any tool or booking operations.
// =============================================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { query } from '@/lib/db';
import type { DbUser } from '@/types';

export async function POST(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return Response.json({ error: 'Could not fetch Clerk user' }, { status: 400 });
    }

    const name      = `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim();
    const email     = clerkUser.emailAddresses[0]?.emailAddress ?? '';
    const phone     = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;
    const avatarUrl = clerkUser.imageUrl ?? null;

    // UPSERT: Insert user record; on duplicate clerk_id, update mutable fields
    // This is idempotent — safe to call on every login
    const result = await query<DbUser>(
      `INSERT INTO users (clerk_id, name, email, phone, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (clerk_id) DO UPDATE
         SET name       = EXCLUDED.name,
             email      = EXCLUDED.email,
             phone      = COALESCE(EXCLUDED.phone, users.phone),
             avatar_url = EXCLUDED.avatar_url,
             updated_at = NOW()
       RETURNING *`,
      [userId, name, email, phone, avatarUrl]
    );

    const user = result.rows[0];

    return Response.json({
      message: 'User synced successfully',
      user: {
        id:        user.id,
        clerkId:   user.clerk_id,
        name:      user.name,
        email:     user.email,
        phone:     user.phone,
        location:  user.location,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('[POST /api/users/sync]', err);
    return Response.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}

// ---------------------------------------------------------------
// GET /api/users/sync  — Fetch current user's profile from DB
// ---------------------------------------------------------------
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const result = await query<DbUser>(
      'SELECT * FROM users WHERE clerk_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found in database. Please sync first.' }, { status: 404 });
    }

    const user = result.rows[0];
    return Response.json({
      id:        user.id,
      clerkId:   user.clerk_id,
      name:      user.name,
      email:     user.email,
      phone:     user.phone,
      location:  user.location,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error('[GET /api/users/sync]', err);
    return Response.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
