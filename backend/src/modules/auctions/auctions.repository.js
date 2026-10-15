const pool = require('../../config/database');

const auctionsRepository = {
  findBySeasonId(seasonId) {
    return pool.query(
      `SELECT a.*, s.season_name, s.season_year, s.status AS season_status
       FROM auctions a
       JOIN seasons s ON s.season_id = a.season_id
       WHERE a.season_id = $1 AND (a.is_legacy OR a.status NOT IN ('DRAFT', 'CANCELLED'))
       ORDER BY a.is_legacy DESC, a.auction_id ASC
       LIMIT 1`,
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
};

module.exports = auctionsRepository;
