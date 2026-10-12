const pool = require('../../config/database');

const MATCH_SELECT = `
  SELECT m.match_id, m.season_id, m.team1_id, m.team2_id,
         m.venue, m.match_date, m.match_type, m.overs_limit,
         m.toss_winner_id, m.toss_decision, m.status,
         m.winner_team_id, m.result_summary,
         m.created_at, m.updated_at,
         t1.team_name AS team1_name, t1.short_name AS team1_short,
         t2.team_name AS team2_name, t2.short_name AS team2_short,
         s.season_name, s.season_year
  FROM matches m
  JOIN teams t1 ON t1.team_id = m.team1_id
  JOIN teams t2 ON t2.team_id = m.team2_id
  JOIN seasons s ON s.season_id = m.season_id
`;

const matchesRepository = {
  findAll: async ({ seasonId, status, limit = 100, offset = 0 } = {}) => {
    const params = [];
    const conditions = [];

    if (seasonId) {
      params.push(seasonId);
      conditions.push(`m.season_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`m.status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await pool.query(
      `${MATCH_SELECT} ${where}
       ORDER BY m.match_date DESC NULLS LAST, m.match_id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const countWhere = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM matches m ${countWhere}`,
      countParams
    );

    return { rows, total: count.rows[0].total };
  },

  findById: async (id) => {
    const { rows } = await pool.query(`${MATCH_SELECT} WHERE m.match_id = $1`, [id]);
    return rows[0] || null;
  },

  create: async (data) => {
    const { rows } = await pool.query(
      `INSERT INTO matches (
         season_id, team1_id, team2_id, venue, match_date,
         match_type, overs_limit, status, result_summary
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING match_id`,
      [
        data.season_id,
        data.team1_id,
        data.team2_id,
        data.venue || null,
        data.match_date || null,
        data.match_type || 'LEAGUE',
        data.overs_limit ?? 20,
        data.status || 'SCHEDULED',
        data.result_summary || null,
      ]
    );
    return matchesRepository.findById(rows[0].match_id);
  },

  update: async (id, data) => {
    const { rows } = await pool.query(
      `UPDATE matches SET
         season_id = COALESCE($2, season_id),
         team1_id = COALESCE($3, team1_id),
         team2_id = COALESCE($4, team2_id),
         venue = COALESCE($5, venue),
         match_date = COALESCE($6, match_date),
         match_type = COALESCE($7, match_type),
         overs_limit = COALESCE($8, overs_limit),
         status = COALESCE($9, status),
         result_summary = COALESCE($10, result_summary),
         winner_team_id = COALESCE($11, winner_team_id),
         updated_at = CURRENT_TIMESTAMP
       WHERE match_id = $1
       RETURNING match_id`,
      [
        id,
        data.season_id,
        data.team1_id,
        data.team2_id,
        data.venue,
        data.match_date,
        data.match_type,
        data.overs_limit,
        data.status,
        data.result_summary,
        data.winner_team_id,
      ]
    );
    if (!rows.length) return null;
    return matchesRepository.findById(rows[0].match_id);
  },
};

module.exports = matchesRepository;
