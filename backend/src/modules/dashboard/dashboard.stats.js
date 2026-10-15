const pool = require('../../config/database');
const { VIBHAAG_OPTIONS } = require('../profile/profile.constants');

/** Website members are accounts with the PLAYER role (staff accounts are excluded). */
const MEMBERS_SQL = `
  SELECT u.* FROM users u
  WHERE EXISTS (
    SELECT 1 FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id
    WHERE ur.user_id = u.user_id AND r.role_code = 'PLAYER'
  )`;

/** Count rows per vibhaag in VIBHAAG_OPTIONS order, zeros included; values outside the list are dropped. */
const byVibhaag = (rows) => {
  const counts = new Map(VIBHAAG_OPTIONS.map((name) => [name.toLowerCase(), 0]));
  for (const { vibhaag, count } of rows) {
    const key = (vibhaag || '').trim().toLowerCase();
    if (counts.has(key)) counts.set(key, counts.get(key) + count);
  }
  return VIBHAAG_OPTIONS.map((name) => ({ vibhaag: name, count: counts.get(name.toLowerCase()) }));
};

/** Every tournament (latest first) with its registrations split by vibhaag. */
const tournamentsByVibhaag = (rows) => {
  const tournaments = new Map();
  for (const row of rows) {
    if (!tournaments.has(row.event_id)) {
      tournaments.set(row.event_id, {
        event_id: row.event_id,
        title: row.title,
        category_name: row.category_name,
        is_archived: row.is_archived,
        rows: [],
      });
    }
    if (row.count) tournaments.get(row.event_id).rows.push({ vibhaag: row.vibhaag, count: row.count });
  }
  return [...tournaments.values()].map(({ rows: counts, ...t }) => ({ ...t, byVibhaag: byVibhaag(counts) }));
};

const getStats = async () => {
  const [totals, monthly, vibhaag, perTournament, playerVibhaag, tournamentVibhaag] = await Promise.all([
    pool.query(
      `WITH m AS (${MEMBERS_SQL})
       SELECT
         (SELECT COUNT(*)::int FROM m) AS members,
         (SELECT COUNT(*)::int FROM m WHERE is_active) AS approved,
         (SELECT COUNT(*)::int FROM m WHERE NOT is_active) AS pending,
         (SELECT COUNT(*)::int FROM m WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS this_month,
         (SELECT COUNT(*)::int FROM tournament_registrations tr
            JOIN events e ON e.event_id = tr.event_id AND NOT e.is_archived) AS tournament_registrations,
         (SELECT COUNT(DISTINCT tr.user_id)::int FROM tournament_registrations tr
            JOIN events e ON e.event_id = tr.event_id AND NOT e.is_archived) AS registered_players,
         (SELECT COUNT(*)::int FROM events
            WHERE kind = 'TOURNAMENT' AND NOT is_archived
              AND COALESCE(end_date, event_date) >= CURRENT_DATE) AS active_tournaments`
    ),
    // last 12 months, including months with no sign-ups
    pool.query(
      `WITH m AS (${MEMBERS_SQL}),
       months AS (
         SELECT generate_series(date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
                                date_trunc('month', CURRENT_DATE), INTERVAL '1 month') AS month
       )
       SELECT to_char(months.month, 'YYYY-MM') AS month, COUNT(m.user_id)::int AS count
       FROM months
       LEFT JOIN m ON date_trunc('month', m.created_at) = months.month
       GROUP BY months.month
       ORDER BY months.month`
    ),
    pool.query(`WITH m AS (${MEMBERS_SQL}) SELECT vibhaag, COUNT(*)::int AS count FROM m GROUP BY 1`),
    pool.query(
      `SELECT e.event_id, e.title, c.name AS category_name,
              COUNT(tr.registration_id)::int AS count
       FROM events e
       LEFT JOIN activity_categories c ON c.category_id = e.category_id
       LEFT JOIN tournament_registrations tr ON tr.event_id = e.event_id
       WHERE e.kind = 'TOURNAMENT' AND NOT e.is_archived
       GROUP BY e.event_id, c.name
       ORDER BY e.event_date DESC NULLS LAST, e.event_id DESC
       LIMIT 12`
    ),
    pool.query(
      `SELECT u.vibhaag, COUNT(*)::int AS count
       FROM tournament_registrations tr
       JOIN events e ON e.event_id = tr.event_id AND NOT e.is_archived
       JOIN users u ON u.user_id = tr.user_id
       GROUP BY 1`
    ),
    pool.query(
      `SELECT e.event_id, e.title, c.name AS category_name, e.is_archived, e.event_date,
              u.vibhaag, COUNT(tr.registration_id)::int AS count
       FROM events e
       LEFT JOIN activity_categories c ON c.category_id = e.category_id
       LEFT JOIN tournament_registrations tr ON tr.event_id = e.event_id
       LEFT JOIN users u ON u.user_id = tr.user_id
       WHERE e.kind = 'TOURNAMENT'
       GROUP BY e.event_id, c.name, u.vibhaag
       ORDER BY e.is_archived, e.event_date DESC NULLS LAST, e.event_id DESC`
    ),
  ]);

  return {
    totals: totals.rows[0],
    monthlyRegistrations: monthly.rows,
    membersByVibhaag: byVibhaag(vibhaag.rows),
    registrationsByTournament: perTournament.rows,
    playersByVibhaag: byVibhaag(playerVibhaag.rows),
    tournamentsByVibhaag: tournamentsByVibhaag(tournamentVibhaag.rows),
  };
};

module.exports = { getStats };
