const pool = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const repo = require('./auctionManage.repository');
const snapshot = require('./auctionSnapshot');
const stream = require('./auctionStream');
const { toPublicPath, removeUploadedFile } = require('../../utils/uploadFiles');
const { LIFECYCLE, SETUP_STATUSES, OPEN_STATUSES } = require('./auction.constants');
const { categoryMode, squadRoundState, STANDARD_CATEGORIES, normalizeCategoryName } = require('./auctionLiveRules');

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
    // Pre-migration auctions were flagged is_legacy. If this one already uses a modern
    // lifecycle status, clear the flag so live bidding can continue.
    if (auction.is_legacy) {
      if (OPEN_STATUSES.includes(auction.status)) {
        await client.query('UPDATE auctions SET is_legacy = FALSE, updated_at = CURRENT_TIMESTAMP WHERE auction_id = $1', [
          auctionId,
        ]);
        auction.is_legacy = false;
      } else {
        throw new ApiError(
          409,
          'This auction is kept as history from before the auction system and cannot be changed. Use “Enable live bidding” on this auction, or create a new auction.'
        );
      }
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

/** The event must be a cricket tournament that requires an auction; returns it. */
const loadTournament = async (db, eventId) => {
  const { rows } = await db.query(
    `SELECT e.event_id, e.title, e.category_id, e.kind, e.requires_auction, c.slug AS category_slug
     FROM events e LEFT JOIN activity_categories c ON c.category_id = e.category_id
     WHERE e.event_id = $1`,
    [eventId]
  );
  const event = rows[0];
  if (!event || event.kind !== 'TOURNAMENT') throw new ApiError(400, 'Tournament not found');
  if (event.category_slug !== CRICKET_SLUG) throw new ApiError(400, 'Auctions are only available for cricket tournaments.');
  if (!event.requires_auction) {
    throw new ApiError(400, 'This tournament does not require an auction. Enable “Requires auction” on the tournament first.');
  }
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
  // Cricket rule: every team may have at most one Icon Player.
  if (category && categoryMode(category.name) === 'icon' && (counts[category.auction_category_id] ?? 0) >= 1) {
    throw new ApiError(400, `${team.team_name} already has an Icon Player. Only one Icon Player is allowed per team.`);
  }
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

const loadSquadRound = async (client, auctionId, categoryId, teamCount) => {
  const { rows: sold } = await client.query(
    `SELECT lot_id, team_id FROM auction_lots
     WHERE auction_id = $1 AND auction_category_id = $2 AND status = 'SOLD'
     ORDER BY sold_at ASC NULLS LAST, lot_id ASC`,
    [auctionId, categoryId]
  );
  const { rows: pendingRows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM auction_lots
     WHERE auction_id = $1 AND auction_category_id = $2 AND is_eligible
       AND status IN ('PENDING', 'ON_BLOCK', 'UNSOLD')`,
    [auctionId, categoryId]
  );
  return squadRoundState({
    soldOrdered: sold,
    teamCount,
    pendingCount: pendingRows[0]?.n ?? 0,
  });
};

/** Match an auction category row to a standard live-desk label. */
const matchStandardCategory = (name) => {
  const n = normalizeCategoryName(name);
  return (
    STANDARD_CATEGORIES.find((label) => {
      const s = normalizeCategoryName(label);
      if (s.includes('icon')) return n.includes('icon');
      if (s.includes('allrounder')) return n.includes('allrounder');
      if (s.includes('batsman')) return n.includes('batsman');
      if (s.includes('bowler')) return n.includes('bowler');
      if (s.includes('other')) return n.includes('other');
      return false;
    }) ?? null
  );
};

const toLivePlayer = (l) => ({
  lot_id: l.lot_id,
  lot_number: l.lot_number,
  player_name: l.player_name,
  status: l.status,
  vibhaag: l.vibhaag,
  profile_photo: l.profile_photo,
  base_price: l.base_price,
  team_name: l.team_name,
  sold_price: l.sold_price,
});

/** Admin live desk payload: categories, round locks, and per-team bid eligibility for the current player. */
const buildLiveBoard = (lots, categories, teams, current) => {
  const byCategoryId = new Map(categories.map((c) => [c.auction_category_id, []]));
  for (const lot of lots) {
    if (lot.status === 'WITHDRAWN' || !lot.is_eligible) continue;
    if (lot.auction_category_id && byCategoryId.has(lot.auction_category_id)) {
      byCategoryId.get(lot.auction_category_id).push(lot);
    }
  }

  // Always show the five standard categories, even when empty / not yet created on the auction.
  const usedIds = new Set();
  const categoryBoards = STANDARD_CATEGORIES.map((label) => {
    const matched = categories.find((c) => matchStandardCategory(c.name) === label && !usedIds.has(c.auction_category_id));
    if (matched) usedIds.add(matched.auction_category_id);
    const mode = categoryMode(label);
    const players = matched ? byCategoryId.get(matched.auction_category_id) ?? [] : [];
    const pending = players.filter((l) => ['PENDING', 'ON_BLOCK', 'UNSOLD'].includes(l.status));
    const remaining = pending.filter((l) => l.status === 'PENDING' || l.status === 'UNSOLD').length;
    const sold = players
      .filter((l) => l.status === 'SOLD')
      .sort((a, b) => String(a.sold_at).localeCompare(String(b.sold_at)) || a.lot_id - b.lot_id);
    let round = null;
    if (mode === 'squad_round') {
      round = squadRoundState({
        soldOrdered: sold,
        teamCount: teams.length,
        pendingCount: pending.length,
      });
    }
    return {
      auction_category_id: matched?.auction_category_id ?? null,
      name: label,
      mode,
      players: players.map(toLivePlayer),
      waiting: remaining,
      remaining,
      on_block: pending.some((l) => l.status === 'ON_BLOCK'),
      round,
    };
  });

  let lockedTeamIds = new Set();
  let currentMode = 'open';
  if (current?.auction_category_id) {
    const category = categories.find((c) => c.auction_category_id === current.auction_category_id);
    currentMode = categoryMode(category?.name);
    if (currentMode === 'squad_round') {
      const sold = lots
        .filter((l) => l.auction_category_id === current.auction_category_id && l.status === 'SOLD')
        .sort((a, b) => String(a.sold_at || '').localeCompare(String(b.sold_at || '')) || a.lot_id - b.lot_id);
      const pendingCount = lots.filter(
        (l) =>
          l.auction_category_id === current.auction_category_id &&
          l.is_eligible &&
          ['PENDING', 'ON_BLOCK', 'UNSOLD'].includes(l.status)
      ).length;
      const round = squadRoundState({ soldOrdered: sold, teamCount: teams.length, pendingCount });
      lockedTeamIds = new Set(round.locked_team_ids);
    } else if (currentMode === 'icon') {
      // Cricket: one Icon Player per team.
      lockedTeamIds = new Set(
        lots
          .filter((l) => l.auction_category_id === current.auction_category_id && l.status === 'SOLD' && l.team_id)
          .map((l) => l.team_id)
      );
    }
  }

  const teamBids = new Map();
  if (current?.bids) {
    for (const b of current.bids) teamBids.set(b.team_id, b);
  }

  const teamCards = teams.map((t) => {
    let bid_blocked_reason = '';
    if (!current) bid_blocked_reason = 'No player on the block';
    else if (t.slots_left <= 0) bid_blocked_reason = `Squad full (${t.max_players} players)`;
    else if (currentMode === 'icon' && lockedTeamIds.has(t.team_id)) {
      bid_blocked_reason = 'Already has an Icon Player';
    } else if (lockedTeamIds.has(t.team_id)) bid_blocked_reason = 'Already bought in this round';
    else if (currentMode === 'icon') bid_blocked_reason = 'Icon players are assigned, not bid';
    else if (teamBids.has(t.team_id)) bid_blocked_reason = 'Already bid on this player';

    return {
      ...t,
      bid_blocked_reason,
      already_bid: teamBids.has(t.team_id),
      bid_amount: teamBids.get(t.team_id)?.amount ?? null,
      can_bid: Boolean(current) && currentMode !== 'icon' && !bid_blocked_reason,
      can_assign:
        Boolean(current) &&
        currentMode === 'icon' &&
        t.slots_left > 0 &&
        !lockedTeamIds.has(t.team_id),
    };
  });

  return {
    categories: categoryBoards,
    current_mode: current ? currentMode : null,
    teams: teamCards,
  };
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

/** Use the given season, or the latest one when the admin form does not send a season. */
const resolveSeasonId = async (client, seasonId) => {
  if (seasonId) {
    const season = await client.query('SELECT season_id FROM seasons WHERE season_id = $1', [seasonId]);
    if (!season.rows[0]) throw new ApiError(400, 'Season not found');
    return season.rows[0].season_id;
  }
  const latest = await client.query(
    'SELECT season_id FROM seasons ORDER BY season_year DESC, season_id DESC LIMIT 1'
  );
  if (!latest.rows[0]) throw new ApiError(400, 'No season exists yet. Add a season before creating an auction.');
  return latest.rows[0].season_id;
};

const SETTING_FIELDS = [
  'title', 'description', 'rules', 'auction_date', 'venue', 'season_id', 'event_id',
  'budget_per_team', 'max_players_per_team', 'min_players_per_team', 'min_bid_increment', 'default_base_price',
];
/** Settings that may still change once bidding has started. */
const LIVE_EDITABLE = ['title', 'description', 'rules', 'auction_date', 'venue', 'min_bid_increment'];

/** Cricket auctions: Icon Player is one per team (pool size = team count). */
const normalizeCategoryInput = (c) => {
  const name = String(c.name || '').trim();
  if (categoryMode(name) === 'icon') {
    return { ...c, name, min_per_team: 1, max_per_team: 1 };
  }
  return { ...c, name };
};

const countIconLots = async (client, auctionId, iconCategoryId) => {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS n FROM auction_lots
     WHERE auction_id = $1 AND auction_category_id = $2
       AND is_eligible AND status <> 'WITHDRAWN'`,
    [auctionId, iconCategoryId]
  );
  return rows[0].n;
};

const assertIconPoolFitsTeams = async (client, auctionId, iconCategoryId, teamCount, adding = 0) => {
  if (!iconCategoryId || teamCount < 1) return;
  const current = await countIconLots(client, auctionId, iconCategoryId);
  if (current + adding > teamCount) {
    throw new ApiError(
      409,
      `Icon Player is cricket-only and limited to one per team. You can have at most ${teamCount} Icon Player(s) for ${teamCount} team(s) (already ${current} in the pool).`
    );
  }
};

const service = {
  mutate,

  // ---------------- Setup ----------------

  async create(body, actorId) {
    const client = await pool.connect();
    let auctionId;
    try {
      await client.query('BEGIN');
      const seasonId = await resolveSeasonId(client, body.season_id);
      if (body.event_id) await loadTournament(client, body.event_id);
      if ((body.min_players_per_team ?? 0) > body.max_players_per_team) {
        throw new ApiError(400, 'Minimum squad size cannot be more than the maximum.');
      }

      const { rows } = await client.query(
        `INSERT INTO auctions (season_id, event_id, title, description, rules, auction_date, venue, status,
                               is_legacy, budget_per_team, max_players_per_team, min_players_per_team, min_bid_increment,
                               default_base_price, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'DRAFT', FALSE, $8, $9, $10, $11, $12, $13, $13)
         RETURNING auction_id`,
        [seasonId, body.event_id ?? null, body.title, body.description ?? null, body.rules ?? null,
          body.auction_date ?? null, body.venue ?? null, body.budget_per_team, body.max_players_per_team,
          body.min_players_per_team ?? 0, body.min_bid_increment, body.default_base_price ?? 0, actorId]
      );
      auctionId = rows[0].auction_id;

      for (const [i, raw] of (body.categories ?? []).entries()) {
        const c = normalizeCategoryInput(raw);
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
      const normalized = categories.map(normalizeCategoryInput);
      const names = normalized.map((c) => c.name.toLowerCase());
      if (new Set(names).size !== names.length) throw new ApiError(400, 'Category names must be different.');

      const existing = await repo.findCategories(auctionId, client);
      const keepIds = normalized.map((c) => c.auction_category_id).filter(Boolean);
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
      for (const c of normalized.filter((x) => x.auction_category_id)) {
        await client.query(`UPDATE auction_categories SET name = '~' || auction_category_id WHERE auction_category_id = $1`, [c.auction_category_id]);
      }
      for (const [i, c] of normalized.entries()) {
        const values = [c.name, i, c.base_price ?? null, c.min_per_team ?? 0, c.max_per_team ?? null];
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
      log('CATEGORIES_UPDATED', { details: { before: existing, after: normalized } });
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

      // Keep Icon Player at one-per-team whenever the squad list changes.
      await client.query(
        `UPDATE auction_categories
         SET min_per_team = 1, max_per_team = 1, updated_at = CURRENT_TIMESTAMP
         WHERE auction_id = $1 AND lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')) LIKE '%icon%'`,
        [auctionId]
      );

      return repo.findTeams(auctionId, client);
    });
  },

  // ---------------- Player pool ----------------

  addPlayers(auctionId, { user_ids: userIds = [], lot_ids: lotIds = [], auction_category_id: categoryId }, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, OPEN_STATUSES, 'Adding players');
      if (!auction.event_id) throw new ApiError(400, 'Link the auction to a tournament first; its registrations form the player pool.');

      let basePrice = auction.default_base_price;
      let iconCategoryId = null;
      if (categoryId) {
        const { rows } = await client.query(
          'SELECT name, base_price FROM auction_categories WHERE auction_id = $1 AND auction_category_id = $2',
          [auctionId, categoryId]
        );
        if (!rows[0]) throw new ApiError(400, 'Unknown category');
        basePrice = rows[0].base_price ?? basePrice;
        if (categoryMode(rows[0].name) === 'icon') iconCategoryId = categoryId;
      }
      if (iconCategoryId) {
        const teams = await repo.findTeams(auctionId, client);
        await assertIconPoolFitsTeams(
          client,
          auctionId,
          iconCategoryId,
          teams.length,
          userIds.length + lotIds.length
        );
      }

      const added = [];
      const restoreWithdrawn = async (lotId, extras = {}) => {
        await client.query(
          `UPDATE auction_lots SET
             status = 'PENDING',
             base_price = $3,
             auction_category_id = $4,
             is_eligible = TRUE,
             eligibility_note = NULL,
             registration_id = COALESCE($5, registration_id),
             player_name = COALESCE($6, player_name),
             vibhaag = COALESCE($7, vibhaag),
             updated_at = CURRENT_TIMESTAMP
           WHERE lot_id = $1 AND auction_id = $2 AND status = 'WITHDRAWN'`,
          [
            lotId,
            auctionId,
            extras.base_price ?? basePrice,
            categoryId ?? null,
            extras.registration_id ?? null,
            extras.player_name ?? null,
            extras.vibhaag ?? null,
          ]
        );
        added.push(lotId);
      };

      if (lotIds.length) {
        const { rows: withdrawn } = await client.query(
          `SELECT lot_id FROM auction_lots
           WHERE auction_id = $1 AND lot_id = ANY($2::int[]) AND status = 'WITHDRAWN'`,
          [auctionId, lotIds]
        );
        for (const row of withdrawn) {
          await restoreWithdrawn(row.lot_id);
        }
      }

      if (userIds.length) {
        const { rows: regs } = await client.query(
          `SELECT r.registration_id, u.user_id, COALESCE(u.full_name, u.first_name || ' ' || u.last_name) AS full_name, u.vibhaag,
                  w.lot_id AS withdrawn_lot_id
           FROM tournament_registrations r
           JOIN users u ON u.user_id = r.user_id
           LEFT JOIN auction_lots w ON w.auction_id = $3 AND w.user_id = r.user_id AND w.status = 'WITHDRAWN'
           WHERE r.event_id = $1 AND r.user_id = ANY($2)
             AND NOT EXISTS (
               SELECT 1 FROM auction_lots l
               WHERE l.auction_id = $3 AND l.user_id = r.user_id AND l.status <> 'WITHDRAWN'
             )
           ORDER BY full_name`,
          [auction.event_id, userIds, auctionId]
        );

        const { rows: max } = await client.query(
          'SELECT COALESCE(MAX(lot_number), 0) AS n FROM auction_lots WHERE auction_id = $1',
          [auctionId]
        );
        let lotNumber = Number(max[0].n);
        for (const r of regs) {
          if (r.withdrawn_lot_id) {
            await restoreWithdrawn(r.withdrawn_lot_id, {
              registration_id: r.registration_id,
              player_name: r.full_name,
              vibhaag: r.vibhaag,
              base_price: basePrice,
            });
            continue;
          }
          lotNumber += 1;
          const { rows } = await client.query(
            `INSERT INTO auction_lots (auction_id, lot_number, player_name, vibhaag, base_price, user_id, registration_id, auction_category_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING lot_id`,
            [auctionId, lotNumber, r.full_name, r.vibhaag, basePrice, r.user_id, r.registration_id, categoryId ?? null]
          );
          added.push(rows[0].lot_id);
        }
      }

      if (added.length === 0) {
        throw new ApiError(400, 'None of these players can be added: they are not registered for the tournament or are already in the pool.');
      }
      log('PLAYERS_ADDED', { details: { lot_ids: added, user_ids: userIds, restored_lot_ids: lotIds } });
      return { added: added.length, skipped: userIds.length + lotIds.length - added.length };
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
          'SELECT auction_category_id, name FROM auction_categories WHERE auction_id = $1 AND auction_category_id = $2',
          [auctionId, body.auction_category_id]
        );
        if (!rows[0]) throw new ApiError(400, 'Unknown category');
        if (categoryMode(rows[0].name) === 'icon' && lot.auction_category_id !== body.auction_category_id) {
          const teams = await repo.findTeams(auctionId, client);
          await assertIconPoolFitsTeams(client, auctionId, body.auction_category_id, teams.length, 1);
        }
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
      const { rows } = await client.query(
        `SELECT lot_id FROM auction_lots WHERE auction_id = $1 AND status <> 'WITHDRAWN' FOR UPDATE`,
        [auctionId]
      );
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

  /**
   * Turns a read-only legacy (pre-system) auction into a normal auction so it can be set up
   * and run with live bidding. UPCOMING / completed / cancelled legacy records open as DRAFT.
   */
  async enableLiveBidding(auctionId, actorId) {
    const client = await pool.connect();
    let committed = false;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM auctions WHERE auction_id = $1 FOR UPDATE', [auctionId]);
      const auction = rows[0];
      if (!auction) throw new ApiError(404, 'Auction not found');
      if (!auction.is_legacy) {
        await client.query('COMMIT');
        return { auction_id: auctionId, status: auction.status, is_legacy: false };
      }

      const status = OPEN_STATUSES.includes(auction.status) ? auction.status : 'DRAFT';
      const { rows: ver } = await client.query(
        `UPDATE auctions
         SET is_legacy = FALSE,
             status = $2,
             version = version + 1,
             updated_at = CURRENT_TIMESTAMP,
             updated_by = $3,
             cancel_reason = CASE WHEN $2 = 'DRAFT' THEN NULL ELSE cancel_reason END,
             cancelled_at = CASE WHEN $2 = 'DRAFT' THEN NULL ELSE cancelled_at END
         WHERE auction_id = $1
         RETURNING version`,
        [auctionId, status, actorId]
      );
      await client.query(
        `INSERT INTO auction_events (auction_id, seq, event_type, details, actor_user_id)
         VALUES ($1, $2, 'STATUS_CHANGED', $3, $4)`,
        [
          auctionId,
          Number(ver[0].version),
          { action: 'enable_live_bidding', from: auction.status, to: status, was_legacy: true },
          actorId,
        ]
      );
      await client.query('COMMIT');
      committed = true;
      return { auction_id: auctionId, status, is_legacy: false };
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
        const iconCat = categories.find((c) => categoryMode(c.name) === 'icon');
        if (iconCat) {
          const iconCount = await countIconLots(client, auctionId, iconCat.auction_category_id);
          if (iconCount !== teams.length) {
            throw new ApiError(
              409,
              `Icon Player is cricket-only and must equal the number of teams (${teams.length}). The pool currently has ${iconCount}.`
            );
          }
        }
      }

      if (action === 'start') {
        const other = await repo.findLiveAuction(auctionId, client);
        if (other) {
          throw new ApiError(
            409,
            `Only one auction can be live at a time. "${other.title}" is already ${other.status.toLowerCase()}. Complete or cancel it first.`
          );
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

  /** Puts a player up for bidding (and on the public live screen): next waiting, or a chosen waiting/unsold one. */
  nextPlayer(auctionId, lotId, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE', 'PAUSED'], 'Bringing up a player');
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
      const categories = await repo.findCategories(auctionId, client);
      const category = categories.find((c) => c.auction_category_id === lot.auction_category_id);
      const mode = categoryMode(category?.name);
      if (mode === 'icon') {
        throw new ApiError(409, 'Icon players are assigned without bidding. Use Assign to team.');
      }

      const teams = await repo.findTeams(auctionId, client);
      if (mode === 'squad_round' && category) {
        const roundInfo = await loadSquadRound(client, auctionId, category.auction_category_id, teams.length);
        if (roundInfo.locked_team_ids.includes(teamId)) {
          throw new ApiError(
            409,
            'This team already acquired a player in the current category round and cannot bid again until the next round.'
          );
        }
      }

      const { rows: prior } = await client.query(
        `SELECT bid_id, amount FROM auction_bids
         WHERE lot_id = $1 AND bid_round = $2 AND team_id = $3
         ORDER BY amount DESC LIMIT 1`,
        [lot.lot_id, lot.bid_round, teamId]
      );
      if (prior[0]) {
        throw new ApiError(409, 'This team has already submitted a bid for this player in the current round.');
      }

      const highest = await currentBid(client, lot);
      // Opening bid may be 0; later bids must beat the current highest.
      const minimum = highest ? highest.amount + 1 : 0;
      if (amount < minimum) {
        throw new ApiError(400, highest ? `The bid must be more than ${highest.amount} points.` : 'The bid cannot be negative.');
      }
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
      log('BID_PLACED', {
        lot_id: lot.lot_id,
        team_id: teamId,
        bid_id: rows[0].bid_id,
        amount,
        details: { round: lot.bid_round, category_mode: mode },
      });
      return rows[0];
    });
  },

  /**
   * Assigns a player to a team without bidding (Icon / paper cheat), or at a fixed amount.
   * Puts the lot on block briefly then marks sold so the public screen updates.
   */
  assignPlayer(auctionId, { lot_id: lotId, team_id: teamId, amount = 0 }, actorId) {
    return mutate(auctionId, actorId, async ({ client, auction, log }) => {
      assertStatus(auction, ['LIVE', 'PAUSED'], 'Assigning a player');
      if (auction.current_lot_id && auction.current_lot_id !== lotId) {
        throw new ApiError(409, 'Mark the current player sold or unsold first.');
      }
      const lot = await lockLot(client, auctionId, lotId);
      if (!lot.is_eligible) throw new ApiError(409, 'This player is marked ineligible.');
      if (!['PENDING', 'UNSOLD', 'ON_BLOCK'].includes(lot.status)) {
        throw new ApiError(409, 'This player cannot be assigned now.');
      }
      const categories = await repo.findCategories(auctionId, client);
      const category = categories.find((c) => c.auction_category_id === lot.auction_category_id);
      const mode = categoryMode(category?.name);
      if (mode !== 'icon' && lot.status !== 'ON_BLOCK') {
        throw new ApiError(409, 'Only Icon players can be assigned without opening bidding.');
      }
      if (amount < 0) throw new ApiError(400, 'Points cannot be negative.');
      await assertCanBuy(client, auctionId, teamId, lot, amount);

      if (lot.status !== 'ON_BLOCK') {
        const round = lot.status === 'UNSOLD' ? lot.bid_round + 1 : lot.bid_round;
        await client.query(
          `UPDATE auction_lots SET status = 'ON_BLOCK', bid_round = $2, current_bid_id = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE lot_id = $1`,
          [lot.lot_id, round]
        );
        await client.query('UPDATE auctions SET current_lot_id = $2 WHERE auction_id = $1', [auctionId, lot.lot_id]);
        lot.bid_round = round;
        log('PLAYER_UP', { lot_id: lot.lot_id, amount, details: { assign: true, previous_status: lot.status } });
      }

      const { rows: bidRows } = await client.query(
        `INSERT INTO auction_bids (auction_id, lot_id, bid_round, team_id, amount, placed_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING bid_id`,
        [auctionId, lot.lot_id, lot.bid_round, teamId, amount, actorId]
      );
      await client.query(
        `UPDATE auction_lots SET status = 'SOLD', team_id = $2, sold_price = $3, sold_bid_id = $4, current_bid_id = $4,
           sold_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE lot_id = $1`,
        [lot.lot_id, teamId, amount, bidRows[0].bid_id]
      );
      await client.query('UPDATE auctions SET current_lot_id = NULL WHERE auction_id = $1', [auctionId]);
      log('PLAYER_SOLD', {
        lot_id: lot.lot_id,
        team_id: teamId,
        bid_id: bidRows[0].bid_id,
        amount,
        details: { assigned: true, category_mode: mode },
      });
      return repo.findLot(auctionId, lot.lot_id, client);
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

  async list() {
    // Clear incorrect legacy flags on any modern-status auctions before listing.
    await pool.query(
      `UPDATE auctions SET is_legacy = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE is_legacy AND status = ANY($1::text[])`,
      [OPEN_STATUSES]
    );
    const auctions = await repo.listAuctions();
    const live = auctions.find((a) => a.status === 'LIVE' || a.status === 'PAUSED') ?? null;
    return { auctions, live };
  },

  async detail(auctionId) {
    let auction = await repo.findAuction(auctionId);
    if (!auction) throw new ApiError(404, 'Auction not found');
    // Heal auctions that were bulk-flagged legacy but already use the modern lifecycle.
    if (auction.is_legacy && OPEN_STATUSES.includes(auction.status)) {
      await pool.query(
        'UPDATE auctions SET is_legacy = FALSE, updated_at = CURRENT_TIMESTAMP WHERE auction_id = $1',
        [auctionId]
      );
      auction = { ...auction, is_legacy: false };
    }
    const [categories, teams, lots, registrations, blockingLive] = await Promise.all([
      repo.findCategories(auctionId),
      auction.is_legacy ? repo.findLegacyTeams(auctionId) : repo.findTeams(auctionId),
      repo.findLots(auctionId),
      repo.countRegistrations(auction.event_id),
      repo.findLiveAuction(auctionId),
    ]);
    const current =
      lots.find((l) => l.lot_id === auction.current_lot_id && l.status === 'ON_BLOCK') ??
      lots.find((l) => l.status === 'ON_BLOCK') ??
      null;
    const currentBids = current ? await repo.findRoundBids(current.lot_id, current.bid_round) : [];
    const currentView = current && {
      ...current,
      bids: currentBids,
      next_min_bid: currentBids[0] ? currentBids[0].amount + 1 : 0,
    };
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
      current: currentView,
      live_board: buildLiveBoard(lots, categories, teams, currentView),
      blocking_live: blockingLive,
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
      `SELECT e.event_id, e.title, e.event_date, e.is_archived, e.requires_auction,
              (SELECT a.auction_id FROM auctions a WHERE a.event_id = e.event_id) AS auction_id
       FROM events e JOIN activity_categories c ON c.category_id = e.category_id
       WHERE e.kind = 'TOURNAMENT' AND c.slug = $1
         AND (e.requires_auction = TRUE
              OR EXISTS (SELECT 1 FROM auctions a WHERE a.event_id = e.event_id))
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

  async setImage(auctionId, file) {
    if (!file) throw new ApiError(400, 'Choose an image file to upload.');
    const newPath = toPublicPath(file.filename);
    const previous = await repo.findImageById(auctionId);
    if (!previous) {
      await removeUploadedFile(newPath);
      throw new ApiError(404, 'Auction not found');
    }
    const row = await repo.findAuction(auctionId);
    if (row?.is_legacy) {
      await removeUploadedFile(newPath);
      throw new ApiError(
        409,
        'This auction is kept as history from before the auction system and cannot be changed. Create a new auction to run live bidding.'
      );
    }
    const item = await repo.setImage(auctionId, newPath);
    await removeUploadedFile(previous.image_url);
    return item;
  },

  async removeImage(auctionId) {
    const previous = await repo.findImageById(auctionId);
    if (!previous) throw new ApiError(404, 'Auction not found');
    const row = await repo.findAuction(auctionId);
    if (row?.is_legacy) {
      throw new ApiError(
        409,
        'This auction is kept as history from before the auction system and cannot be changed. Create a new auction to run live bidding.'
      );
    }
    const item = await repo.setImage(auctionId, null);
    await removeUploadedFile(previous.image_url);
    return item;
  },
};

module.exports = service;
