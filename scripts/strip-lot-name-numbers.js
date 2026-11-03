/**
 * Strip trailing " 123" suffixes from auction_lots.player_name (dummy seed leftovers).
 * Usage: node scripts/strip-lot-name-numbers.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/database');

(async () => {
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE auction_lots
       SET player_name = regexp_replace(player_name, '\\s+[0-9]+$', ''),
           updated_at = CURRENT_TIMESTAMP
       WHERE player_name ~ '\\s+[0-9]+$'
       RETURNING lot_id, player_name`
    );
    console.log(`Updated ${rowCount} lot name(s).`);
    for (const row of rows.slice(0, 10)) {
      console.log(`  #${row.lot_id} → ${row.player_name}`);
    }
    if (rowCount > 10) console.log(`  …and ${rowCount - 10} more`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
