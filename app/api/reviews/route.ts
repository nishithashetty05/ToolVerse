// =============================================================
// POST /api/reviews  — Submit a review for a completed booking
// =============================================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorised' }, { status: 401 });

    const clerkUser = await currentUser();
    if (!clerkUser) return Response.json({ error: 'User not found' }, { status: 401 });

    // Ensure user exists
    await query(
      `INSERT INTO users (clerk_id, name, email, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (clerk_id) DO UPDATE
         SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, updated_at = NOW()`,
      [
        userId,
        `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim(),
        clerkUser.emailAddresses[0]?.emailAddress ?? '',
        clerkUser.imageUrl ?? null,
      ]
    );

    const userResult = await query<{ id: number }>('SELECT id FROM users WHERE clerk_id = $1', [userId]);
    const reviewerId = userResult.rows[0].id;

    const body = await request.json() as { bookingId: number; rating: number; comment?: string };
    const { bookingId, rating, comment } = body;

    if (!bookingId || !rating) {
      return Response.json({ error: 'bookingId and rating are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify the booking belongs to this reviewer and is completed
    const bookingResult = await query<{
      id: number;
      tool_id: number;
      borrower_id: number;
      status: string;
      borrower_clerk_id: string;
    }>(
      `SELECT b.id, b.tool_id, b.borrower_id, b.status, u.clerk_id AS borrower_clerk_id
       FROM bookings b JOIN users u ON u.id = b.borrower_id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingResult.rows[0];

    if (booking.borrower_clerk_id !== userId) {
      return Response.json({ error: 'You can only review your own bookings' }, { status: 403 });
    }

    if (booking.status !== 'completed') {
      return Response.json({ error: 'You can only review completed bookings' }, { status: 422 });
    }

    // Check for duplicate review
    const existing = await query<{ id: number }>(
      'SELECT id FROM reviews WHERE booking_id = $1',
      [bookingId]
    );
    if (existing.rows.length > 0) {
      return Response.json({ error: 'You have already reviewed this booking' }, { status: 409 });
    }

    const result = await query(
      `INSERT INTO reviews (booking_id, reviewer_id, tool_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [bookingId, reviewerId, booking.tool_id, rating, comment ?? null]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[POST /api/reviews]', err);
    return Response.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
