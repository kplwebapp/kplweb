/**
 * Apply auction schema + sample Season 4 auction data (points-based).
 * Usage: node scripts/apply-auctions.js
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

const SAMPLE_LOTS = [
  { lot: 1, name: 'Rajesh Patel', role: 'Batsman', vibhaag: 'Valsad', base: 500, team: 'VWA', price: 12500 },
  { lot: 2, name: 'Amit Shah', role: 'All-rounder', vibhaag: 'Bilimora', base: 400, team: 'OCH', price: 9800 },
  { lot: 3, name: 'Vikram Desai', role: 'Bowler', vibhaag: 'Gandevi', base: 350, team: 'SST', price: 7200 },
  { lot: 4, name: 'Kiran Mehta', role: 'Batsman', vibhaag: 'Navsari', base: 450, team: 'MTK', price: 11000 },
  { lot: 5, name: 'Suresh Trivedi', role: 'Batsman', vibhaag: 'Vapi', base: 300, team: 'FFC', price: 6500 },
  { lot: 6, name: 'Harsh Joshi', role: 'Bowler', vibhaag: 'Pardi', base: 250, team: 'FRC', price: 4800 },
  { lot: 7, name: 'Nilesh Rawal', role: 'All-rounder', vibhaag: 'Mumbai', base: 400, team: null, price: null },
  { lot: 8, name: 'Deepak Vyas', role: 'Batsman', vibhaag: 'Tarapur', base: 350, team: null, price: null },
];

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
}

async function main() {
  const client = await pool.connect();
  try {
    await runSqlFile(path.join(__dirname, '../database/schema/006_auctions.sql'));
    await runSqlFile(path.join(__dirname, '../database/schema/007_auction_points.sql'));

    for (const year of [2023, 2024, 2025, 2026]) {
      const seasonRes = await client.query(
        `SELECT season_id, season_name FROM seasons WHERE season_year = $1 LIMIT 1`,
        [year]
      );
      if (seasonRes.rows.length === 0) continue;

      const { season_id, season_name } = seasonRes.rows[0];
      const isCurrent = year === 2026;

      const auctionRes = await client.query(
        `INSERT INTO auctions (season_id, title, description, auction_date, venue, status, budget_per_team, max_players_per_team)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (season_id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           auction_date = EXCLUDED.auction_date,
           venue = EXCLUDED.venue,
           status = EXCLUDED.status,
           budget_per_team = EXCLUDED.budget_per_team,
           max_players_per_team = EXCLUDED.max_players_per_team,
           updated_at = CURRENT_TIMESTAMP
         RETURNING auction_id`,
        [
          season_id,
          `${season_name} Player Auction`,
          `Official KPL points auction for ${season_name}. Each team has 1,00,000 points for up to 16 players.`,
          `${year}-10-15T10:00:00+05:30`,
          'Kansara Community Grounds',
          isCurrent ? 'LIVE' : 'COMPLETED',
          100000,
          16,
        ]
      );

      const auctionId = auctionRes.rows[0].auction_id;

      if (isCurrent) {
        await client.query('DELETE FROM auction_lots WHERE auction_id = $1', [auctionId]);

        for (const lot of SAMPLE_LOTS) {
          let teamId = null;
          if (lot.team) {
            const teamRes = await client.query(
              'SELECT team_id FROM teams WHERE team_code = $1',
              [lot.team]
            );
            teamId = teamRes.rows[0]?.team_id ?? null;
          }

          const sold = teamId != null;
          await client.query(
            `INSERT INTO auction_lots
              (auction_id, lot_number, player_name, player_role, vibhaag, base_price, sold_price, team_id, status, sold_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              auctionId,
              lot.lot,
              lot.name,
              lot.role,
              lot.vibhaag,
              lot.base,
              sold ? lot.price : null,
              teamId,
              sold ? 'SOLD' : 'PENDING',
              sold ? new Date() : null,
            ]
          );
        }
      }
    }

    console.log('Auction schema and sample points data applied.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Auction apply failed:', err.message);
  process.exit(1);
});
