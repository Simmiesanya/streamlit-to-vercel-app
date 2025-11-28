import { Pool } from "pg"
import { attachDatabasePool } from "@vercel/functions"

// Optimized for Vercel Functions with connection pooling
const pool = new Pool({
  connectionString: process.env.GCP_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
})

// Attach pool for Vercel's connection management
attachDatabasePool(pool)

export async function query(sql: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(sql, params)
    return result.rows
  } finally {
    client.release()
  }
}
