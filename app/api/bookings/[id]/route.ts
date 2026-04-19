// =============================================================
// PATCH /api/bookings/[id]  — Update booking status
//
// Owner  → can: confirmed, cancelled
// Borrower → can: cancelled (before confirmed), completed (when active)
// =============================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { getClient, query } from '@/lib/db';

const VALID_TRANSITIONS: Record<string, Record<string, string[]>> = {
  // role → current_status → allowed_new_statuses
  owner: {
    pending:   ['confirmed', 'cancelled'],
    confirmed: ['cancelled'],
    active:    ['completed'],
  },
  borrower: {
    pending:   ['cancelled'],
    confirmed: ['cancelled'],
    active:    ['completed'],
  },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorised' }, { status: 401 });

    const { id } = await params;
    const bookingId = parseInt(id);
    if (isNaN(bookingId)) return Response.json({ error: 'Invalid booking ID' }, { status: 400 });

    const body = await request.json() as { status: string };
    const newStatus = body.status;
    if (!newStatus) return Response.json({ error: 'status is required' }, { status: 400 });

    // Fetch booking with owner and borrower clerk IDs
    const result = await query<{
      id: number;
      tool_id: number;
      status: string;
      borrower_clerk_id: string;
      owner_clerk_id: string;
    }>(
      `SELECT b.id, b.tool_id, b.status,
              borrower.clerk_id AS borrower_clerk_id,
              owner.clerk_id    AS owner_clerk_id
       FROM bookings b
       JOIN users borrower ON borrower.id = b.borrower_id
       JOIN tools t         ON t.id = b.tool_id
       JOIN users owner     ON owner.id = t.owner_id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (result.rows.length === 0) return Response.json({ error: 'Booking not found' }, { status: 404 });

    const booking = result.rows[0];

    // Determine caller's role
    let role: 'owner' | 'borrower' | null = null;
    if (booking.owner_clerk_id    === userId) role = 'owner';
    if (booking.borrower_clerk_id === userId) role = 'borrower';
    if (!role) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Validate the transition
    const allowed = VALID_TRANSITIONS[role]?.[booking.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return Response.json(
        { error: `Cannot change status from '${booking.status}' to '${newStatus}' as ${role}` },
        { status: 422 }
      );
    }

    // Use a transaction so tool status is always consistent
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update booking status
      await client.query(
        `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, bookingId]
      );

      // Sync tool status based on new booking status
      let toolStatus: string | null = null;
      if (newStatus === 'confirmed') toolStatus = 'reserved';
      if (newStatus === 'active')    toolStatus = 'borrowed';
      if (newStatus === 'completed') toolStatus = 'available';
      if (newStatus === 'cancelled') toolStatus = 'available';

      if (toolStatus) {
        await client.query(
          `UPDATE tools SET status = $1, updated_at = NOW() WHERE id = $2`,
          [toolStatus, booking.tool_id]
        );
      }

      await client.query('COMMIT');
      return Response.json({ message: `Booking ${newStatus} successfully` });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[PATCH /api/bookings/[id]] Transaction failed:', err);
      return Response.json({ error: 'Status update failed' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[PATCH /api/bookings/[id]]', err);
    return Response.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
