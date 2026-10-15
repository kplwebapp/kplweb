const pool = require('../../config/database');

/** Read queries for auction management. Each takes `db` (the pool or a transaction client). */

const AUCTION_SELECT = `
  SELECT a.*, s.season_name, s.season_year,
         e.title AS event_title, e.slug AS event_slug, e.category_id AS event_category_id
  FROM auctions a
  JOIN seasons s ON s.season_id = a.season_id
  LEFT JOIN events e ON e.event_id = a.event_id`;

const LOT_SELECT = `
  SELECT l.lot_id, l.auction_id, l.lot_number, l.player_name, l.player_role, l.vibhaag,
         l.base_price::int AS base_price, l.sold_price::int AS sold_price, l.team_id, l.status,
         l.sold_at, l.user_id, l.registration_id, l.auction_category_id, l.is_eligible,
         l.eligibility_note, l.bid_round, l.current_bid_id, l.sold_bid_id,
         c.name AS category_name,
         t.team_name, t.short_name AS team_short_name,
         u.profile_photo,
         cb.amount AS current_bid_amount, cb.team_id AS current_bid_team_id,
         ct.team_name AS current_bid_team_name,
         p.answers->>'batting_style' AS batting_style,
         p.answers->>'bowling_style' AS bowling_style,
         p.answers->>'is_wicketkeeper' AS is_wicketkeeper
  FROM auction_lots l
  LEFT JOIN auction_categories c ON c.auction_category_id = l.auction_category_id
  LEFT JOIN teams t ON t.team_id = l.team_id
  LEFT JOIN users u ON u.user_id = l.user_id
  LEFT JOIN auction_bids cb ON cb.bid_id = l.current_bid_id
  LEFT JOIN teams ct ON ct.team_id = cb.team_id
  LEFT JOIN LATERAL (
    SELECT answers FROM member_persona_profiles mp
    WHERE mp.user_id = l.user_id AND mp.persona_type = 'cricketer'
    ORDER BY mp.persona_profile_id LIMIT 1
  ) p ON TRUE`;

