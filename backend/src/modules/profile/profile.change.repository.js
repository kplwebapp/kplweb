const pool = require('../../config/database');

const OTP_TTL_MINUTES = 10;

const createOtpVerification = async (userId, emailOtp, mobileOtp) => {
  await pool.query(
    `UPDATE otp_verifications
     SET verified = TRUE
     WHERE user_id = $1 AND verified = FALSE`,
    [userId]
  );

  const { rows } = await pool.query(
    `INSERT INTO otp_verifications (user_id, email_otp, mobile_otp, expires_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP + ($4 || ' minutes')::INTERVAL)
     RETURNING verification_id, user_id, expires_at, created_at`,
    [userId, emailOtp, mobileOtp, OTP_TTL_MINUTES]
  );
  return rows[0];
};

const findActiveOtpVerification = async (userId) => {
  const { rows } = await pool.query(
    `SELECT verification_id, user_id, email_otp, mobile_otp, expires_at, verified, created_at
     FROM otp_verifications
     WHERE user_id = $1
       AND verified = FALSE
       AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const markOtpVerified = async (verificationId) => {
  const { rows } = await pool.query(
    `UPDATE otp_verifications
     SET verified = TRUE
     WHERE verification_id = $1
     RETURNING verification_id, user_id, verified`,
    [verificationId]
  );
  return rows[0] || null;
};

const createChangeRequest = async ({ userId, fieldName, oldValue, newValue }) => {
  const { rows } = await pool.query(
    `INSERT INTO profile_change_requests
       (user_id, field_name, old_value, new_value, status, otp_verified_at)
     VALUES ($1, $2, $3, $4, 'PENDING', CURRENT_TIMESTAMP)
     RETURNING request_id, user_id, field_name, old_value, new_value, status,
               otp_verified_at, created_at, reviewed_at, reviewed_by`,
    [userId, fieldName, oldValue, newValue]
  );
  return rows[0];
};

const findPendingByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT request_id, user_id, field_name, old_value, new_value, status,
            otp_verified_at, created_at, reviewed_at, reviewed_by
     FROM profile_change_requests
     WHERE user_id = $1 AND status = 'PENDING'
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};

const findPendingVibhaagByUser = async (userId) => {
  const { rows } = await pool.query(
    `SELECT request_id, user_id, field_name, old_value, new_value, status,
            otp_verified_at, created_at
     FROM profile_change_requests
     WHERE user_id = $1 AND field_name = 'vibhaag' AND status = 'PENDING'
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

const listChangeRequests = async ({ status = 'PENDING' } = {}) => {
  const { rows } = await pool.query(
    `SELECT pcr.request_id, pcr.user_id, pcr.field_name, pcr.old_value, pcr.new_value,
            pcr.status, pcr.otp_verified_at, pcr.created_at, pcr.reviewed_at, pcr.reviewed_by,
            u.first_name, u.last_name, u.full_name, u.email, u.mobile
     FROM profile_change_requests pcr
     JOIN users u ON u.user_id = pcr.user_id
     WHERE ($1::VARCHAR IS NULL OR pcr.status = $1)
     ORDER BY pcr.created_at ASC`,
    [status || null]
  );
  return rows;
};

const findChangeRequestById = async (requestId) => {
  const { rows } = await pool.query(
    `SELECT pcr.request_id, pcr.user_id, pcr.field_name, pcr.old_value, pcr.new_value,
            pcr.status, pcr.otp_verified_at, pcr.created_at, pcr.reviewed_at, pcr.reviewed_by,
            u.first_name, u.last_name, u.full_name, u.email, u.mobile, u.vibhaag
     FROM profile_change_requests pcr
     JOIN users u ON u.user_id = pcr.user_id
     WHERE pcr.request_id = $1`,
    [requestId]
  );
  return rows[0] || null;
};

const approveChangeRequest = async (requestId, reviewerId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: requestRows } = await client.query(
      `SELECT request_id, user_id, field_name, new_value, status
       FROM profile_change_requests
       WHERE request_id = $1
       FOR UPDATE`,
      [requestId]
    );
    const request = requestRows[0];
    if (!request) {
      await client.query('ROLLBACK');
      return null;
    }
    if (request.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return { error: 'NOT_PENDING' };
    }

    if (request.field_name === 'vibhaag') {
      await client.query(
        `UPDATE users SET vibhaag = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
        [request.user_id, request.new_value]
      );
    }

    const { rows } = await client.query(
      `UPDATE profile_change_requests
       SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
       WHERE request_id = $1
       RETURNING request_id, user_id, field_name, old_value, new_value, status,
                 otp_verified_at, created_at, reviewed_at, reviewed_by`,
      [requestId, reviewerId]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const rejectChangeRequest = async (requestId, reviewerId) => {
  const { rows } = await pool.query(
    `UPDATE profile_change_requests
     SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $2
     WHERE request_id = $1 AND status = 'PENDING'
     RETURNING request_id, user_id, field_name, old_value, new_value, status,
               otp_verified_at, created_at, reviewed_at, reviewed_by`,
    [requestId, reviewerId]
  );
  if (!rows.length) return null;
  return rows[0];
};

module.exports = {
  createOtpVerification,
  findActiveOtpVerification,
  markOtpVerified,
  createChangeRequest,
  findPendingByUser,
  findPendingVibhaagByUser,
  listChangeRequests,
  findChangeRequestById,
  approveChangeRequest,
  rejectChangeRequest,
};
