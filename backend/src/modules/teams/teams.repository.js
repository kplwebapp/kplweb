const pool = require('../../config/database');

const SELECT_SQL = `SELECT t.team_id, t.team_name, t.team_code, t.short_name, t.team_logo, t.is_active,
    t.category_id, c.name AS category_name, c.slug AS category_slug
  FROM teams t
  JOIN activity_categories c ON c.category_id = t.category_id`;

const teamsRepository = {
  findAll: async (categoryId = null) => {
    const { rows } = await pool.query(
      `${SELECT_SQL}
       WHERE ($1::int IS NULL OR t.category_id = $1)
       ORDER BY c.display_order, c.name, t.is_active DESC, t.team_name ASC`,
      [categoryId]
    );
    return rows;
  },

  findById: async (id) => {
    const { rows } = await pool.query(`${SELECT_SQL} WHERE t.team_id = $1`, [id]);
    return rows[0] || null;
  },

  isTournamentCategory: async (categoryId) => {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM activity_categories WHERE category_id = $1 AND kind = 'TOURNAMENT'`,
      [categoryId]
    );
    return rowCount > 0;
  },

  isInAnyTournament: async (id) => {
    const { rowCount } = await pool.query(`SELECT 1 FROM tournament_teams WHERE team_id = $1 LIMIT 1`, [id]);
    return rowCount > 0;
  },

  create: async (data) => {
    const { rows } = await pool.query(
      `INSERT INTO teams (team_name, team_code, short_name, category_id)
       VALUES ($1, $2, $3, $4)
       RETURNING team_id`,
      [data.team_name, data.team_code || null, data.short_name || null, data.category_id]
    );
    return teamsRepository.findById(rows[0].team_id);
  },

  update: async (id, data) => {
    const has = (key) => Object.prototype.hasOwnProperty.call(data, key);
    const { rowCount } = await pool.query(
      `UPDATE teams SET
         team_name = COALESCE($2, team_name),
         team_code = CASE WHEN $3::boolean THEN $4 ELSE team_code END,
         short_name = CASE WHEN $5::boolean THEN $6 ELSE short_name END,
         is_active = COALESCE($7, is_active),
         category_id = COALESCE($8, category_id),
         updated_at = CURRENT_TIMESTAMP
       WHERE team_id = $1`,
      [
        id,
        data.team_name,
        has('team_code'), data.team_code || null,
        has('short_name'), data.short_name || null,
        data.is_active ?? null,
        data.category_id ?? null,
      ]
    );
    return rowCount ? teamsRepository.findById(id) : null;
  },

  setLogo: async (id, logoUrl) => {
    const { rowCount } = await pool.query(
      `UPDATE teams SET team_logo = $2, updated_at = CURRENT_TIMESTAMP WHERE team_id = $1`,
      [id, logoUrl]
    );
    return rowCount ? teamsRepository.findById(id) : null;
  },
};

module.exports = teamsRepository;
