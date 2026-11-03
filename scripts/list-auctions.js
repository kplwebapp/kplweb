require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/database');

(async () => {
  const cols = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'auctions' ORDER BY ordinal_position`
  );
  console.log('auction columns:', cols.rows.map((r) => r.column_name).join(', '));
  const auctions = await pool.query(`SELECT * FROM auctions ORDER BY auction_id`);
  console.log('auctions count:', auctions.rows.length);
  console.log(auctions.rows.map((a) => ({
    auction_id: a.auction_id,
    title: a.title,
    status: a.status,
    is_legacy: a.is_legacy,
    season_id: a.season_id,
    event_id: a.event_id,
  })));
  const lots = await pool.query(
    `SELECT auction_id, COUNT(*)::int AS lots FROM auction_lots GROUP BY auction_id ORDER BY auction_id`
  );
  console.log('lots:', lots.rows);
  const seasons = await pool.query(`SELECT season_id, year, status FROM seasons ORDER BY season_id DESC LIMIT 5`);
  console.log('seasons:', seasons.rows);
  const events = await pool.query(
    `SELECT event_id, title, kind FROM events WHERE kind = 'TOURNAMENT' ORDER BY event_id DESC LIMIT 5`
  );
  console.log('tournaments:', events.rows);
  await pool.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