const repo = {
  listAuctions: async (db = pool) => {
    const { rows } = await db.query(
      `SELECT a.auction_id, a.title, a.status, a.is_legacy, a.auction_date, a.venue,
              a.season_id, s.season_name, s.season_year, a.event_id, e.title AS event_title,
              COUNT(l.lot_id) FILTER (WHERE l.status <> 'WITHDRAWN')::int AS pool_size,
              COUNT(l.lot_id) FILTER (WHERE l.status = 'SOLD')::int AS sold,
              (SELECT COUNT(*)::int FROM auction_teams at WHERE at.auction_id = a.auction_id) AS teams
       FROM auctions a
       JOIN seasons s ON s.season_id = a.season_id
       LEFT JOIN events e ON e.event_id = a.event_id
       LEFT JOIN auction_lots l ON l.auction_id = a.auction_id
       GROUP BY a.auction_id, s.season_id, e.event_id
       ORDER BY (a.status IN ('LIVE', 'PAUSED')) DESC, a.is_legacy, a.auction_date DESC NULLS LAST, a.auction_id DESC`
    );
    return rows;
  },

  listPublicAuctions: async (db = pool) => {
    const { rows } = await db.query(
      `SELECT a.auction_id, a.title, a.status, a.is_legacy, a.auction_date,
              s.season_name, s.season_year, e.title AS event_title
       FROM auctions a
       JOIN seasons s ON s.season_id = a.season_id
       LEFT JOIN events e ON e.event_id = a.event_id
       WHERE a.is_legacy OR a.status NOT IN ('DRAFT', 'CANCELLED')
       ORDER BY (a.status IN ('LIVE', 'PAUSED')) DESC, (a.status = 'READY') DESC,
                a.is_legacy, a.auction_date DESC NULLS LAST, a.auction_id DESC`
    );
    return rows;
  },

  findAuction: async (auctionId, db = pool) => {
    const { rows } = await db.query(`${AUCTION_SELECT} WHERE a.auction_id = $1`, [auctionId]);
    return rows[0] || null;
  },

  findVersion: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      'SELECT version, is_legacy, updated_at FROM auctions WHERE auction_id = $1',
      [auctionId]
    );
    return rows[0] || null;
  },

  findCategories: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      `SELECT auction_category_id, name, display_order, base_price, min_per_team, max_per_team
       FROM auction_categories WHERE auction_id = $1
       ORDER BY display_order, auction_category_id`,
      [auctionId]
    );
    return rows;
  },

  /** Participating teams with budget, spending and squad counts (sold players only). */
  findTeams: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      `SELECT at.team_id, at.budget, at.max_players, t.team_name, t.short_name, t.team_code, t.team_logo,
              COUNT(l.lot_id)::int AS players_bought,
              COALESCE(SUM(l.sold_price), 0)::int AS spent
       FROM auction_teams at
       JOIN teams t ON t.team_id = at.team_id
       LEFT JOIN auction_lots l ON l.auction_id = at.auction_id AND l.team_id = at.team_id AND l.status = 'SOLD'
       WHERE at.auction_id = $1
       GROUP BY at.team_id, at.budget, at.max_players, t.team_id
       ORDER BY t.team_name`,
      [auctionId]
    );
    return rows.map((r) => ({ ...r, remaining: r.budget - r.spent, slots_left: r.max_players - r.players_bought }));
  },

  /** Sold players per team and category: { [team_id]: { [auction_category_id]: count } }. */
  findTeamCategoryCounts: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      `SELECT team_id, auction_category_id, COUNT(*)::int AS n
       FROM auction_lots WHERE auction_id = $1 AND status = 'SOLD'
       GROUP BY team_id, auction_category_id`,
      [auctionId]
    );
    const counts = {};
    for (const r of rows) {
      counts[r.team_id] ??= {};
      counts[r.team_id][r.auction_category_id ?? 'none'] = r.n;
    }
    return counts;
  },

  findLots: async (auctionId, db = pool) => {
    const { rows } = await db.query(`${LOT_SELECT} WHERE l.auction_id = $1 ORDER BY l.lot_number`, [auctionId]);
    return rows;
  },

  findLot: async (auctionId, lotId, db = pool) => {
    const { rows } = await db.query(`${LOT_SELECT} WHERE l.auction_id = $1 AND l.lot_id = $2`, [auctionId, lotId]);
    return rows[0] || null;
  },

  /** Bids for one lot in its current round, highest first. */
  findRoundBids: async (lotId, round, db = pool) => {
    const { rows } = await db.query(
      `SELECT b.bid_id, b.team_id, t.team_name, t.short_name, b.amount, b.placed_at
       FROM auction_bids b JOIN teams t ON t.team_id = b.team_id
       WHERE b.lot_id = $1 AND b.bid_round = $2
       ORDER BY b.amount DESC`,
      [lotId, round]
    );
    return rows;
  },

  findBids: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      `SELECT b.bid_id, b.lot_id, l.lot_number, l.player_name, b.bid_round, b.team_id, t.team_name,
              b.amount, b.placed_at, COALESCE(u.full_name, u.first_name || ' ' || u.last_name) AS placed_by,
              (b.bid_id = l.sold_bid_id) AS is_winning,
              (b.bid_round = l.bid_round) AS is_current_round
       FROM auction_bids b
       JOIN auction_lots l ON l.lot_id = b.lot_id
       JOIN teams t ON t.team_id = b.team_id
       LEFT JOIN users u ON u.user_id = b.placed_by
       WHERE b.auction_id = $1
       ORDER BY b.placed_at DESC, b.bid_id DESC`,
      [auctionId]
    );
    return rows;
  },

  findEvents: async (auctionId, limit = 500, db = pool) => {
    const { rows } = await db.query(
      `SELECT ev.auction_event_id, ev.seq, ev.event_type, ev.lot_id, l.lot_number, l.player_name,
              ev.team_id, t.team_name, ev.amount, ev.details, ev.created_at,
              COALESCE(u.full_name, u.first_name || ' ' || u.last_name) AS actor
       FROM auction_events ev
       LEFT JOIN auction_lots l ON l.lot_id = ev.lot_id
       LEFT JOIN teams t ON t.team_id = ev.team_id
       LEFT JOIN users u ON u.user_id = ev.actor_user_id
       WHERE ev.auction_id = $1
       ORDER BY ev.seq DESC
       LIMIT $2`,
      [auctionId, limit]
    );
    return rows;
  },

  findLastEvent: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      `SELECT ev.seq, ev.event_type, ev.lot_id, ev.team_id, t.team_name, ev.amount, ev.created_at
       FROM auction_events ev LEFT JOIN teams t ON t.team_id = ev.team_id
       WHERE ev.auction_id = $1 ORDER BY ev.seq DESC LIMIT 1`,
      [auctionId]
    );
    return rows[0] || null;
  },

  /** Members registered for the auction's tournament who are not yet in its pool. */
  findCandidates: async (auctionId, eventId, db = pool) => {
    const { rows } = await db.query(
      `SELECT r.registration_id, r.registered_at, u.user_id,
              COALESCE(u.full_name, u.first_name || ' ' || u.last_name) AS full_name,
              u.vibhaag, u.profile_photo,
              p.answers->>'batting_style' AS batting_style,
              p.answers->>'bowling_style' AS bowling_style,
              p.answers->>'is_wicketkeeper' AS is_wicketkeeper
       FROM tournament_registrations r
       JOIN users u ON u.user_id = r.user_id
       LEFT JOIN LATERAL (
         SELECT answers FROM member_persona_profiles mp
         WHERE mp.user_id = u.user_id AND mp.persona_type = 'cricketer'
         ORDER BY mp.persona_profile_id LIMIT 1
       ) p ON TRUE
       WHERE r.event_id = $2
         AND NOT EXISTS (SELECT 1 FROM auction_lots l WHERE l.auction_id = $1 AND l.user_id = r.user_id)
       ORDER BY full_name`,
      [auctionId, eventId]
    );
    return rows;
  },

  countRegistrations: async (eventId, db = pool) => {
    if (!eventId) return 0;
    const { rows } = await db.query(
      'SELECT COUNT(*)::int AS n FROM tournament_registrations WHERE event_id = $1',
      [eventId]
    );
    return rows[0].n;
  },

  /** Legacy auctions have no participating-team list: every active team of the season counts. */
  findLegacyTeams: async (auctionId, db = pool) => {
    const { rows } = await db.query(
      `SELECT t.team_id, t.team_name, t.short_name, t.team_code, t.team_logo,
              a.budget_per_team::int AS budget, a.max_players_per_team AS max_players,
              COUNT(l.lot_id) FILTER (WHERE l.status = 'SOLD')::int AS players_bought,
              COALESCE(SUM(l.sold_price) FILTER (WHERE l.status = 'SOLD'), 0)::int AS spent
       FROM auctions a
       CROSS JOIN teams t
       LEFT JOIN auction_lots l ON l.team_id = t.team_id AND l.auction_id = a.auction_id
       WHERE a.auction_id = $1 AND t.is_active = TRUE
       GROUP BY t.team_id, a.budget_per_team, a.max_players_per_team
       ORDER BY t.team_name`,
      [auctionId]
    );
    return rows.map((r) => ({ ...r, remaining: r.budget - r.spent, slots_left: r.max_players - r.players_bought }));
  },
};

module.exports = repo;
