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

const TEAMS = [
  { name: 'Valsad Warriors', code: 'VWA', short: 'Warriors', legacyCode: 'KST' },
  { name: 'Omisol Champions', code: 'OCH', short: 'Champions', legacyCode: 'PWA' },
  { name: 'Super Strikers', code: 'SST', short: 'Strikers', legacyCode: 'LGL' },
  { name: 'Friends Cricketers', code: 'FRC', short: 'Cricketers', legacyCode: 'CCH' },
  { name: 'Mahakali Tigers', code: 'MTK', short: 'Tigers', legacyCode: null },
  { name: 'Fearless Falcons', code: 'FFC', short: 'Falcons', legacyCode: null },
];

const SEASON4_STANDINGS = [
  { code: 'OCH', played: 10, won: 8, lost: 2, pts: 16, nrr: 1.456 },
  { code: 'VWA', played: 10, won: 7, lost: 3, pts: 14, nrr: 0.982 },
  { code: 'MTK', played: 10, won: 6, lost: 4, pts: 12, nrr: 0.334 },
  { code: 'SST', played: 10, won: 5, lost: 5, pts: 10, nrr: -0.12 },
  { code: 'FFC', played: 10, won: 4, lost: 6, pts: 8, nrr: -0.678 },
  { code: 'FRC', played: 10, won: 3, lost: 7, pts: 6, nrr: -1.245 },
];

async function upsertTeams(client) {
  for (const team of TEAMS) {
    if (team.legacyCode) {
      const updated = await client.query(
        `UPDATE teams
         SET team_name = $1, team_code = $2, short_name = $3, is_active = TRUE
         WHERE team_code = $4
         RETURNING team_id`,
        [team.name, team.code, team.short, team.legacyCode]
      );
      if (updated.rowCount > 0) continue;
    }

    await client.query(
      `INSERT INTO teams (team_name, team_code, short_name, is_active)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (team_name) DO UPDATE
       SET team_code = EXCLUDED.team_code,
           short_name = EXCLUDED.short_name,
           is_active = TRUE`,
      [team.name, team.code, team.short]
    );
  }

  const codes = TEAMS.map((t) => t.code);
  await client.query(
    `UPDATE teams SET is_active = FALSE WHERE team_code IS NOT NULL AND NOT (team_code = ANY($1::text[]))`,
    [codes]
  );
}

async function upsertSeason4(client) {
  await client.query(
    `INSERT INTO seasons (tournament_id, season_name, season_year, start_date, end_date, status)
     SELECT tournament_id, 'KPL Season 4', 4, '2025-11-01', '2026-02-28', 'ONGOING'
     FROM tournaments WHERE tournament_code = 'KPL'
     ON CONFLICT (tournament_id, season_year) DO UPDATE
     SET season_name = EXCLUDED.season_name,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         status = EXCLUDED.status`
  );
}

async function upsertSeason4Standings(client) {
  const { rows } = await client.query(
    `SELECT season_id FROM seasons s
     JOIN tournaments t ON t.tournament_id = s.tournament_id
     WHERE t.tournament_code = 'KPL' AND s.season_year = 4
     LIMIT 1`
  );
  if (rows.length === 0) {
    throw new Error('Season 4 not found after insert');
  }
  const seasonId = rows[0].season_id;

  for (const row of SEASON4_STANDINGS) {
    await client.query(
      `INSERT INTO points_table (season_id, team_id, matches_played, matches_won, matches_lost, points, net_run_rate)
       SELECT $1, t.team_id, $3, $4, $5, $6, $7
       FROM teams t WHERE t.team_code = $2
       ON CONFLICT (season_id, team_id) DO UPDATE
       SET matches_played = EXCLUDED.matches_played,
           matches_won = EXCLUDED.matches_won,
           matches_lost = EXCLUDED.matches_lost,
           points = EXCLUDED.points,
           net_run_rate = EXCLUDED.net_run_rate`,
      [seasonId, row.code, row.played, row.won, row.lost, row.pts, row.nrr]
    );
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await upsertTeams(client);
    await upsertSeason4(client);
    await upsertSeason4Standings(client);
    await client.query('COMMIT');
    console.log('Teams and Season 4 standings applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Apply failed:', err.message);
  process.exit(1);
});
