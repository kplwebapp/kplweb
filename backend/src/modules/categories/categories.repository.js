const pool = require('../../config/database');

const categoriesRepository = {
  findByKind: async (kind, { activeOnly }) => {
    const { rows } = await pool.query(
      `SELECT category_id, kind, name, slug, display_order, is_active
       FROM activity_categories
       WHERE kind = $1 AND ($2::boolean = FALSE OR is_active = TRUE)
       ORDER BY display_order ASC, name ASC`,
      [kind, Boolean(activeOnly)]
    );
    return rows;
  },

  findById: async (id) => {
    const { rows } = await pool.query(
      `SELECT category_id, kind, name, slug, display_order, is_active
       FROM activity_categories WHERE category_id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  slugExists: async (kind, slug) => {
    const { rows } = await pool.query(
      'SELECT 1 FROM activity_categories WHERE kind = $1 AND slug = $2',
      [kind, slug]
    );
    return rows.length > 0;
  },

  nextDisplayOrder: async (kind) => {
    const { rows } = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 AS next FROM activity_categories WHERE kind = $1',
      [kind]
    );
    return rows[0].next;
  },

  create: async ({ kind, name, slug, display_order }) => {
    const { rows } = await pool.query(
      `INSERT INTO activity_categories (kind, name, slug, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING category_id, kind, name, slug, display_order, is_active`,
      [kind, name, slug, display_order]
    );
    return rows[0];
  },

  update: async (id, data) => {
    const { rows } = await pool.query(
      `UPDATE activity_categories SET
         name = COALESCE($2, name),
         display_order = COALESCE($3, display_order),
         is_active = COALESCE($4, is_active),
         updated_at = CURRENT_TIMESTAMP
       WHERE category_id = $1
       RETURNING category_id, kind, name, slug, display_order, is_active`,
      [id, data.name, data.display_order, data.is_active]
    );
    return rows[0] || null;
  },
};

module.exports = categoriesRepository;
