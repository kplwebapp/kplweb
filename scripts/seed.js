const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'kpl_db',
  user: process.env.DB_USER || 'kpl_user',
  password: process.env.DB_PASSWORD || '',
});

async function main() {
  const seedDir = path.join(__dirname, '../database/seeds');
  const files = fs.readdirSync(seedDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedDir, file), 'utf8');
    console.log(`Seeding ${file}...`);
    await pool.query(sql);
  }
  console.log('Seed complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
