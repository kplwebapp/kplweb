const pool = require('../../config/database');

const sponsorsRepository = {
  findPublic: async () => {
    const { rows } = await pool.query(
      `SELECT sponsor_id, sponsor_name, logo_url, website_url, tier, display_order
       FROM sponsors
       WHERE is_active = TRUE
       ORDER BY display_order ASC, sponsor_id ASC`
    );
    return rows;
  },

  findAll: async () => {
    const { rows } = await pool.query(
      `SELECT * FROM sponsors ORDER BY display_order ASC, sponsor_id ASC`
    );
    return rows;
  },

  findById: async (id) => {
    const { rows } = await pool.query(
      'SELECT * FROM sponsors WHERE sponsor_id = $1',
      [id]
    );
    return rows[0] || null;
  },

  create: async (data) => {
    const { rows } = await pool.query(
      `INSERT INTO sponsors (sponsor_name, logo_url, website_url, tier, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.sponsor_name,
        data.logo_url || null,
        data.website_url || null,
        data.tier || 'STANDARD',
        data.is_active !== false,
        data.display_order ?? 0,
      ]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const { rows } = await pool.query(
      `UPDATE sponsors SET
         sponsor_name = COALESCE($2, sponsor_name),
         logo_url = COALESCE($3, logo_url),
         website_url = COALESCE($4, website_url),
         tier = COALESCE($5, tier),
         is_active = COALESCE($6, is_active),
         display_order = COALESCE($7, display_order)
       WHERE sponsor_id = $1
       RETURNING *`,
      [
        id,
        data.sponsor_name,
        data.logo_url,
        data.website_url,
        data.tier,
        data.is_active,
        data.display_order,
      ]
    );
    return rows[0] || null;
  },

  remove: async (id) => {
    const { rowCount } = await pool.query(
      'DELETE FROM sponsors WHERE sponsor_id = $1',
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = sponsorsRepository;
