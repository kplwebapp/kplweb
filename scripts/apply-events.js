/**
 * Apply the events/tournaments schema (tables, categories, permissions, tournament details) to an existing database.
 * Safe to run more than once.
 * Usage: node scripts/apply-events.js
 */
const fs = require('fs');
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

const FILES = [
  '009_events.sql',
  '010_categories_and_archive.sql',
  '011_tournament_details.sql',
  '012_team_categories.sql',
];

async function main() {
  for (const file of FILES) {
    const sql = fs.readFileSync(path.join(__dirname, '../database/schema', file), 'utf8');
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }
  await pool.end();
}

main().catch((err) => {
  console.error('Events apply failed:', err.message);
  process.exit(1);
});
