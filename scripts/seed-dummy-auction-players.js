/**
 * Seeds at least 130 dummy cricket players into the current (or given) auction pool,
 * spread across Icon Player / All Rounder / Batsman / Bowlers / Other Players.
 *
 * Usage:
 *   node scripts/seed-dummy-auction-players.js
 *   node scripts/seed-dummy-auction-players.js --auction=4
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const pool = require('../backend/src/config/database');

const STANDARD_CATEGORIES = [
  'Icon Player',
  'All Rounder',
  'Batsman',
  'Bowlers',
  'Other Players',
];

/** How many dummy players per category (total 135). */
const COUNTS = {
  'Icon Player': 12,
  'All Rounder': 36,
  Batsman: 36,
  Bowlers: 36,
  'Other Players': 15,
};

const FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Dhruv', 'Kabir', 'Ritvik', 'Yash', 'Rohan', 'Kunal', 'Harsh', 'Nikhil',
  'Siddharth', 'Aniket', 'Pranav', 'Om', 'Dev', 'Jay', 'Parth', 'Manav', 'Tushar', 'Ravi',
  'Amit', 'Suresh', 'Nilesh', 'Paresh', 'Bhavesh', 'Chirag', 'Deepak', 'Gaurav', 'Hemant', 'Jignesh',
];

const LAST = [
  'Patel', 'Shah', 'Mehta', 'Desai', 'Joshi', 'Trivedi', 'Dave', 'Raval', 'Parekh', 'Gandhi',
  'Modi', 'Thakkar', 'Bhatt', 'Chauhan', 'Solanki', 'Parmar', 'Rathod', 'Jadeja', 'Pandya', 'Sharma',
  'Singh', 'Yadav', 'Verma', 'Nair', 'Iyer', 'Reddy', 'Khan', 'Ali', 'Shetty', 'Pillai',
];

const VIBHAAG = ['Navsari', 'Bilimora', 'Gandevi', 'Valsad', 'Pardi', 'Vapi', 'Mumbai'];

function parseAuctionId() {
  const arg = process.argv.find((a) => a.startsWith('--auction='));
  return arg ? Number(arg.split('=')[1]) : null;
}

function playerName(i) {
  return `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]} ${i + 1}`;
}

async function ensureCategories(client, auctionId) {
  const { rows: existing } = await client.query(
    `SELECT auction_category_id, name FROM auction_categories WHERE auction_id = $1 ORDER BY display_order`,
    [auctionId]
  );
  const byNorm = new Map(
    existing.map((c) => [String(c.name).toLowerCase().replace(/[^a-z0-9]+/g, ''), c])
  );

  const resolved = [];
  for (let i = 0; i < STANDARD_CATEGORIES.length; i += 1) {
    const label = STANDARD_CATEGORIES[i];
    const norm = label.toLowerCase().replace(/[^a-z0-9]+/g, '');
    let row = byNorm.get(norm);
    if (!row) {
      // fuzzy: icon / allrounder / batsman / bowler / other
      for (const [k, v] of byNorm.entries()) {
        if (
          (norm.includes('icon') && k.includes('icon')) ||
          (norm.includes('allrounder') && k.includes('allrounder')) ||
          (norm.includes('batsman') && k.includes('batsman')) ||
          (norm.includes('bowler') && k.includes('bowler')) ||
          (norm.includes('other') && k.includes('other'))
        ) {
          row = v;
          break;
        }
      }
    }
    if (!row) {
      const { rows } = await client.query(
        `INSERT INTO auction_categories (auction_id, name, display_order, base_price, min_per_team, max_per_team)
         VALUES ($1, $2, $3, 0, 0, NULL)
         RETURNING auction_category_id, name`,
        [auctionId, label, i]
      );
      row = rows[0];
      console.log(`Created category: ${label}`);
    } else if (row.name !== label) {
      await client.query(
        `UPDATE auction_categories SET name = $2, display_order = $3, updated_at = CURRENT_TIMESTAMP
         WHERE auction_category_id = $1`,
        [row.auction_category_id, label, i]
      );
      row = { ...row, name: label };
      console.log(`Renamed category to: ${label}`);
    }
    resolved.push({ ...row, name: label });
  }
  return resolved;
}

async function main() {
  const client = await pool.connect();
  try {
    const wantedId = parseAuctionId();
    const { rows: auctions } = await client.query(
      wantedId
        ? `SELECT auction_id, title, status FROM auctions WHERE auction_id = $1`
        : `SELECT auction_id, title, status FROM auctions
           WHERE COALESCE(is_legacy, false) = false
           ORDER BY (status IN ('LIVE','PAUSED')) DESC, (status IN ('READY','DRAFT')) DESC, auction_id DESC
           LIMIT 1`,
      wantedId ? [wantedId] : []
    );
    if (!auctions[0]) throw new Error('No auction found to seed.');
    const auction = auctions[0];
    console.log(`Seeding auction #${auction.auction_id} (${auction.title}) [${auction.status}]`);

    await client.query('BEGIN');
    const cats = await ensureCategories(client, auction.auction_id);

    const { rows: maxLot } = await client.query(
      `SELECT COALESCE(MAX(lot_number), 0)::int AS n FROM auction_lots WHERE auction_id = $1`,
      [auction.auction_id]
    );
    let lotNumber = maxLot[0].n;
    let inserted = 0;
    let nameIndex = 0;

    for (const cat of cats) {
      const count = COUNTS[cat.name] ?? 20;
      for (let i = 0; i < count; i += 1) {
        lotNumber += 1;
        const name = playerName(nameIndex);
        nameIndex += 1;
        await client.query(
          `INSERT INTO auction_lots (
             auction_id, lot_number, player_name, vibhaag, base_price, status,
             auction_category_id, is_eligible, bid_round
           ) VALUES ($1, $2, $3, $4, 0, 'PENDING', $5, TRUE, 1)`,
          [
            auction.auction_id,
            lotNumber,
            name,
            VIBHAAG[(lotNumber + i) % VIBHAAG.length],
            cat.auction_category_id,
          ]
        );
        inserted += 1;
      }
      console.log(`  ${cat.name}: +${count}`);
    }

    await client.query('COMMIT');
    console.log(`Done. Inserted ${inserted} dummy players (lot numbers up to ${lotNumber}).`);
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
