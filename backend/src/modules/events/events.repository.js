const pool = require('../../config/database');

const STATUS_SQL = `CASE
    WHEN e.event_date IS NULL OR e.event_date > CURRENT_DATE THEN 'UPCOMING'
    WHEN COALESCE(e.end_date, e.event_date) < CURRENT_DATE THEN 'PAST'
    ELSE 'ONGOING'
  END`;

const SELECT_SQL = `SELECT e.event_id, e.kind, e.category_id, c.name AS category_name, c.slug AS category_slug,
    e.title, e.slug, e.description,
    to_char(e.event_date, 'YYYY-MM-DD') AS event_date,
    to_char(e.end_date, 'YYYY-MM-DD') AS end_date,
    CASE WHEN e.event_date IS NULL THEN NULL
         ELSE COALESCE(e.end_date, e.event_date) - e.event_date + 1 END AS days,
    ${STATUS_SQL} AS status,
    e.venue, e.image_url, e.is_archived, e.archived_at, e.created_at, e.updated_at
  FROM events e
  LEFT JOIN activity_categories c ON c.category_id = e.category_id`;

const eventsRepository = {
  findPublic: async (kind, includePast = false) => {
    const { rows } = await pool.query(
      `${SELECT_SQL}
       WHERE e.kind = $1
         AND e.is_archived = FALSE
         AND (c.category_id IS NULL OR c.is_active = TRUE)
         AND ($2::boolean OR ${STATUS_SQL} <> 'PAST')
       ORDER BY e.event_date DESC NULLS LAST, e.event_id DESC`,
      [kind, includePast]
    );
    return rows;
  },

  findManage: async ({ kind, categoryId, status, archived }) => {
    const { rows } = await pool.query(
      `${SELECT_SQL}
       WHERE e.kind = $1
         AND ($2::int IS NULL OR e.category_id = $2)
         AND e.is_archived = $3
         AND ($4::text IS NULL OR ${STATUS_SQL} = $4)
       ORDER BY e.event_date DESC NULLS LAST, e.event_id DESC`,
      [kind, categoryId ?? null, Boolean(archived), status ?? null]
    );
    return rows;
  },

  findById: async (id) => {
    const { rows } = await pool.query(`${SELECT_SQL} WHERE e.event_id = $1`, [id]);
    return rows[0] || null;
  },

  findKindById: async (id) => {
    const { rows } = await pool.query('SELECT kind FROM events WHERE event_id = $1', [id]);
    return rows[0]?.kind || null;
  },

  findPublicBySlug: async (slug) => {
    const { rows } = await pool.query(
      `${SELECT_SQL} WHERE e.slug = $1 AND e.is_archived = FALSE`,
      [slug]
    );
    return rows[0] || null;
  },

  slugExists: async (slug, excludeId = null) => {
    const { rows } = await pool.query(
      'SELECT 1 FROM events WHERE slug = $1 AND ($2::int IS NULL OR event_id <> $2)',
      [slug, excludeId]
    );
    return rows.length > 0;
  },

  create: async (data) => {
    const { rows } = await pool.query(
      `INSERT INTO events (kind, category_id, title, slug, description, event_date, end_date, venue)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING event_id`,
      [
        data.kind,
        data.category_id,
        data.title,
        data.slug,
        data.description || null,
        data.event_date || null,
        data.end_date || null,
        data.venue || null,
      ]
    );
    return eventsRepository.findById(rows[0].event_id);
  },

  update: async (id, data) => {
    const has = (key) => Object.prototype.hasOwnProperty.call(data, key);
    const { rows } = await pool.query(
      `UPDATE events SET
         title = COALESCE($2, title),
         slug = COALESCE($3, slug),
         category_id = COALESCE($4, category_id),
         description = CASE WHEN $5::boolean THEN $6 ELSE description END,
         event_date = CASE WHEN $7::boolean THEN $8::date ELSE event_date END,
         end_date = CASE WHEN $9::boolean THEN $10::date ELSE end_date END,
         venue = CASE WHEN $11::boolean THEN $12 ELSE venue END,
         updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $1
       RETURNING event_id`,
      [
        id,
        data.title,
        data.slug,
        data.category_id,
        has('description'), data.description || null,
        has('event_date'), data.event_date || null,
        has('end_date'), data.end_date || null,
        has('venue'), data.venue || null,
      ]
    );
    return rows[0] ? eventsRepository.findById(rows[0].event_id) : null;
  },

  findImageById: async (id) => {
    const { rows } = await pool.query('SELECT image_url FROM events WHERE event_id = $1', [id]);
    return rows.length ? { image_url: rows[0].image_url } : null;
  },

  setImage: async (id, imageUrl) => {
    const { rows } = await pool.query(
      `UPDATE events SET image_url = $2, updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $1
       RETURNING event_id`,
      [id, imageUrl]
    );
    return rows[0] ? eventsRepository.findById(rows[0].event_id) : null;
  },

  setArchived: async (id, archived) => {
    const { rows } = await pool.query(
      `UPDATE events SET
         is_archived = $2,
         archived_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $1
       RETURNING event_id`,
      [id, archived]
    );
    return rows[0] ? eventsRepository.findById(rows[0].event_id) : null;
  },

  remove: async (id) => {
    const { rowCount } = await pool.query('DELETE FROM events WHERE event_id = $1', [id]);
    return rowCount > 0;
  },

  findRegistrations: async (eventId) => {
    const { rows } = await pool.query(
      `SELECT tr.registration_id, tr.status, tr.registered_at,
              u.user_id, u.first_name, u.last_name, u.full_name, u.email, u.mobile, u.vibhaag,
              (SELECT mp.answers FROM member_persona_profiles mp
               WHERE mp.user_id = u.user_id AND mp.persona_type = 'cricketer'
               ORDER BY mp.persona_profile_id LIMIT 1) AS cricket_skills
       FROM tournament_registrations tr
       JOIN users u ON u.user_id = tr.user_id
       WHERE tr.event_id = $1
       ORDER BY tr.registered_at ASC`,
      [eventId]
    );
    return rows;
  },
};

module.exports = eventsRepository;
