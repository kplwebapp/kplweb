const pool = require('../../config/database');

const pagesRepository = {
  findBySlug: async (slug) => {
    const { rows } = await pool.query(
      'SELECT page_slug, content, updated_at FROM page_content WHERE page_slug = $1',
      [slug]
    );
    return rows[0] || null;
  },

  upsert: async (slug, content) => {
    const { rows } = await pool.query(
      `INSERT INTO page_content (page_slug, content)
       VALUES ($1, $2)
       ON CONFLICT (page_slug) DO UPDATE SET
         content = EXCLUDED.content,
         updated_at = CURRENT_TIMESTAMP
       RETURNING page_slug, content, updated_at`,
      [slug, JSON.stringify(content)]
    );
    return rows[0];
  },
};

module.exports = pagesRepository;
