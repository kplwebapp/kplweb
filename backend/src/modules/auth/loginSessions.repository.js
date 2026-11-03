const pool = require('../../config/database');

const create = async ({
  sessionId,
  userId,
  refreshTokenHash,
  clientType,
  ipAddress,
  userAgent,
  expiresAt,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO login_sessions (
       session_id, user_id, refresh_token_hash, client_type,
       ip_address, user_agent, expires_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING session_id, user_id, client_type, ip_address, user_agent,
               created_at, last_seen_at, expires_at, revoked_at`,
    [sessionId, userId, refreshTokenHash, clientType, ipAddress, userAgent, expiresAt]
  );
  return rows[0];
};

const findActiveById = async (sessionId) => {
  const { rows } = await pool.query(
    `SELECT session_id, user_id, refresh_token_hash, client_type,
            ip_address, user_agent, created_at, last_seen_at, expires_at, revoked_at
     FROM login_sessions
     WHERE session_id = $1
       AND revoked_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP`,
    [sessionId]
  );
  return rows[0] || null;
};

const touchLastSeen = async (sessionId) => {
  await pool.query(
    `UPDATE login_sessions
     SET last_seen_at = CURRENT_TIMESTAMP
     WHERE session_id = $1
       AND revoked_at IS NULL
       AND last_seen_at < CURRENT_TIMESTAMP - INTERVAL '5 minutes'`,
    [sessionId]
  );
};

const rotateRefresh = async (sessionId, refreshTokenHash, expiresAt) => {
  const { rows } = await pool.query(
    `UPDATE login_sessions
     SET refresh_token_hash = $2,
         expires_at = $3,
         last_seen_at = CURRENT_TIMESTAMP
     WHERE session_id = $1
       AND revoked_at IS NULL
     RETURNING session_id`,
    [sessionId, refreshTokenHash, expiresAt]
  );
  return rows[0] || null;
};

const revoke = async (sessionId, userId = null) => {
  const params = [sessionId];
  let sql = `UPDATE login_sessions
              SET revoked_at = CURRENT_TIMESTAMP
              WHERE session_id = $1 AND revoked_at IS NULL`;
  if (userId != null) {
    params.push(userId);
    sql += ' AND user_id = $2';
  }
  sql += ' RETURNING session_id';
  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
};

const revokeAllForUser = async (userId, exceptSessionId = null) => {
  const params = [userId];
  let sql = `UPDATE login_sessions
              SET revoked_at = CURRENT_TIMESTAMP
              WHERE user_id = $1 AND revoked_at IS NULL`;
  if (exceptSessionId) {
    params.push(exceptSessionId);
    sql += ' AND session_id <> $2';
  }
  const { rowCount } = await pool.query(sql, params);
  return rowCount;
};

const listActiveForUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT session_id, client_type, ip_address, user_agent,
            created_at, last_seen_at, expires_at
     FROM login_sessions
     WHERE user_id = $1
       AND revoked_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY last_seen_at DESC`,
    [userId]
  );
  return rows;
};

module.exports = {
  create,
  findActiveById,
  touchLastSeen,
  rotateRefresh,
  revoke,
  revokeAllForUser,
  listActiveForUser,
};
