require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/database');

(async () => {
  const { rows } = await pool.query(
    `UPDATE auction_categories
     SET min_per_team = 1, max_per_team = 1, updated_at = CURRENT_TIMESTAMP
     WHERE lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')) LIKE '%icon%'
     RETURNING auction_id, name, min_per_team, max_per_team`
  );
  console.log(`Updated ${rows.length} Icon categor(y/ies).`);
  for (const r of rows) console.log(r);
  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
