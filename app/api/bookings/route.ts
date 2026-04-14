// =============================================================
// POST /api/bookings  — Create a booking (with full transaction)
// GET  /api/bookings  — List bookings for the authenticated user
// =============================================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { getClient, query } from '@/lib/db';
import type { CreateBookingBody, DbBooking } from '@/types';

// ---------------------------------------------------------------
// POST /api/bookings
//
// This is the most DBMS-critical endpoint:
//   1. BEGIN transaction
//   2. Lock the tool row (FOR UPDATE) to prevent race conditions
//   3. Validate tool exists and is 'available'
//   4. Validate date range (no overlapping bookings)
//   5. Calculate total price
//   6. INSERT booking record
//   7. UPDATE tool status → 'reserved'
//   8. COMMIT — or ROLLBACK on any failure
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // Ensure user exists in our DB (upsert)
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

  // Get borrower's internal DB id
  const borrowerResult = await query<{ id: number }>(
    'SELECT id FROM users WHERE clerk_id = $1',
    [userId]
  );
  const borrowerId = borrowerResult.rows[0].id;

  // Parse & validate request body
  let body: CreateBookingBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { toolId, startDate, endDate, notes } = body;

  if (!toolId || !startDate || !endDate) {
    return Response.json(
      { error: 'toolId, startDate, and endDate are required' },
      { status: 400 }
    );
  }

  // Basic date format validation
  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return Response.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
  }
  if (end <= start) {
    return Response.json({ error: 'endDate must be after startDate' }, { status: 400 });
  }
  if (start < new Date(new Date().toDateString())) {
    return Response.json({ error: 'startDate cannot be in the past' }, { status: 400 });
  }

  // ============================================================
  // TRANSACTION BLOCK
  // ============================================================
  const client = await getClient();
  try {
    // ----- Step 1: BEGIN ----------------------------------------
    await client.query('BEGIN');

    // ----- Step 2: Lock the tool row (FOR UPDATE) ---------------
    // SELECT ... FOR UPDATE places an exclusive lock on the tool row.
    // This prevents two concurrent requests from booking the same tool
    // simultaneously (prevents race condition / phantom reads).
    const toolResult = await client.query<{
      id: number;
      owner_id: number;
      status: string;
      price_per_day: string;
    }>(
      `SELECT id, owner_id, status, price_per_day
       FROM tools
       WHERE id = $1
       FOR UPDATE`,  // <-- Row-level lock
      [toolId]
    );

    // ----- Step 3: Validate tool --------------------------------
    if (toolResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return Response.json({ error: 'Tool not found' }, { status: 404 });
    }

    const tool = toolResult.rows[0];

    if (tool.status !== 'available') {
      await client.query('ROLLBACK');
      return Response.json(
        { error: `Tool is not available. Current status: ${tool.status}` },
        { status: 409 }
      );
    }

    if (tool.owner_id === borrowerId) {
      await client.query('ROLLBACK');
      return Response.json({ error: 'You cannot book your own tool' }, { status: 400 });
    }

    // ----- Step 4: Check for overlapping bookings ---------------
    // Overlap condition: existing booking [A,B] overlaps new booking [S,E] when:
    //   A < E  (existing starts before new end)
    //   B > S  (existing ends after new start)
    // This correctly flags ALL overlapping ranges.
    const overlapResult = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM bookings
       WHERE tool_id    = $1
         AND status     IN ('pending', 'confirmed', 'active')
         AND start_date < $3::date
         AND end_date   > $2::date`,
      [toolId, startDate, endDate]
    );

    if (parseInt(overlapResult.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return Response.json(
        { error: 'Tool is already booked for the selected dates' },
        { status: 409 }
      );
    }

    // ----- Step 5: Calculate total price ------------------------
    // Duration in days (exclusive end date convention)
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const pricePerDay = parseFloat(tool.price_per_day);
    const totalPrice  = +(days * pricePerDay).toFixed(2);

    // ----- Step 6: INSERT booking -------------------------------
    const bookingResult = await client.query<DbBooking>(
      `INSERT INTO bookings
         (tool_id, borrower_id, start_date, end_date, total_price, status, notes)
       VALUES ($1, $2, $3::date, $4::date, $5, 'pending', $6)
       RETURNING *`,
      [toolId, borrowerId, startDate, endDate, totalPrice, notes ?? null]
    );

    const booking = bookingResult.rows[0];

    // ----- Step 7: UPDATE tool status → 'reserved' -------------
    await client.query(
      `UPDATE tools
       SET status     = 'reserved',
           updated_at = NOW()
       WHERE id = $1`,
      [toolId]
    );

    // ----- Step 8: COMMIT ---------------------------------------
    await client.query('COMMIT');

    return Response.json(
      {
        message: 'Booking created successfully',
        booking: {
          id:         booking.id,
          toolId:     booking.tool_id,
          borrowerId: booking.borrower_id,
          startDate:  startDate,
          endDate:    endDate,
          totalPrice: booking.total_price,
          days,
          status:     booking.status,
          notes:      booking.notes,
          createdAt:  booking.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // ----- ROLLBACK on any error --------------------------------
    await client.query('ROLLBACK');
    console.error('[POST /api/bookings] Transaction failed, rolled back:', err);
    return Response.json({ error: 'Booking failed. Transaction rolled back.' }, { status: 500 });
  } finally {
    // ALWAYS release the client back to the pool
    client.release();
  }
}

// ---------------------------------------------------------------
// GET /api/bookings
//
// Returns bookings for the authenticated user.
// Query params:
//   role — "borrower" (default) | "owner"
//           borrower → bookings I made
//           owner    → bookings on tools I own
// ---------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const role = request.nextUrl.searchParams.get('role') ?? 'borrower';

    // Fetch bookings with joined tool and user information
    // Covers both: "My bookings as borrower" and "Bookings on my tools as owner"
    const result = await query<{
      id: number;
      tool_id: number;
      tool_name: string;
      tool_location: string;
      tool_image_url: string | null;
      borrower_id: number;
      borrower_name: string;
      owner_name: string;
      start_date: Date;
      end_date: Date;
      total_price: string;
      status: string;
      notes: string | null;
      created_at: Date;
    }>(
      `SELECT
         b.id,
         b.tool_id,
         t.name          AS tool_name,
         t.location      AS tool_location,
         t.image_url     AS tool_image_url,
         b.borrower_id,
         borrower.name   AS borrower_name,
         owner.name      AS owner_name,
         b.start_date,
         b.end_date,
         b.total_price,
         b.status,
         b.notes,
         b.created_at
       FROM bookings b
       JOIN tools t          ON t.id = b.tool_id
       JOIN users borrower   ON borrower.id = b.borrower_id
       JOIN users owner      ON owner.id    = t.owner_id
       WHERE ${role === 'owner' ? 'owner.clerk_id' : 'borrower.clerk_id'} = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return Response.json({ bookings: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('[GET /api/bookings]', err);
    return Response.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
