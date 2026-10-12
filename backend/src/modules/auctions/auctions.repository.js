const pool = require('../../config/database');

const auctionsRepository = {
  findBySeasonId(seasonId) {
    return pool.query(
      `SELECT a.*, s.season_name, s.season_year, s.status AS season_status
       FROM auctions a
       JOIN seasons s ON s.season_id = a.season_id
       WHERE a.season_id = $1`,
      [seasonId]
    );
  },

  findLotsByAuctionId(auctionId) {
    return pool.query(
      `SELECT l.*, t.team_name, t.short_name AS team_short_name
       FROM auction_lots l
       LEFT JOIN teams t ON t.team_id = l.team_id
       WHERE l.auction_id = $1
       ORDER BY l.lot_number ASC`,
      [auctionId]
    );
  },

  findTeamSpendByAuctionId(auctionId) {
    return pool.query(
      `SELECT t.team_id, t.team_name, t.short_name,
              COUNT(l.lot_id) FILTER (WHERE l.status = 'SOLD') AS players_bought,
              COALESCE(SUM(l.sold_price) FILTER (WHERE l.status = 'SOLD'), 0) AS points_spent,
              a.budget_per_team - COALESCE(SUM(l.sold_price) FILTER (WHERE l.status = 'SOLD'), 0) AS points_remaining,
              a.max_players_per_team,
              COUNT(l.lot_id) FILTER (WHERE l.status = 'SOLD' AND l.player_role = 'Batsman') AS batsmen,
              COUNT(l.lot_id) FILTER (WHERE l.status = 'SOLD' AND l.player_role = 'Bowler') AS bowlers,
              COUNT(l.lot_id) FILTER (WHERE l.status = 'SOLD' AND l.player_role = 'All-rounder') AS all_rounders
       FROM auctions a
       CROSS JOIN teams t
       LEFT JOIN auction_lots l ON l.team_id = t.team_id AND l.auction_id = a.auction_id
       WHERE a.auction_id = $1 AND t.is_active = TRUE
       GROUP BY t.team_id, t.team_name, t.short_name, a.budget_per_team, a.max_players_per_team
       ORDER BY points_spent DESC, t.team_name ASC`,
      [auctionId]
    );
  },

  countSoldLotsForTeam(auctionId, teamId, excludeLotId = null) {
    return pool.query(
      `SELECT COUNT(*)::int AS players_bought,
              COALESCE(SUM(sold_price), 0) AS points_spent
       FROM auction_lots
       WHERE auction_id = $1 AND team_id = $2 AND status = 'SOLD'
         AND ($3::int IS NULL OR lot_id <> $3)`,
      [auctionId, teamId, excludeLotId]
    );
  },

  upsertAuction(data) {
    return pool.query(
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
       RETURNING *`,
      [
        data.season_id,
        data.title,
        data.description || null,
        data.auction_date || null,
        data.venue || null,
        data.status || 'UPCOMING',
        data.budget_per_team ?? 100000,
        data.max_players_per_team ?? 16,
      ]
    );
  },

  createLot(data) {
    return pool.query(
      `INSERT INTO auction_lots
        (auction_id, lot_number, player_name, player_role, vibhaag, base_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.auction_id,
        data.lot_number,
        data.player_name,
        data.player_role || null,
        data.vibhaag || null,
        data.base_price ?? 0,
        data.status || 'PENDING',
      ]
    );
  },

  updateLot(lotId, data) {
    return pool.query(
      `UPDATE auction_lots SET
         lot_number = COALESCE($2, lot_number),
         player_name = COALESCE($3, player_name),
         player_role = COALESCE($4, player_role),
         vibhaag = COALESCE($5, vibhaag),
         base_price = COALESCE($6, base_price),
         sold_price = $7,
         team_id = $8,
         status = COALESCE($9, status),
         sold_at = CASE WHEN $9 = 'SOLD' THEN COALESCE(sold_at, CURRENT_TIMESTAMP) ELSE sold_at END
       WHERE lot_id = $1
       RETURNING *`,
      [
        lotId,
        data.lot_number,
        data.player_name,
        data.player_role,
        data.vibhaag,
        data.base_price,
        data.sold_price ?? null,
        data.team_id ?? null,
        data.status,
      ]
    );
  },

  deleteLot(lotId) {
    return pool.query('DELETE FROM auction_lots WHERE lot_id = $1 RETURNING lot_id', [lotId]);
  },

  findLotById(lotId) {
    return pool.query('SELECT * FROM auction_lots WHERE lot_id = $1', [lotId]);
  },

  findAuctionByLotId(lotId) {
    return pool.query(
      `SELECT a.*
       FROM auction_lots l
       JOIN auctions a ON a.auction_id = l.auction_id
       WHERE l.lot_id = $1`,
      [lotId]
    );
  },
};

module.exports = auctionsRepository;
