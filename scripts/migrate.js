/**
 * Applies database/schema/*.sql in filename order, each file once, each in its own transaction.
 * Applied files are recorded in schema_migrations.
 *
 *   node scripts/migrate.js                 apply pending migrations
 *   node scripts/migrate.js --status        list applied and pending migrations; changes nothing
 *   node scripts/migrate.js --baseline=012  record 001…012 as applied without running them
 *                                           (once, for databases created before migrations were tracked)
 *
 * Any database other than localhost also needs --confirm=<database name> to apply or baseline.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env'), quiet: true });

const SCHEMA_DIR = path.join(__dirname, '../database/schema');
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'kpl_db',
  user: process.env.DB_USER || 'kpl_user',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
};

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = true] = arg.replace(/^--/, '').split('=');
    return [key, value];
  })
);

const fileNumber = (file) => file.split('_')[0];
const checksum = (sql) => crypto.createHash('sha256').update(sql).digest('hex');

function readMigrations() {
  return fs
    .readdirSync(SCHEMA_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => {
      const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), 'utf8');
      return { file, sql, checksum: checksum(sql) };
    });
}

async function main() {
  const pool = new Pool(config);
  const target = `${config.database} on ${config.host}:${config.port}`;
  const isLocal = LOCAL_HOSTS.includes(config.host);

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename    VARCHAR(200) PRIMARY KEY,
        checksum    CHAR(64) NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        baselined   BOOLEAN NOT NULL DEFAULT FALSE
      )`);

    const migrations = readMigrations();
    const { rows } = await pool.query('SELECT filename, checksum, baselined FROM schema_migrations');
    const applied = new Map(rows.map((r) => [r.filename, r]));

    for (const m of migrations) {
      const record = applied.get(m.file);
      if (record && !record.baselined && record.checksum !== m.checksum) {
        console.warn(`Warning: ${m.file} has changed since it was applied.`);
      }
    }

    const pending = migrations.filter((m) => !applied.has(m.file));

    if (args.status) {
      console.log(`Database: ${target}`);
      for (const m of migrations) {
        const record = applied.get(m.file);
        console.log(`  ${record ? (record.baselined ? 'baselined' : 'applied  ') : 'PENDING  '}  ${m.file}`);
      }
      return;
    }

    if (!isLocal && args.confirm !== config.database) {
      throw new Error(`${target} is not a local database. Re-run with --confirm=${config.database} to continue.`);
    }

    if (args.baseline) {
      const upTo = String(args.baseline);
      if (!migrations.some((m) => fileNumber(m.file) === upTo)) {
        throw new Error(`No migration numbered ${upTo} in database/schema.`);
      }
      const toRecord = migrations.filter((m) => fileNumber(m.file) <= upTo && !applied.has(m.file));
      for (const m of toRecord) {
        await pool.query(
          'INSERT INTO schema_migrations (filename, checksum, baselined) VALUES ($1, $2, TRUE)',
          [m.file, m.checksum]
        );
        console.log(`Baselined ${m.file} (not run)`);
      }
      console.log(`Baseline complete for ${target}.`);
      return;
    }

    if (applied.size === 0) {
      const { rows: existing } = await pool.query("SELECT to_regclass('public.users') AS users");
      if (existing[0].users) {
        throw new Error(
          `${target} already has tables but no migration history. ` +
            'Record the migrations it already has with --baseline=<last applied number> first.'
        );
      }
    }

    if (pending.length === 0) {
      console.log(`Nothing to apply; ${target} is up to date.`);
      return;
    }

    for (const m of pending) {
      const client = await pool.connect();
      try {
        console.log(`Applying ${m.file}...`);
        await client.query('BEGIN');
        await client.query(m.sql);
        await client.query('INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)', [
          m.file,
          m.checksum,
        ]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`${m.file} failed and was rolled back: ${err.message}`);
      } finally {
        client.release();
      }
    }
    console.log(`Migration complete for ${target}.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
