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

const SEASONS = [
  { name: 'KPL Season 1', year: 2023, start: '2023-01-15', end: '2023-04-30', status: 'COMPLETED' },
  { name: 'KPL Season 2', year: 2024, start: '2024-01-15', end: '2024-04-30', status: 'COMPLETED' },
  { name: 'KPL Season 3', year: 2025, start: '2025-03-01', end: '2025-06-30', status: 'COMPLETED' },
  { name: 'KPL Season 4', year: 2026, start: '2025-11-01', end: '2026-02-28', status: 'ONGOING' },
];

const STANDINGS = {
  2023: [
    { code: 'VWA', played: 8, won: 6, lost: 2, tied: 0, nr: 0, pts: 12, nrr: 1.12 },
    { code: 'OCH', played: 8, won: 5, lost: 3, tied: 0, nr: 0, pts: 10, nrr: 0.54 },
    { code: 'MTK', played: 8, won: 4, lost: 4, tied: 0, nr: 0, pts: 8, nrr: 0.21 },
    { code: 'SST', played: 8, won: 3, lost: 5, tied: 0, nr: 0, pts: 6, nrr: -0.32 },
    { code: 'FFC', played: 8, won: 3, lost: 5, tied: 0, nr: 0, pts: 6, nrr: -0.45 },
    { code: 'FRC', played: 8, won: 2, lost: 6, tied: 0, nr: 0, pts: 4, nrr: -1.1 },
  ],
  2024: [
    { code: 'OCH', played: 10, won: 7, lost: 3, tied: 0, nr: 0, pts: 14, nrr: 1.23 },
    { code: 'VWA', played: 10, won: 6, lost: 4, tied: 0, nr: 0, pts: 12, nrr: 0.87 },
    { code: 'FFC', played: 10, won: 6, lost: 4, tied: 0, nr: 0, pts: 12, nrr: 0.41 },
    { code: 'MTK', played: 10, won: 5, lost: 5, tied: 0, nr: 0, pts: 10, nrr: -0.08 },
    { code: 'SST', played: 10, won: 4, lost: 6, tied: 0, nr: 0, pts: 8, nrr: -0.56 },
    { code: 'FRC', played: 10, won: 3, lost: 7, tied: 0, nr: 0, pts: 6, nrr: -1.02 },
  ],
  2025: [
    { code: 'VWA', played: 8, won: 7, lost: 1, tied: 0, nr: 0, pts: 14, nrr: 1.82 },
    { code: 'OCH', played: 8, won: 5, lost: 3, tied: 0, nr: 0, pts: 10, nrr: 0.65 },
    { code: 'FRC', played: 8, won: 4, lost: 4, tied: 0, nr: 0, pts: 8, nrr: -0.11 },
    { code: 'SST', played: 8, won: 2, lost: 6, tied: 0, nr: 0, pts: 4, nrr: -1.34 },
    { code: 'MTK', played: 8, won: 3, lost: 5, tied: 0, nr: 0, pts: 6, nrr: -0.54 },
    { code: 'FFC', played: 8, won: 4, lost: 4, tied: 0, nr: 0, pts: 8, nrr: 0.12 },
  ],
  2026: [
    { code: 'OCH', played: 4, won: 3, lost: 1, tied: 0, nr: 0, pts: 6, nrr: 1.12 },
    { code: 'VWA', played: 4, won: 3, lost: 1, tied: 0, nr: 0, pts: 6, nrr: 0.78 },
    { code: 'MTK', played: 4, won: 2, lost: 2, tied: 0, nr: 0, pts: 4, nrr: 0.15 },
    { code: 'SST', played: 3, won: 1, lost: 2, tied: 0, nr: 0, pts: 2, nrr: -0.34 },
    { code: 'FFC', played: 3, won: 1, lost: 2, tied: 0, nr: 0, pts: 2, nrr: -0.52 },
    { code: 'FRC', played: 3, won: 0, lost: 3, tied: 0, nr: 0, pts: 0, nrr: -1.45 },
  ],
};

async function migrateLegacySeasons(client) {
  const { rows: legacy } = await client.query(
    `SELECT s.season_id, s.season_year
     FROM seasons s
     JOIN tournaments t ON t.tournament_id = s.tournament_id
     WHERE t.tournament_code = 'KPL' AND s.season_year IN (4)`
  );

  const { rows: modern } = await client.query(
    `SELECT s.season_id, s.season_year
     FROM seasons s
     JOIN tournaments t ON t.tournament_id = s.tournament_id
     WHERE t.tournament_code = 'KPL' AND s.season_year = 2026`
  );

  if (legacy.length && modern.length) {
    const legacyId = legacy[0].season_id;
    const modernId = modern[0].season_id;
    await client.query('DELETE FROM points_table WHERE season_id = $1', [legacyId]);
    await client.query('DELETE FROM matches WHERE season_id = $1', [legacyId]);
    await client.query('DELETE FROM seasons WHERE season_id = $1', [legacyId]);
    await client.query(
      `UPDATE seasons SET season_name = 'KPL Season 4', status = 'ONGOING'
       WHERE season_id = $1`,
      [modernId]
    );
  } else if (legacy.length && !modern.length) {
    await client.query(
      `UPDATE seasons SET season_year = 2026, season_name = 'KPL Season 4',
              start_date = '2025-11-01', end_date = '2026-02-28', status = 'ONGOING'
       WHERE season_id = $1`,
      [legacy[0].season_id]
    );
  }

  await client.query(
    `UPDATE seasons s SET season_name = 'KPL Season 3'
     FROM tournaments t
     WHERE s.tournament_id = t.tournament_id
       AND t.tournament_code = 'KPL'
       AND s.season_year = 2025
       AND s.season_name ILIKE '%2025%'`
  );
}

