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

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  console.log(`Running ${path.basename(filePath)}...`);
  await pool.query(sql);
}

async function main() {
  const schemaDir = path.join(__dirname, '../database/schema');
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await runSqlFile(path.join(schemaDir, file));
  }
  console.log('Migration complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
