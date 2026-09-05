import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL belum diset. Isi file .env berdasarkan .env.example lalu restart server."
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Jalankan query sederhana. */
export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Jalankan beberapa query dalam satu database transaction.
 * `fn` menerima `client` dan harus memakai client.query(...).
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
