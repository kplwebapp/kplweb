/**
 * Remove all registered members from the database.
 * Keeps the default admin account (admin@kpl.local).
 * Usage: node scripts/clear-members.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'kpl_db',
  user: process.env.DB_USER || 'kpl_user',
  password: process.env.DB_PASSWORD || '',
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const before = await client.query('SELECT COUNT(*)::int AS count FROM users');
    const deleted = await client.query(
      "DELETE FROM users WHERE email <> 'admin@kpl.local' RETURNING user_id"
    );
    const after = await client.query('SELECT COUNT(*)::int AS count FROM users');

    await client.query('COMMIT');

    console.log(`Users before: ${before.rows[0].count}`);
    console.log(`Removed members: ${deleted.rowCount}`);
    console.log(`Users remaining: ${after.rows[0].count}`);
    console.log('Registered members cleared. Admin account preserved.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Clear members failed:', err.message);
  process.exit(1);
});
