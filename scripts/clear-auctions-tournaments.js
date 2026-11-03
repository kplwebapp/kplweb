/**
 * Removes all auctions and tournaments (events of kind TOURNAMENT).
 * Temporarily bypasses permanent-history triggers on auction_bids / auction_events.
 * Usage: node scripts/clear-auctions-tournaments.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/database');

async function tryDelete(client, sql, label) {
  const sp = `sp_${label.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}`;
  try {
    await client.query(`SAVEPOINT ${sp}`);
    const res = await client.query(sql);
    await client.query(`RELEASE SAVEPOINT ${sp}`);
    console.log(`  ${label}: ${res.rowCount}`);
    return res.rowCount;
  } catch (err) {
    await client.query(`ROLLBACK TO SAVEPOINT ${sp}`).catch(() => {});
    console.log(`  ${label}: skipped (${err.message.split('\n')[0]})`);
    return 0;
  }
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Bypass permanent-history triggers (auction_bids / auction_events).
    await client.query("SET LOCAL session_replication_role = 'replica'");

    console.log('Clearing auctions…');
    await client.query('UPDATE auctions SET current_lot_id = NULL');
    await client.query('UPDATE auction_lots SET current_bid_id = NULL, sold_bid_id = NULL');
    await tryDelete(client, 'DELETE FROM auction_bids', 'auction_bids');
    await tryDelete(client, 'DELETE FROM auction_events', 'auction_events');
    await tryDelete(client, 'DELETE FROM auction_lots', 'auction_lots');
    await tryDelete(client, 'DELETE FROM auction_categories', 'auction_categories');
    await tryDelete(client, 'DELETE FROM auction_teams', 'auction_teams');
    await tryDelete(client, 'DELETE FROM auctions', 'auctions');

    console.log('Clearing tournament events and related rows…');
    await tryDelete(
      client,
      `DELETE FROM tournament_registrations WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'tournament_registrations'
    );
    await tryDelete(
      client,
      `DELETE FROM gallery_items WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'gallery_items'
    );
    await tryDelete(
      client,
      `DELETE FROM tournament_teams WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'tournament_teams'
    );
    await tryDelete(
      client,
      `DELETE FROM tournament_matches WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'tournament_matches'
    );
    await tryDelete(
      client,
      `DELETE FROM tournament_media WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'tournament_media'
    );
    await tryDelete(
      client,
      `DELETE FROM matches WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'matches'
    );
    await tryDelete(
      client,
      `DELETE FROM points_table WHERE event_id IN (SELECT event_id FROM events WHERE kind = 'TOURNAMENT')`,
      'points_table'
    );
    await tryDelete(client, `DELETE FROM events WHERE kind = 'TOURNAMENT'`, 'events (TOURNAMENT)');
    await tryDelete(client, 'DELETE FROM tournaments', 'tournaments');

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
