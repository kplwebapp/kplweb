const pool = require('../../config/database');

const MATCH_SELECT = `SELECT m.match_id, m.event_id, m.team1_id, m.team2_id,
    t1.team_name AS team1_name, t2.team_name AS team2_name,
    to_char(m.match_date, 'YYYY-MM-DD') AS match_date,
    m.stage, m.status, m.result,
    m.team1_runs, m.team1_wickets, m.team1_overs::float AS team1_overs,
    m.team2_runs, m.team2_wickets, m.team2_overs::float AS team2_overs,
    m.summary
  FROM tournament_matches m
  JOIN teams t1 ON t1.team_id = m.team1_id
  JOIN teams t2 ON t2.team_id = m.team2_id`;

const MATCH_FIELDS = [
  'team1_id', 'team2_id', 'match_date', 'stage', 'status', 'result',
  'team1_runs', 'team1_wickets', 'team1_overs',
  'team2_runs', 'team2_wickets', 'team2_overs', 'summary',
];

const matchValues = (data) => MATCH_FIELDS.map((field) => data[field] ?? null);

const tournamentDetailsRepository = {
  findTournament: async (id) => {
    const { rows } = await pool.query('SELECT event_id, kind, category_id FROM events WHERE event_id = $1', [id]);
    return rows[0] || null;
  },

  findPublicTournamentIdBySlug: async (slug) => {
    const { rows } = await pool.query(
      `SELECT event_id FROM events WHERE slug = $1 AND kind = 'TOURNAMENT' AND is_archived = FALSE`,
      [slug]
    );
    return rows[0]?.event_id || null;
  },

  // ---------- teams ----------
  findTeams: async (eventId) => {
    const { rows } = await pool.query(
      `SELECT t.team_id, t.team_name, t.team_code, t.short_name, t.team_logo
       FROM tournament_teams tt
       JOIN teams t ON t.team_id = tt.team_id
       WHERE tt.event_id = $1
       ORDER BY t.team_name ASC`,
      [eventId]
    );
    return rows;
  },

  findExistingTeamIds: async (teamIds) => {
    const { rows } = await pool.query('SELECT team_id, category_id FROM teams WHERE team_id = ANY($1::int[])', [teamIds]);
    return rows;
  },

  addTeams: async (eventId, teamIds) => {
    await pool.query(
      `INSERT INTO tournament_teams (event_id, team_id)
       SELECT $1, UNNEST($2::int[])
       ON CONFLICT DO NOTHING`,
      [eventId, teamIds]
    );
  },

  countTeamMatches: async (eventId, teamId) => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS c FROM tournament_matches
       WHERE event_id = $1 AND (team1_id = $2 OR team2_id = $2)`,
      [eventId, teamId]
    );
    return rows[0].c;
  },

  removeTeam: async (eventId, teamId) => {
    const { rowCount } = await pool.query(
      'DELETE FROM tournament_teams WHERE event_id = $1 AND team_id = $2',
      [eventId, teamId]
    );
    return rowCount > 0;
  },

  // ---------- matches ----------
  findMatches: async (eventId) => {
    const { rows } = await pool.query(
      `${MATCH_SELECT} WHERE m.event_id = $1
       ORDER BY m.match_date DESC NULLS LAST, m.match_id DESC`,
      [eventId]
    );
    return rows;
  },

  findMatch: async (eventId, matchId) => {
    const { rows } = await pool.query(`${MATCH_SELECT} WHERE m.event_id = $1 AND m.match_id = $2`, [eventId, matchId]);
    return rows[0] || null;
  },

  createMatch: async (eventId, data) => {
    const { rows } = await pool.query(
      `INSERT INTO tournament_matches (event_id, ${MATCH_FIELDS.join(', ')})
       VALUES ($1, ${MATCH_FIELDS.map((_, i) => `$${i + 2}`).join(', ')})
       RETURNING match_id`,
      [eventId, ...matchValues(data)]
    );
    return tournamentDetailsRepository.findMatch(eventId, rows[0].match_id);
  },

  updateMatch: async (eventId, matchId, data) => {
    const { rows } = await pool.query(
      `UPDATE tournament_matches SET
         ${MATCH_FIELDS.map((field, i) => `${field} = $${i + 3}`).join(',\n         ')},
         updated_at = CURRENT_TIMESTAMP
       WHERE event_id = $1 AND match_id = $2
       RETURNING match_id`,
      [eventId, matchId, ...matchValues(data)]
    );
    return rows[0] ? tournamentDetailsRepository.findMatch(eventId, matchId) : null;
  },

  removeMatch: async (eventId, matchId) => {
    const { rowCount } = await pool.query(
      'DELETE FROM tournament_matches WHERE event_id = $1 AND match_id = $2',
      [eventId, matchId]
    );
    return rowCount > 0;
  },

  // ---------- media ----------
  findMedia: async (eventId) => {
    const { rows } = await pool.query(
      `SELECT media_id, media_type, url, youtube_id, caption, created_at
       FROM tournament_media
       WHERE event_id = $1
       ORDER BY created_at DESC, media_id DESC`,
      [eventId]
    );
    return rows;
  },

  findMediaItem: async (eventId, mediaId) => {
    const { rows } = await pool.query(
      `SELECT media_id, media_type, url, youtube_id, caption, created_at
       FROM tournament_media WHERE event_id = $1 AND media_id = $2`,
      [eventId, mediaId]
    );
    return rows[0] || null;
  },

  findPhotoUrls: async (eventId) => {
    const { rows } = await pool.query(
      `SELECT url FROM tournament_media WHERE event_id = $1 AND media_type = 'PHOTO'`,
      [eventId]
    );
    return rows.map((r) => r.url);
  },

  addPhotos: async (eventId, urls, caption) => {
    const { rows } = await pool.query(
      `INSERT INTO tournament_media (event_id, media_type, url, caption)
       SELECT $1, 'PHOTO', UNNEST($2::text[]), $3
       RETURNING media_id, media_type, url, youtube_id, caption, created_at`,
      [eventId, urls, caption || null]
    );
    return rows;
  },

  addVideos: async (eventId, videos) => {
    const { rows } = await pool.query(
      `INSERT INTO tournament_media (event_id, media_type, url, youtube_id, caption)
       SELECT $1, 'VIDEO', v.url, v.youtube_id, v.caption
       FROM UNNEST($2::text[], $3::text[], $4::text[]) AS v(url, youtube_id, caption)
       RETURNING media_id, media_type, url, youtube_id, caption, created_at`,
      [eventId, videos.map((v) => v.url), videos.map((v) => v.youtubeId), videos.map((v) => v.caption || null)]
    );
    return rows;
  },

  updateCaption: async (eventId, mediaId, caption) => {
    const { rows } = await pool.query(
      `UPDATE tournament_media SET caption = $3
       WHERE event_id = $1 AND media_id = $2
       RETURNING media_id, media_type, url, youtube_id, caption, created_at`,
      [eventId, mediaId, caption || null]
    );
    return rows[0] || null;
  },

  removeMedia: async (eventId, mediaId) => {
    const { rowCount } = await pool.query(
      'DELETE FROM tournament_media WHERE event_id = $1 AND media_id = $2',
      [eventId, mediaId]
    );
    return rowCount > 0;
  },
};

module.exports = tournamentDetailsRepository;
