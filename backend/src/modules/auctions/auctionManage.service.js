const pool = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const repo = require('./auctionManage.repository');
const snapshot = require('./auctionSnapshot');
const stream = require('./auctionStream');
const { LIFECYCLE, SETUP_STATUSES, OPEN_STATUSES } = require('./auction.constants');

const CRICKET_SLUG = 'cricket';

/**
 * Every change to an auction runs inside `mutate`: one transaction that first locks the auction
 * row (SELECT … FOR UPDATE). All changes to one auction are therefore applied one at a time, so
 * two bids, two sales or a sale and a budget change can never interleave. Each change records
 * at least one auction_events row whose seq is the auction's new version; viewers are notified
 * only after the commit.
 */
async function mutate(auctionId, actorId, fn) {
  const client = await pool.connect();
  let committed = false;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM auctions WHERE auction_id = $1 FOR UPDATE', [auctionId]);
    const auction = rows[0];
    if (!auction) throw new ApiError(404, 'Auction not found');
    if (auction.is_legacy) {
      throw new ApiError(409, 'This is a legacy auction kept as history; it cannot be changed.');
    }

    const events = [];
    const log = (type, fields = {}) => events.push({ type, ...fields });
    const result = await fn({ client, auction, log });

    if (events.length === 0) throw new ApiError(400, 'Nothing changed.');
    const { rows: v } = await client.query(
      `UPDATE auctions SET version = version + $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       WHERE auction_id = $1 RETURNING version`,
      [auctionId, events.length, actorId]
    );
    const last = Number(v[0].version);
    for (const [i, e] of events.entries()) {
      await client.query(
        `INSERT INTO auction_events (auction_id, seq, event_type, lot_id, team_id, bid_id, amount, details, actor_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [auctionId, last - events.length + i + 1, e.type, e.lot_id ?? null, e.team_id ?? null,
          e.bid_id ?? null, e.amount ?? null, e.details ?? {}, actorId]
      );
    }

    await client.query('COMMIT');
    committed = true;
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    if (committed) {
      snapshot.invalidate(auctionId);
      stream.publish(auctionId);
    }
  }
}

const assertStatus = (auction, allowed, what) => {
  if (!allowed.includes(auction.status)) {
    throw new ApiError(409, `${what} is not possible while the auction is ${auction.status.toLowerCase()}.`);
  }
};

const lockLot = async (client, auctionId, lotId) => {
  const { rows } = await client.query(
    'SELECT * FROM auction_lots WHERE auction_id = $1 AND lot_id = $2 FOR UPDATE',
    [auctionId, lotId]
  );
  if (!rows[0]) throw new ApiError(404, 'Player not found in this auction');
  return { ...rows[0], base_price: Number(rows[0].base_price) };
};

const findCricketCategoryId = async (db) => {
  const { rows } = await db.query(
    `SELECT category_id FROM activity_categories WHERE kind = 'TOURNAMENT' AND slug = $1`,
    [CRICKET_SLUG]
  );
  return rows[0]?.category_id ?? null;
};

/** The event must be a cricket tournament; returns it. */
const loadTournament = async (db, eventId) => {
  const { rows } = await db.query(
    `SELECT e.event_id, e.title, e.category_id, e.kind, c.slug AS category_slug
     FROM events e LEFT JOIN activity_categories c ON c.category_id = e.category_id
     WHERE e.event_id = $1`,
    [eventId]
  );
  const event = rows[0];
  if (!event || event.kind !== 'TOURNAMENT') throw new ApiError(400, 'Tournament not found');
  if (event.category_slug !== CRICKET_SLUG) throw new ApiError(400, 'Auctions are only available for cricket tournaments.');
  return event;
};

/**
 * Rules for a team buying a player at `amount`: enough budget, a free squad slot, the
 * category's per-team maximum, and enough free slots left for every category minimum.
 */
async function assertCanBuy(client, auctionId, teamId, lot, amount) {
  const teams = await repo.findTeams(auctionId, client);
  const team = teams.find((t) => t.team_id === teamId);
  if (!team) throw new ApiError(400, 'That team is not taking part in this auction.');

  if (team.players_bought >= team.max_players) {
    throw new ApiError(400, `${team.team_name} already has a full squad of ${team.max_players} players.`);
  }
  if (amount > team.remaining) {
    throw new ApiError(400, `${team.team_name} has only ${team.remaining} points left.`);
  }

  const categories = await repo.findCategories(auctionId, client);
  if (categories.length === 0) return team;

  const counts = (await repo.findTeamCategoryCounts(auctionId, client))[teamId] ?? {};
  const category = categories.find((c) => c.auction_category_id === lot.auction_category_id);
  if (category?.max_per_team != null && (counts[category.auction_category_id] ?? 0) >= category.max_per_team) {
    throw new ApiError(400, `${team.team_name} already has the maximum of ${category.max_per_team} ${category.name} players.`);
  }

  const slotsAfter = team.max_players - team.players_bought - 1;
  const stillNeeded = categories.reduce((sum, c) => {
    const have = (counts[c.auction_category_id] ?? 0) + (c.auction_category_id === lot.auction_category_id ? 1 : 0);
    return sum + Math.max(0, c.min_per_team - have);
  }, 0);
  if (stillNeeded > slotsAfter) {
    throw new ApiError(
      400,
      `${team.team_name} must keep ${stillNeeded} squad place(s) for required categories, so it cannot buy this player.`
    );
  }
  return team;
}

const currentBid = async (client, lot) => {
  if (!lot.current_bid_id) return null;
  const { rows } = await client.query('SELECT bid_id, team_id, amount FROM auction_bids WHERE bid_id = $1', [lot.current_bid_id]);
  return rows[0] ?? null;
};

/** The lot that is under the hammer; `lotId` from the client must match it (guards stale screens). */
const lockCurrentLot = async (client, auction, lotId) => {
  if (!auction.current_lot_id) throw new ApiError(409, 'No player is up for bidding.');
  if (lotId !== auction.current_lot_id) {
    throw new ApiError(409, 'A different player is now up for bidding. Refresh and try again.');
  }
  const lot = await lockLot(client, auction.auction_id, lotId);
  if (lot.status !== 'ON_BLOCK') throw new ApiError(409, 'This player is not up for bidding.');
  return lot;
};

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

const SETTING_FIELDS = [
  'title', 'description', 'rules', 'auction_date', 'venue', 'season_id', 'event_id',
  'budget_per_team', 'max_players_per_team', 'min_players_per_team', 'min_bid_increment', 'default_base_price',
];
/** Settings that may still change once bidding has started. */
const LIVE_EDITABLE = ['title', 'description', 'rules', 'auction_date', 'venue', 'min_bid_increment'];

const service = {
  mutate,

  // ---------------- Setup ----------------

  async create(body, actorId) {
    const client = await pool.connect();
    let auctionId;
    try {
      await client.query('BEGIN');
      const season = await client.query('SELECT season_id FROM seasons WHERE season_id = $1', [body.season_id]);
      if (!season.rows[0]) throw new ApiError(400, 'Season not found');
      if (body.event_id) await loadTournament(client, body.event_id);
      if ((body.min_players_per_team ?? 0) > body.max_players_per_team) {
        throw new ApiError(400, 'Minimum squad size cannot be more than the maximum.');
      }

      const { rows } = await client.query(
        `INSERT INTO auctions (season_id, event_id, title, description, rules, auction_date, venue, status,
                               budget_per_team, max_players_per_team, min_players_per_team, min_bid_increment,
                               default_base_price, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', $8, $9, $10, $11, $12, $13, $13)
         RETURNING auction_id`,
        [body.season_id, body.event_id ?? null, body.title, body.description ?? null, body.rules ?? null,
          body.auction_date ?? null, body.venue ?? null, body.budget_per_team, body.max_players_per_team,
          body.min_players_per_team ?? 0, body.min_bid_increment, body.default_base_price ?? 0, actorId]
      );
      auctionId = rows[0].auction_id;

      for (const [i, c] of (body.categories ?? []).entries()) {
        await client.query(
          `INSERT INTO auction_categories (auction_id, name, display_order, base_price, min_per_team, max_per_team)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [auctionId, c.name, i, c.base_price ?? null, c.min_per_team ?? 0, c.max_per_team ?? null]
        );
      }

      // The tournament's participating teams join with the default budget.
      if (body.event_id) {
        await client.query(
          `INSERT INTO auction_teams (auction_id, team_id, budget, max_players)
           SELECT $1, tt.team_id, $2, $3 FROM tournament_teams tt
           JOIN teams t ON t.team_id = tt.team_id AND t.is_active
           WHERE tt.event_id = $4`,
          [auctionId, body.budget_per_team, body.max_players_per_team, body.event_id]
        );
      }

      await client.query(
        `UPDATE auctions SET version = 1 WHERE auction_id = $1`,
        [auctionId]
      );
      await client.query(
        `INSERT INTO auction_events (auction_id, seq, event_type, details, actor_user_id)
         VALUES ($1, 1, 'AUCTION_CREATED', $2, $3)`,
        [auctionId, pick(body, SETTING_FIELDS), actorId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') throw new ApiError(409, 'That tournament already has an auction.');
      throw err;
    } finally {
      client.release();
    }
    return repo.findAuction(auctionId);
  },

  update(auctionId, body, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Changing settings');
      const changes = pick(body, SETTING_FIELDS);
      const live = !SETUP_STATUSES.includes(auction.status);
      const locked = Object.keys(changes).filter((k) => live && !LIVE_EDITABLE.includes(k));
      if (locked.length) {
        throw new ApiError(409, `These settings cannot change after the auction has started: ${locked.join(', ')}.`);
      }

      if (changes.event_id !== undefined && changes.event_id !== auction.event_id) {
        const { rows } = await client.query(
          `SELECT COUNT(*)::int AS n FROM auction_lots WHERE auction_id = $1 AND status <> 'WITHDRAWN'`,
          [auctionId]
        );
        if (rows[0].n > 0) throw new ApiError(409, 'Remove the players from the pool before changing the tournament.');
        if (changes.event_id) await loadTournament(client, changes.event_id);
      }
      if (changes.season_id) {
        const season = await client.query('SELECT 1 FROM seasons WHERE season_id = $1', [changes.season_id]);
        if (!season.rows[0]) throw new ApiError(400, 'Season not found');
      }

      const next = { ...auction, ...changes };
      if (next.min_players_per_team > next.max_players_per_team) {
        throw new ApiError(400, 'Minimum squad size cannot be more than the maximum.');
      }

      const keys = Object.keys(changes);
      if (keys.length === 0) throw new ApiError(400, 'Nothing to change.');
      await client.query(
        `UPDATE auctions SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE auction_id = $1`,
        [auctionId, ...keys.map((k) => changes[k])]
      );
      const before = Object.fromEntries(keys.map((k) => [k, auction[k]]));
      log('AUCTION_UPDATED', { details: { before, after: changes } });
      return repo.findAuction(auctionId, client);
    });
  },

  setCategories(auctionId, categories, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, SETUP_STATUSES, 'Changing categories');
      const names = categories.map((c) => c.name.trim().toLowerCase());
      if (new Set(names).size !== names.length) throw new ApiError(400, 'Category names must be different.');

      const existing = await repo.findCategories(auctionId, client);
      const keepIds = categories.map((c) => c.auction_category_id).filter(Boolean);
      for (const id of keepIds) {
        if (!existing.some((c) => c.auction_category_id === id)) throw new ApiError(400, 'Unknown category');
      }

      const removed = existing.filter((c) => !keepIds.includes(c.auction_category_id));
      for (const c of removed) {
        const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM auction_lots WHERE auction_category_id = $1', [c.auction_category_id]);
        if (rows[0].n > 0) throw new ApiError(409, `"${c.name}" is used by players in the pool; reassign them first.`);
        await client.query('DELETE FROM auction_categories WHERE auction_category_id = $1', [c.auction_category_id]);
      }

      // Temporary names avoid clashing with the unique (auction, name) index while renaming.
      for (const c of categories.filter((x) => x.auction_category_id)) {
        await client.query(`UPDATE auction_categories SET name = '~' || auction_category_id WHERE auction_category_id = $1`, [c.auction_category_id]);
      }
      for (const [i, c] of categories.entries()) {
        const values = [c.name.trim(), i, c.base_price ?? null, c.min_per_team ?? 0, c.max_per_team ?? null];
        if (c.auction_category_id) {
          await client.query(
            `UPDATE auction_categories SET name = $2, display_order = $3, base_price = $4, min_per_team = $5,
                    max_per_team = $6, updated_at = CURRENT_TIMESTAMP
             WHERE auction_category_id = $1`,
            [c.auction_category_id, ...values]
          );
        } else {
          await client.query(
            `INSERT INTO auction_categories (auction_id, name, display_order, base_price, min_per_team, max_per_team)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [auctionId, ...values]
          );
        }
      }
      log('CATEGORIES_UPDATED', { details: { before: existing, after: categories } });
      return repo.findCategories(auctionId, client);
    });
  },

  setTeams(auctionId, teams, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Changing teams');
      const ids = teams.map((t) => t.team_id);
      if (new Set(ids).size !== ids.length) throw new ApiError(400, 'A team is listed twice.');

      const categoryId = auction.event_id
        ? (await loadTournament(client, auction.event_id)).category_id
        : await findCricketCategoryId(client);
      if (ids.length) {
        const { rows } = await client.query(
          'SELECT team_id FROM teams WHERE team_id = ANY($1) AND category_id = $2 AND is_active',
          [ids, categoryId]
        );
        if (rows.length !== ids.length) throw new ApiError(400, 'Only active cricket teams can take part.');
      }

      const current = await repo.findTeams(auctionId, client);
      const live = !SETUP_STATUSES.includes(auction.status);
      const removed = current.filter((t) => !ids.includes(t.team_id));
      if (removed.length && live) throw new ApiError(409, 'Teams cannot be removed once the auction has started.');

      for (const t of teams) {
        const existing = current.find((c) => c.team_id === t.team_id);
        if (existing && t.budget < existing.spent) {
          throw new ApiError(400, `${existing.team_name} has already spent ${existing.spent} points; the budget cannot be lower.`);
        }
        if (existing && t.max_players < existing.players_bought) {
          throw new ApiError(400, `${existing.team_name} already has ${existing.players_bought} players.`);
        }
      }

      if (removed.length) {
        await client.query('DELETE FROM auction_teams WHERE auction_id = $1 AND team_id = ANY($2)', [auctionId, removed.map((t) => t.team_id)]);
      }
      for (const t of teams) {
        await client.query(
          `INSERT INTO auction_teams (auction_id, team_id, budget, max_players) VALUES ($1, $2, $3, $4)
           ON CONFLICT (auction_id, team_id) DO UPDATE SET budget = EXCLUDED.budget, max_players = EXCLUDED.max_players,
             updated_at = CURRENT_TIMESTAMP`,
          [auctionId, t.team_id, t.budget, t.max_players]
        );
      }

      for (const t of teams) {
        const before = current.find((c) => c.team_id === t.team_id);
        if (!before) log('TEAM_ADDED', { team_id: t.team_id, amount: t.budget, details: t });
        else if (before.budget !== t.budget || before.max_players !== t.max_players) {
          log('TEAM_BUDGET_CHANGED', {
            team_id: t.team_id,
            amount: t.budget,
            details: { before: { budget: before.budget, max_players: before.max_players }, after: t },
          });
        }
      }
      for (const t of removed) log('TEAM_REMOVED', { team_id: t.team_id });
      return repo.findTeams(auctionId, client);
    });
  },

  // ---------------- Player pool ----------------

  addPlayers(auctionId, { user_ids: userIds, auction_category_id: categoryId }, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Adding players');
      if (!auction.event_id) throw new ApiError(400, 'Link the auction to a tournament first; its registrations form the player pool.');

      let basePrice = auction.default_base_price;
      if (categoryId) {
        const { rows } = await client.query(
          'SELECT base_price FROM auction_categories WHERE auction_id = $1 AND auction_category_id = $2',
          [auctionId, categoryId]
        );
        if (!rows[0]) throw new ApiError(400, 'Unknown category');
        basePrice = rows[0].base_price ?? basePrice;
      }

      const { rows: regs } = await client.query(
        `SELECT r.registration_id, u.user_id, COALESCE(u.full_name, u.first_name || ' ' || u.last_name) AS full_name, u.vibhaag
         FROM tournament_registrations r JOIN users u ON u.user_id = r.user_id
         WHERE r.event_id = $1 AND r.user_id = ANY($2)
           AND NOT EXISTS (SELECT 1 FROM auction_lots l WHERE l.auction_id = $3 AND l.user_id = r.user_id)
         ORDER BY full_name`,
        [auction.event_id, userIds, auctionId]
      );
      if (regs.length === 0) throw new ApiError(400, 'None of these members can be added: they are not registered for the tournament or are already in the pool.');

      const { rows: max } = await client.query('SELECT COALESCE(MAX(lot_number), 0) AS n FROM auction_lots WHERE auction_id = $1', [auctionId]);
      let lotNumber = Number(max[0].n);
      const added = [];
      for (const r of regs) {
        lotNumber += 1;
        const { rows } = await client.query(
          `INSERT INTO auction_lots (auction_id, lot_number, player_name, vibhaag, base_price, user_id, registration_id, auction_category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING lot_id`,
          [auctionId, lotNumber, r.full_name, r.vibhaag, basePrice, r.user_id, r.registration_id, categoryId ?? null]
        );
        added.push(rows[0].lot_id);
      }
      log('PLAYERS_ADDED', { details: { lot_ids: added, user_ids: regs.map((r) => r.user_id) } });
      return { added: added.length, skipped: userIds.length - added.length };
    });
  },

  updateLot(auctionId, lotId, body, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Changing players');
      const lot = await lockLot(client, auctionId, lotId);
      if (!['PENDING', 'UNSOLD'].includes(lot.status)) {
        throw new ApiError(409, 'Only players waiting to be auctioned or unsold can be changed.');
      }
      if (body.auction_category_id) {
        const { rows } = await client.query(
          'SELECT 1 FROM auction_categories WHERE auction_id = $1 AND auction_category_id = $2',
          [auctionId, body.auction_category_id]
        );
        if (!rows[0]) throw new ApiError(400, 'Unknown category');
      }
      const changes = pick(body, ['auction_category_id', 'base_price', 'is_eligible', 'eligibility_note']);
      const keys = Object.keys(changes);
      if (keys.length === 0) throw new ApiError(400, 'Nothing to change.');
      await client.query(
        `UPDATE auction_lots SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE lot_id = $1`,
        [lotId, ...keys.map((k) => changes[k])]
      );
      log('PLAYER_UPDATED', {
        lot_id: lotId,
        details: { before: Object.fromEntries(keys.map((k) => [k, lot[k]])), after: changes },
      });
      return repo.findLot(auctionId, lotId, client);
    });
  },

  setLotWithdrawn(auctionId, lotId, withdrawn, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Changing the pool');
      const lot = await lockLot(client, auctionId, lotId);
      if (withdrawn && !['PENDING', 'UNSOLD'].includes(lot.status)) {
        throw new ApiError(409, 'Only players waiting to be auctioned or unsold can be removed.');
      }
      if (!withdrawn && lot.status !== 'WITHDRAWN') throw new ApiError(409, 'This player is not removed.');
      await client.query(
        `UPDATE auction_lots SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE lot_id = $1`,
        [lotId, withdrawn ? 'WITHDRAWN' : 'PENDING']
      );
      log(withdrawn ? 'PLAYER_WITHDRAWN' : 'PLAYER_RESTORED', { lot_id: lotId, details: { previous_status: lot.status } });
      return repo.findLot(auctionId, lotId, client);
    });
  },

  reorder(auctionId, lotIds, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Reordering');
      const { rows } = await client.query('SELECT lot_id FROM auction_lots WHERE auction_id = $1 FOR UPDATE', [auctionId]);
      const all = rows.map((r) => r.lot_id);
      if (lotIds.length !== all.length || !all.every((id) => lotIds.includes(id))) {
        throw new ApiError(400, 'The new order must list every player in the pool exactly once.');
      }
      await client.query('SET CONSTRAINTS uq_auction_lots_number DEFERRED');
      for (const [i, id] of lotIds.entries()) {
        await client.query('UPDATE auction_lots SET lot_number = $2 WHERE lot_id = $1', [id, i + 1]);
      }
      log('PLAYERS_REORDERED', { details: { lot_ids: lotIds } });
      return { ok: true };
    });
  },

  // ---------------- Lifecycle ----------------

  transition(auctionId, action, { reason } = {}, actorId) {
    const rule = LIFECYCLE[action];
    if (!rule) throw new ApiError(400, 'Unknown action');
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      if (!rule.from.includes(auction.status)) {
        throw new ApiError(409, `Cannot ${action} an auction that is ${auction.status.toLowerCase()}.`);
      }
      const extra = {};

      if (action === 'ready') {
        const teams = await repo.findTeams(auctionId, client);
        if (teams.length < 2) throw new ApiError(409, 'Add at least two teams with budgets first.');
        const { rows } = await client.query(
          `SELECT COUNT(*) FILTER (WHERE is_eligible AND status = 'PENDING')::int AS ready,
                  COUNT(*) FILTER (WHERE is_eligible AND status = 'PENDING' AND auction_category_id IS NULL)::int AS uncategorised
           FROM auction_lots WHERE auction_id = $1`,
          [auctionId]
        );
        if (rows[0].ready === 0) throw new ApiError(409, 'Add eligible players to the pool first.');
        const categories = await repo.findCategories(auctionId, client);
        if (categories.length && rows[0].uncategorised > 0) {
          throw new ApiError(409, `${rows[0].uncategorised} eligible player(s) have no category yet.`);
        }
      }

      if (action === 'complete' && auction.current_lot_id) {
        throw new ApiError(409, 'Mark the current player sold or unsold before completing the auction.');
      }

      if (action === 'complete') {
        const { rows } = await client.query(
          `UPDATE auction_lots SET status = 'UNSOLD', updated_at = CURRENT_TIMESTAMP
           WHERE auction_id = $1 AND status = 'PENDING' AND is_eligible RETURNING lot_id`,
          [auctionId]
        );
        extra.not_auctioned_lot_ids = rows.map((r) => r.lot_id);
      }

      if (action === 'cancel') {
        if (auction.current_lot_id) {
          await client.query(
            `UPDATE auction_lots SET status = 'PENDING', current_bid_id = NULL, bid_round = bid_round + 1,
               updated_at = CURRENT_TIMESTAMP WHERE lot_id = $1`,
            [auction.current_lot_id]
          );
        }
        extra.reason = reason;
      }

      const stamp = { start: 'started_at', complete: 'completed_at', cancel: 'cancelled_at' }[action];
      await client.query(
        `UPDATE auctions SET status = $2${stamp ? `, ${stamp} = CURRENT_TIMESTAMP` : ''}
           ${action === 'cancel' ? ', cancel_reason = $3, current_lot_id = NULL' : ''}
         WHERE auction_id = $1`,
        action === 'cancel' ? [auctionId, rule.to, reason] : [auctionId, rule.to]
      );
      log('STATUS_CHANGED', { details: { action, from: auction.status, to: rule.to, ...extra } });
      return { status: rule.to };
    });
  },

  // ---------------- Live bidding ----------------

  /** Puts a player up for bidding: the next waiting one, or a chosen waiting or unsold one. */
  nextPlayer(auctionId, lotId, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE'], 'Bringing up a player');
      if (auction.current_lot_id) throw new ApiError(409, 'Mark the current player sold or unsold first.');

      let lot;
      if (lotId) {
        lot = await lockLot(client, auctionId, lotId);
      } else {
        const { rows } = await client.query(
          `SELECT lot_id FROM auction_lots WHERE auction_id = $1 AND status = 'PENDING' AND is_eligible
           ORDER BY lot_number LIMIT 1`,
          [auctionId]
        );
        if (!rows[0]) throw new ApiError(409, 'No players are waiting. Choose an unsold player to bring back, or complete the auction.');
        lot = await lockLot(client, auctionId, rows[0].lot_id);
      }
      if (!lot.is_eligible) throw new ApiError(409, 'This player is marked ineligible.');
      if (!['PENDING', 'UNSOLD'].includes(lot.status)) throw new ApiError(409, 'This player cannot be auctioned now.');

      // An unsold player coming back starts a fresh round of bidding.
      const round = lot.status === 'UNSOLD' ? lot.bid_round + 1 : lot.bid_round;
      await client.query(
        `UPDATE auction_lots SET status = 'ON_BLOCK', bid_round = $2, current_bid_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE lot_id = $1`,
        [lot.lot_id, round]
      );
      await client.query('UPDATE auctions SET current_lot_id = $2 WHERE auction_id = $1', [auctionId, lot.lot_id]);
      log('PLAYER_UP', { lot_id: lot.lot_id, amount: lot.base_price, details: { round, previous_status: lot.status } });
      return repo.findLot(auctionId, lot.lot_id, client);
    });
  },

  placeBid(auctionId, { lot_id: lotId, team_id: teamId, amount }, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE'], 'Bidding');
      const lot = await lockCurrentLot(client, auction, lotId);
      const highest = await currentBid(client, lot);
      const minimum = highest ? highest.amount + auction.min_bid_increment : lot.base_price;
      if (amount < minimum) throw new ApiError(400, `The bid must be at least ${minimum} points.`);
      if (highest && highest.team_id === teamId) throw new ApiError(400, 'This team already has the highest bid.');
      await assertCanBuy(client, auctionId, teamId, lot, amount);

      const { rows } = await client.query(
        `INSERT INTO auction_bids (auction_id, lot_id, bid_round, team_id, amount, placed_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING bid_id, amount, team_id, placed_at`,
        [auctionId, lot.lot_id, lot.bid_round, teamId, amount, actorId]
      );
      await client.query(
        'UPDATE auction_lots SET current_bid_id = $2, updated_at = CURRENT_TIMESTAMP WHERE lot_id = $1',
        [lot.lot_id, rows[0].bid_id]
      );
      log('BID_PLACED', { lot_id: lot.lot_id, team_id: teamId, bid_id: rows[0].bid_id, amount, details: { round: lot.bid_round } });
      return rows[0];
    });
  },

  sell(auctionId, lotId, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE'], 'Selling');
      const lot = await lockCurrentLot(client, auction, lotId);
      const winning = await currentBid(client, lot);
      if (!winning) throw new ApiError(409, 'There are no bids for this player. Mark them unsold instead.');
      await assertCanBuy(client, auctionId, winning.team_id, lot, winning.amount);

      await client.query(
        `UPDATE auction_lots SET status = 'SOLD', team_id = $2, sold_price = $3, sold_bid_id = $4,
           sold_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE lot_id = $1`,
        [lot.lot_id, winning.team_id, winning.amount, winning.bid_id]
      );
      await client.query('UPDATE auctions SET current_lot_id = NULL WHERE auction_id = $1', [auctionId]);
      log('PLAYER_SOLD', { lot_id: lot.lot_id, team_id: winning.team_id, bid_id: winning.bid_id, amount: winning.amount });
      return repo.findLot(auctionId, lot.lot_id, client);
    });
  },

  markUnsold(auctionId, lotId, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE'], 'Marking unsold');
      const lot = await lockCurrentLot(client, auction, lotId);
      if (lot.current_bid_id) {
        throw new ApiError(409, 'This player has bids. Sell to the highest bidder, or restart the bidding first.');
      }
      await client.query(
        `UPDATE auction_lots SET status = 'UNSOLD', updated_at = CURRENT_TIMESTAMP WHERE lot_id = $1`,
        [lot.lot_id]
      );
      await client.query('UPDATE auctions SET current_lot_id = NULL WHERE auction_id = $1', [auctionId]);
      log('PLAYER_UNSOLD', { lot_id: lot.lot_id });
      return repo.findLot(auctionId, lot.lot_id, client);
    });
  },

  /** Discards the current round's bids (they stay in history) and starts bidding again. Needs a reason. */
  restartBidding(auctionId, lotId, reason, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE', 'PAUSED'], 'Restarting bidding');
      const lot = await lockCurrentLot(client, auction, lotId);
      await client.query(
        `UPDATE auction_lots SET bid_round = bid_round + 1, current_bid_id = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE lot_id = $1`,
        [lot.lot_id]
      );
      log('BIDDING_RESTARTED', { lot_id: lot.lot_id, details: { reason, discarded_round: lot.bid_round } });
      return repo.findLot(auctionId, lot.lot_id, client);
    });
  },

  /** Undoes a sale or an unsold result so the player can be auctioned again. Needs a reason. */
  reopen(auctionId, lotId, reason, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE', 'PAUSED'], 'Reopening a player');
      const lot = await lockLot(client, auctionId, lotId);
      if (!['SOLD', 'UNSOLD'].includes(lot.status)) throw new ApiError(409, 'Only sold or unsold players can be reopened.');
      await client.query(
        `UPDATE auction_lots SET status = 'PENDING', team_id = NULL, sold_price = NULL, sold_bid_id = NULL,
           current_bid_id = NULL, sold_at = NULL, bid_round = bid_round + 1, updated_at = CURRENT_TIMESTAMP
         WHERE lot_id = $1`,
        [lotId]
      );
      log('PLAYER_REOPENED', {
        lot_id: lotId,
        team_id: lot.team_id,
        amount: lot.sold_price == null ? null : Number(lot.sold_price),
        details: { reason, previous_status: lot.status, previous_bid_id: lot.sold_bid_id },
      });
      return repo.findLot(auctionId, lotId, client);
    });
  },

  // ---------------- Reads ----------------

  list: () => repo.listAuctions(),

  async detail(auctionId) {
    const auction = await repo.findAuction(auctionId);
    if (!auction) throw new ApiError(404, 'Auction not found');
    const [categories, teams, lots, registrations] = await Promise.all([
      repo.findCategories(auctionId),
      auction.is_legacy ? repo.findLegacyTeams(auctionId) : repo.findTeams(auctionId),
      repo.findLots(auctionId),
      repo.countRegistrations(auction.event_id),
    ]);
    const current = lots.find((l) => l.lot_id === auction.current_lot_id) ?? null;
    const currentBids = current ? await repo.findRoundBids(current.lot_id, current.bid_round) : [];
    const inPool = lots.filter((l) => l.status !== 'WITHDRAWN');
    const eligible = inPool.filter((l) => l.is_eligible);
    const sold = inPool.filter((l) => l.status === 'SOLD');
    const unsold = inPool.filter((l) => l.status === 'UNSOLD');
    const decided = sold.length + unsold.length;
    return {
      auction: { ...auction, version: Number(auction.version) },
      categories,
      teams,
      lots,
      current: current && { ...current, bids: currentBids, next_min_bid: currentBids[0] ? currentBids[0].amount + auction.min_bid_increment : current.base_price },
      stats: {
        registered: registrations,
        pool: inPool.length,
        eligible: eligible.length,
        available: eligible.filter((l) => l.status === 'PENDING').length,
        sold: sold.length,
        unsold: unsold.length,
        withdrawn: lots.length - inPool.length,
        total_spent: sold.reduce((sum, l) => sum + l.sold_price, 0),
        progress: eligible.length ? Math.round((decided / eligible.length) * 100) : 0,
      },
    };
  },

  async candidates(auctionId) {
    const auction = await repo.findAuction(auctionId);
    if (!auction) throw new ApiError(404, 'Auction not found');
    if (!auction.event_id) return [];
    return repo.findCandidates(auctionId, auction.event_id);
  },

  bids: (auctionId) => repo.findBids(auctionId),
  events: (auctionId) => repo.findEvents(auctionId),

  async listSeasons() {
    const { rows } = await pool.query('SELECT season_id, season_name, season_year FROM seasons ORDER BY season_year DESC');
    return rows;
  },

  async listTournaments() {
    const { rows } = await pool.query(
      `SELECT e.event_id, e.title, e.event_date, e.is_archived,
              (SELECT a.auction_id FROM auctions a WHERE a.event_id = e.event_id) AS auction_id
       FROM events e JOIN activity_categories c ON c.category_id = e.category_id
       WHERE e.kind = 'TOURNAMENT' AND c.slug = $1
       ORDER BY e.event_date DESC NULLS LAST, e.event_id DESC`,
      [CRICKET_SLUG]
    );
    return rows;
  },

  async teamOptions(auctionId) {
    const auction = await repo.findAuction(auctionId);
    if (!auction) throw new ApiError(404, 'Auction not found');
    const categoryId = auction.event_category_id ?? (await findCricketCategoryId(pool));
    const { rows } = await pool.query(
      `SELECT t.team_id, t.team_name, t.short_name, t.team_logo,
              EXISTS (SELECT 1 FROM tournament_teams tt WHERE tt.event_id = $2 AND tt.team_id = t.team_id) AS in_tournament
       FROM teams t WHERE t.category_id = $1 AND t.is_active ORDER BY t.team_name`,
      [categoryId, auction.event_id]
    );
    return rows;
  },
};

module.exports = service;
