const pool = require('../../config/database');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const getSeasons = asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT s.season_id, s.season_name, s.season_year, s.status, s.tournament_id,
            t.tournament_name, t.tournament_code
     FROM seasons s
     JOIN tournaments t ON t.tournament_id = s.tournament_id
     ORDER BY s.season_year DESC, s.season_name ASC`
  );
  return ApiResponse.success(res, rows);
});

const getPointsTable = asyncHandler(async (req, res) => {
  const { seasonId } = req.query;
  const { rows } = await pool.query(
    `SELECT pt.points_table_id, pt.season_id, pt.team_id,
            t.team_name, t.short_name,
            pt.matches_played, pt.matches_won, pt.matches_lost,
            pt.matches_tied, pt.matches_nr, pt.points, pt.net_run_rate
     FROM points_table pt
     JOIN teams t ON t.team_id = pt.team_id
     WHERE ($1::int IS NULL OR pt.season_id = $1)
     ORDER BY pt.points DESC, pt.net_run_rate DESC`,
    [seasonId || null]
  );
  return ApiResponse.success(res, rows);
});

const getPlayerStats = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM player_stats ORDER BY total_runs DESC LIMIT 50'
  );
  return ApiResponse.success(res, rows);
});

const getTeamStats = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM team_stats ORDER BY matches_won DESC LIMIT 50'
  );
  return ApiResponse.success(res, rows);
});

const bulkUpdatePointsTable = asyncHandler(async (req, res) => {
  const { seasonId, rows } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const seasonCheck = await client.query('SELECT season_id FROM seasons WHERE season_id = $1', [seasonId]);
    if (!seasonCheck.rows.length) {
      throw new ApiError(404, 'Season not found');
    }

    const updated = [];
    for (const row of rows) {
      const { rows: result } = await client.query(
        `INSERT INTO points_table (
           season_id, team_id, matches_played, matches_won, matches_lost,
           matches_tied, matches_nr, points, net_run_rate, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
         ON CONFLICT (season_id, team_id) DO UPDATE SET
           matches_played = EXCLUDED.matches_played,
           matches_won = EXCLUDED.matches_won,
           matches_lost = EXCLUDED.matches_lost,
           matches_tied = EXCLUDED.matches_tied,
           matches_nr = EXCLUDED.matches_nr,
           points = EXCLUDED.points,
           net_run_rate = EXCLUDED.net_run_rate,
           updated_at = CURRENT_TIMESTAMP
         RETURNING points_table_id, season_id, team_id,
                   matches_played, matches_won, matches_lost,
                   matches_tied, matches_nr, points, net_run_rate`,
        [
          seasonId,
          row.team_id,
          row.matches_played,
          row.matches_won,
          row.matches_lost,
          row.matches_tied ?? 0,
          row.matches_nr ?? 0,
          row.points,
          row.net_run_rate,
        ]
      );
      updated.push(result[0]);
    }

    const { rows: enriched } = await client.query(
      `SELECT pt.points_table_id, pt.season_id, pt.team_id,
              t.team_name, t.short_name,
              pt.matches_played, pt.matches_won, pt.matches_lost,
              pt.matches_tied, pt.matches_nr, pt.points, pt.net_run_rate
       FROM points_table pt
       JOIN teams t ON t.team_id = pt.team_id
       WHERE pt.season_id = $1
       ORDER BY pt.points DESC, pt.net_run_rate DESC`,
      [seasonId]
    );

    await client.query('COMMIT');
    return ApiResponse.success(res, enriched, 'Points table updated');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { getSeasons, getPointsTable, getPlayerStats, getTeamStats, bulkUpdatePointsTable };
