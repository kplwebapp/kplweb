const pool = require('../../config/database');

const galleryRepository = {
  findPublic: async () => {
    const { rows } = await pool.query(
      `SELECT gallery_id, title, image_url, caption, category, uploaded_at
       FROM gallery
       ORDER BY uploaded_at DESC, gallery_id DESC`
    );
    return rows;
  },

  findAll: async () => {
    const { rows } = await pool.query(
      `SELECT * FROM gallery ORDER BY uploaded_at DESC, gallery_id DESC`
    );
    return rows;
  },

  findById: async (id) => {
    const { rows } = await pool.query(
      'SELECT * FROM gallery WHERE gallery_id = $1',
      [id]
    );
    return rows[0] || null;
  },

  create: async (data, userId) => {
    const { rows } = await pool.query(
      `INSERT INTO gallery (title, image_url, caption, category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.title || null,
        data.image_url,
        data.caption || null,
        data.category || 'GENERAL',
        userId || null,
      ]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const { rows } = await pool.query(
      `UPDATE gallery SET
         title = COALESCE($2, title),
         image_url = COALESCE($3, image_url),
         caption = COALESCE($4, caption),
         category = COALESCE($5, category)
       WHERE gallery_id = $1
       RETURNING *`,
      [id, data.title, data.image_url, data.caption, data.category]
    );
    return rows[0] || null;
  },

  remove: async (id) => {
    const { rowCount } = await pool.query(
      'DELETE FROM gallery WHERE gallery_id = $1',
      [id]
    );
    return rowCount > 0;
  },
};

module.exports = galleryRepository;
