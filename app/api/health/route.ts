// =============================================================
// GET /api/health — Database connectivity smoke test
// Hit this after migrating to Neon to confirm everything works.
// =============================================================

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Ask the DB for its version and current time
    const result = await query<{ version: string; now: string }>(
      'SELECT version(), NOW() AS now'
    );

    const { version, now } = result.rows[0];

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      server_time: now,
      postgres_version: version,
    });
  } catch (err) {
    const error = err as Error;
    console.error('[/api/health] DB connection failed:', error.message);

    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
        error: error.message,
      },
      { status: 503 }
    );
  }
}