async function upsertSeasons(client) {
  for (const season of SEASONS) {
    await client.query(
      `INSERT INTO seasons (tournament_id, season_name, season_year, start_date, end_date, status)
       SELECT tournament_id, $1, $2, $3, $4, $5
       FROM tournaments WHERE tournament_code = 'KPL'
       ON CONFLICT (tournament_id, season_year) DO UPDATE SET
         season_name = EXCLUDED.season_name,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         status = EXCLUDED.status`,
      [season.name, season.year, season.start, season.end, season.status]
    );
  }
}

async function upsertStandings(client) {
  for (const [year, rows] of Object.entries(STANDINGS)) {
    const { rows: seasonRows } = await client.query(
      `SELECT s.season_id FROM seasons s
       JOIN tournaments t ON t.tournament_id = s.tournament_id
       WHERE t.tournament_code = 'KPL' AND s.season_year = $1`,
      [Number(year)]
    );
    if (!seasonRows.length) continue;
    const seasonId = seasonRows[0].season_id;

    for (const row of rows) {
      await client.query(
        `INSERT INTO points_table (
           season_id, team_id, matches_played, matches_won, matches_lost,
           matches_tied, matches_nr, points, net_run_rate
         )
         SELECT $1, t.team_id, $3, $4, $5, $6, $7, $8, $9
         FROM teams t WHERE t.team_code = $2
         ON CONFLICT (season_id, team_id) DO UPDATE SET
           matches_played = EXCLUDED.matches_played,
           matches_won = EXCLUDED.matches_won,
           matches_lost = EXCLUDED.matches_lost,
           matches_tied = EXCLUDED.matches_tied,
           matches_nr = EXCLUDED.matches_nr,
           points = EXCLUDED.points,
           net_run_rate = EXCLUDED.net_run_rate`,
        [seasonId, row.code, row.played, row.won, row.lost, row.tied, row.nr, row.pts, row.nrr]
      );
    }
  }
}

async function seedSampleMatches(client) {
  const { rows } = await client.query(
    `SELECT s.season_id FROM seasons s
     JOIN tournaments t ON t.tournament_id = s.tournament_id
     WHERE t.tournament_code = 'KPL' AND s.season_year = 2026`
  );
  if (!rows.length) return;
  const seasonId = rows[0].season_id;

  const fixtures = [
    { t1: 'VWA', t2: 'OCH', venue: 'KPL Ground A', date: '2026-03-08 14:00:00', status: 'COMPLETED', result: 'Valsad Warriors won by 24 runs' },
    { t1: 'OCH', t2: 'SST', venue: 'KPL Ground B', date: '2026-03-09 14:00:00', status: 'COMPLETED', result: 'Omisol Champions won by 6 wickets' },
    { t1: 'VWA', t2: 'OCH', venue: 'KPL Ground A', date: '2026-03-15 14:00:00', status: 'LIVE', result: null },
    { t1: 'SST', t2: 'FRC', venue: 'KPL Ground B', date: '2026-03-16 14:00:00', status: 'SCHEDULED', result: null },
    { t1: 'MTK', t2: 'FFC', venue: 'KPL Ground A', date: '2026-03-22 14:00:00', status: 'SCHEDULED', result: null },
  ];

  for (const f of fixtures) {
    const inserted = await client.query(
      `INSERT INTO matches (season_id, team1_id, team2_id, venue, match_date, status, result_summary)
       SELECT $1, t1.team_id, t2.team_id, $4, $5::timestamp, $6, $7
       FROM teams t1, teams t2
       WHERE t1.team_code = $2 AND t2.team_code = $3
         AND NOT EXISTS (
           SELECT 1 FROM matches m
           WHERE m.season_id = $1 AND m.team1_id = t1.team_id AND m.team2_id = t2.team_id
             AND m.match_date = $5::timestamp
         )
       RETURNING match_id, team1_id, team2_id`,
      [seasonId, f.t1, f.t2, f.venue, f.date, f.status, f.result]
    );

    if (f.status === 'LIVE' && inserted.rows.length) {
      const match = inserted.rows[0];
      await client.query(
        `INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number, total_runs, total_wickets, total_overs, status)
         VALUES ($1, $2, $3, 1, 142, 4, 15.2, 'IN_PROGRESS'),
                ($1, $4, $2, 2, 98, 6, 12.0, 'IN_PROGRESS')
         ON CONFLICT (match_id, innings_number) DO UPDATE SET
           total_runs = EXCLUDED.total_runs,
           total_wickets = EXCLUDED.total_wickets,
           total_overs = EXCLUDED.total_overs,
           status = EXCLUDED.status`,
        [match.match_id, match.team1_id, match.team2_id, match.team2_id]
      );
    }
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await migrateLegacySeasons(client);
    await upsertSeasons(client);
    await upsertStandings(client);
    await seedSampleMatches(client);
    await client.query('COMMIT');
    console.log('Seasons update applied: 4 seasons (2023–2026) with standings and sample matches.');
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
