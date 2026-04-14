// =============================================================
// ToolVerse — PostgreSQL Connection Pool
// Uses the `pg` (node-postgres) library with a singleton Pool
// =============================================================

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ---------------------------------------------------------------
// Singleton Pool Instance
// The Pool manages multiple connections and reuses them efficiently.
// It is initialised once at module load and reused across all requests
// (Next.js module caching ensures a single Pool per process).
// ---------------------------------------------------------------

declare global {
  // Prevent multiple Pool instances during Next.js hot reload in dev
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      '[db] DATABASE_URL environment variable is not set.\n' +
      'Add it to your .env.local file:\n' +
      'DATABASE_URL=postgresql://user:password@localhost:5432/toolverse'
    );
  }

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,               // Maximum simultaneous connections in the pool
    idleTimeoutMillis: 30_000,   // Close idle connections after 30s
    connectionTimeoutMillis: 5_000, // Fail fast if DB is unreachable
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } // Required for hosted DBs (e.g. Supabase, Railway)
      : false,
  });
}

// Use global var in development to survive Next.js hot reloads
const pool: Pool =
  process.env.NODE_ENV === 'development'
    ? (global._pgPool ?? (global._pgPool = createPool()))
    : createPool();

// Log connection errors at the pool level (not per-query)
pool.on('error', (err) => {
  console.error('[db] Unexpected error on idle client:', err.message);
});

// ---------------------------------------------------------------
// query() — Execute a parameterised SQL query
//
// Usage:
//   const result = await query('SELECT * FROM tools WHERE id = $1', [42]);
//   const rows = result.rows;
// ---------------------------------------------------------------
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - start;
      console.log(`[db] query executed in ${duration}ms | rows: ${result.rowCount}`);
    }
    return result;
  } catch (err) {
    const error = err as Error;
    console.error('[db] Query error:', { text, error: error.message });
    throw err;
  }
}

// ---------------------------------------------------------------
// getClient() — Retrieve a dedicated client for transactions
//
// IMPORTANT: Always call client.release() in a finally block to
// return the client to the pool, even if an error occurs.
//
// Usage pattern (BEGIN / COMMIT / ROLLBACK):
//
//   const client = await getClient();
//   try {
//     await client.query('BEGIN');
//     await client.query('INSERT INTO ...', [...]);
//     await client.query('UPDATE  ...', [...]);
//     await client.query('COMMIT');
//   } catch (err) {
//     await client.query('ROLLBACK');
//     throw err;
//   } finally {
//     client.release();
//   }
// ---------------------------------------------------------------
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export default pool;
