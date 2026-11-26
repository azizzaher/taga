import pg from 'pg';
import { config } from './config.js';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 1, // serverless: one connection per function instance
});

export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Safe profile columns only. Numbers are cast so JSON gets numbers, not strings.
export const PROFILE_FIELDS = `
  id, full_name,
  TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
  height_cm::float8 AS height_cm,
  weight_kg::float8 AS weight_kg,
  gender, activity_level, fitness_goal`;

export async function getProfileForUser(userId) {
  const { rows } = await pool.query(
    `SELECT ${PROFILE_FIELDS} FROM public.profiles WHERE auth_user_id = $1`,
    [userId]
  );
  return rows[0] ?? null;
}
