const pool = require('../../config/database');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const recordBall = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { inningsId, overNumber, ballNumber, batsmanId, bowlerId, runs, extras, wicketType, wicketPlayerId, isLegalDelivery } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const overResult = await client.query(
      `INSERT INTO overs (innings_id, over_number, bowler_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (innings_id, over_number) DO UPDATE SET bowler_id = EXCLUDED.bowler_id
       RETURNING over_id`,
      [inningsId, overNumber, bowlerId]
    );

    const { rows } = await client.query(
      `INSERT INTO balls (over_id, ball_number, batsman_id, bowler_id, runs, extras, wicket_type, wicket_player_id, is_legal_delivery)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [overResult.rows[0].over_id, ballNumber, batsmanId, bowlerId, runs, extras || 0, wicketType, wicketPlayerId, isLegalDelivery !== false]
    );

    await client.query(
      `UPDATE innings SET total_runs = total_runs + $1, total_wickets = total_wickets + $2, total_overs = $3
       WHERE innings_id = $4`,
      [runs + (extras || 0), wicketType ? 1 : 0, overNumber + ballNumber / 10, inningsId]
    );

    await client.query('COMMIT');
    return ApiResponse.success(res, rows[0], 'Ball recorded', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

const getLiveScore = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { rows } = await pool.query(
    `SELECT m.*, 
            json_agg(i ORDER BY i.innings_number) AS innings
     FROM matches m
     LEFT JOIN innings i ON i.match_id = m.match_id
     WHERE m.match_id = $1
     GROUP BY m.match_id`,
    [matchId]
  );
  if (!rows.length) throw new ApiError(404, 'Match not found');
  return ApiResponse.success(res, rows[0]);
});

const updateMatchScores = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { innings, matchStatus } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const matchResult = await client.query('SELECT match_id, team1_id, team2_id FROM matches WHERE match_id = $1', [matchId]);
    if (!matchResult.rows.length) throw new ApiError(404, 'Match not found');

    for (const inn of innings) {
      await client.query(
        `INSERT INTO innings (
           match_id, batting_team_id, bowling_team_id, innings_number,
           total_runs, total_wickets, total_overs, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (match_id, innings_number) DO UPDATE SET
           batting_team_id = EXCLUDED.batting_team_id,
           bowling_team_id = EXCLUDED.bowling_team_id,
           total_runs = EXCLUDED.total_runs,
           total_wickets = EXCLUDED.total_wickets,
           total_overs = EXCLUDED.total_overs,
           status = EXCLUDED.status`,
        [
          matchId,
          inn.batting_team_id,
          inn.bowling_team_id,
          inn.innings_number,
          inn.total_runs,
          inn.total_wickets,
          inn.total_overs,
          inn.status || 'IN_PROGRESS',
        ]
      );
    }

    if (matchStatus) {
      await client.query(
        'UPDATE matches SET status = $2, updated_at = CURRENT_TIMESTAMP WHERE match_id = $1',
        [matchId, matchStatus]
      );
    }

    await client.query('COMMIT');

    const { rows } = await client.query(
      `SELECT m.*,
              COALESCE(json_agg(i ORDER BY i.innings_number) FILTER (WHERE i.innings_id IS NOT NULL), '[]') AS innings
       FROM matches m
       LEFT JOIN innings i ON i.match_id = m.match_id
       WHERE m.match_id = $1
       GROUP BY m.match_id`,
      [matchId]
    );

    return ApiResponse.success(res, rows[0], 'Scores updated');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { recordBall, getLiveScore, updateMatchScores };
