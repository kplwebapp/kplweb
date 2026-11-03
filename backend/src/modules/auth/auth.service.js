const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const authRepository = require('./auth.repository');
const loginSessionsRepository = require('./loginSessions.repository');
const changeRepository = require('../profile/profile.change.repository');
const pool = require('../../config/database');

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');
const generateOtp = () => String(crypto.randomInt(100000, 999999));
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseDurationMs = (value) => {
  const match = /^(\d+)\s*([smhd])$/i.exec(String(value || '').trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return amount * mult;
};

const signTokens = (userId, sessionId) => {
  const accessToken = jwt.sign({ sub: userId, sid: sessionId }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
  const refreshToken = jwt.sign({ sub: userId, sid: sessionId, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const issueSession = async (userId, meta = {}) => {
  const sessionId = crypto.randomUUID();
  const tokens = signTokens(userId, sessionId);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn));
  await loginSessionsRepository.create({
    sessionId,
    userId,
    refreshTokenHash: hashToken(tokens.refreshToken),
    clientType: meta.clientType || 'web',
    ipAddress: meta.ipAddress || null,
    userAgent: meta.userAgent || null,
    expiresAt,
  });
  return tokens;
};

const getUserWithRoles = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.full_name, u.email,
            u.mobile, u.dob, u.vibhaag, u.blood_group, u.profile_photo, u.created_at,
            COALESCE(json_agg(DISTINCT r.role_code) FILTER (WHERE r.role_code IS NOT NULL), '[]') AS roles,
            COALESCE(
              (
                SELECT json_agg(permission_code ORDER BY permission_code)
                FROM (
                  SELECT DISTINCT p.permission_code
                  FROM user_roles ur2
                  JOIN role_permissions rp ON rp.role_id = ur2.role_id
                  JOIN permissions p ON p.permission_id = rp.permission_id
                  WHERE ur2.user_id = u.user_id
                ) perms
              ),
              '[]'
            ) AS permissions
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.user_id
     LEFT JOIN roles r ON r.role_id = ur.role_id
     WHERE u.user_id = $1
     GROUP BY u.user_id`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    date_of_birth: row.dob,
    profile_photo_url: row.profile_photo,
    permissions: row.permissions || [],
  };
};

const register = async (body) => {
  const { name, email, password, mobile, vibhaag, bloodGroup } = body;
  const dob = body.dob || body.dateOfBirth || null;

  const existing = await authRepository.findByEmail(email);
  if (existing) throw new ApiError(409, 'Email already registered');

  const mobileDigits = digitsOnly(mobile);
  if (mobileDigits) {
    const existingMobile = await authRepository.findByMobileDigits(mobileDigits);
    if (existingMobile) throw new ApiError(409, 'Mobile number already registered');
  }

  let firstName;
  let middleName = body.middleName || null;
  let lastName;
  let fullName;

  if (body.firstName && body.lastName) {
    firstName = body.firstName.trim();
    lastName = body.lastName.trim();
    fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  } else {
    const parts = name.trim().split(/\s+/);
    firstName = parts[0];
    lastName = parts.length > 1 ? parts[parts.length - 1] : firstName;
    if (parts.length > 2) {
      middleName = parts.slice(1, -1).join(' ');
    }
    fullName = name.trim();
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await authRepository.createUser({
    firstName,
    middleName,
    lastName,
    fullName,
    email,
    passwordHash,
    mobile: mobile || null,
    dob: dob || null,
    vibhaag: vibhaag || null,
    bloodGroup: bloodGroup || null,
  });

  await authRepository.createPlayer(user.user_id);
  await authRepository.assignRole(user.user_id, 'PLAYER');

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
    },
    pendingApproval: true,
  };
};

const login = async ({ email, password }, meta = {}) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  if (!user.is_active) {
    throw new ApiError(
      403,
      'Your account is pending approval. Please wait for an administrator to approve your registration.'
    );
  }

  const tokens = await issueSession(user.user_id, { ...meta, clientType: meta.clientType || 'web' });
  const fullUser = await getUserWithRoles(user.user_id);

  return { user: fullUser, ...tokens };
};

/** Accounts with admin:access (or Super Admin) may open the admin panel. */
const adminLogin = async ({ email, password }, meta = {}) => {
  const user = await authRepository.findByEmail(email);
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  if (!user.is_active) {
    throw new ApiError(
      403,
      'Your account is pending approval. Please wait for an administrator to approve your registration.'
    );
  }

  const fullUser = await getUserWithRoles(user.user_id);
  const canAccessAdmin =
    fullUser.roles.includes('SUPER_ADMIN') ||
    (fullUser.permissions || []).includes('admin:access');
  if (!canAccessAdmin) {
    throw new ApiError(403, 'This account does not have access to the admin panel.');
  }

  const tokens = await issueSession(user.user_id, { ...meta, clientType: 'admin' });
  return { user: fullUser, ...tokens };
};

const refresh = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh' || !payload.sid || !payload.sub) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const session = await loginSessionsRepository.findActiveById(payload.sid);
  if (!session || Number(session.user_id) !== Number(payload.sub)) {
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }

  if (session.refresh_token_hash !== hashToken(refreshToken)) {
    await loginSessionsRepository.revoke(payload.sid);
    throw new ApiError(401, 'Refresh token reuse detected. Please sign in again.');
  }

  const tokens = signTokens(payload.sub, payload.sid);
  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn));
  await loginSessionsRepository.rotateRefresh(payload.sid, hashToken(tokens.refreshToken), expiresAt);
  return tokens;
};

const me = async (userId) => getUserWithRoles(userId);

const listSessions = async (userId, currentSessionId) => {
  const rows = await loginSessionsRepository.listActiveForUser(userId);
  return rows.map((row) => ({
    session_id: row.session_id,
    client_type: row.client_type,
    ip_address: row.ip_address,
    user_agent: row.user_agent,
    created_at: row.created_at,
    last_seen_at: row.last_seen_at,
    expires_at: row.expires_at,
    is_current: row.session_id === currentSessionId,
  }));
};

const logout = async (sessionId) => {
  if (!sessionId) return { revoked: false };
  const row = await loginSessionsRepository.revoke(sessionId);
  return { revoked: Boolean(row) };
};

const revokeSession = async (userId, sessionId) => {
  const row = await loginSessionsRepository.revoke(sessionId, userId);
  if (!row) throw new ApiError(404, 'Session not found');
  return { revoked: true };
};

const logoutAll = async (userId, currentSessionId, { keepCurrent = false } = {}) => {
  const count = await loginSessionsRepository.revokeAllForUser(
    userId,
    keepCurrent ? currentSessionId : null
  );
  return { revoked: count };
};

/** Temporary mobile allowlist for app testing (must match mobile ALLOWED_LOGIN_MOBILES). */
const DEV_LOGIN_MOBILES = new Set(['9726101600']);

const isDevLoginMobile = (digits) => {
  if (env.nodeEnv === 'production') return false;
  return [...DEV_LOGIN_MOBILES].some((allowed) => digits === allowed || digits.endsWith(allowed));
};

/**
 * Non-prod only: ensure the allowlisted test mobile can log in without waiting for admin approval.
 * Creates a PLAYER account when missing, or activates an existing pending one.
 */
const ensureDevLoginUser = async (digits) => {
  let user = await authRepository.findByMobileDigits(digits);
  if (user) {
    if (!user.is_active) {
      user = await authRepository.setActive(user.user_id, true);
    }
    return user;
  }

  const email = `mobile${digits}@kpl.local`;
  const existingEmail = await authRepository.findByEmail(email);
  if (existingEmail) {
    await pool.query(
      `UPDATE users SET mobile = $2, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [existingEmail.user_id, digits]
    );
    return authRepository.findByMobileDigits(digits);
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
  user = await authRepository.createUser({
    firstName: 'KPL',
    middleName: null,
    lastName: 'Member',
    fullName: 'KPL Member',
    email,
    passwordHash,
    mobile: digits,
    dob: null,
    vibhaag: null,
    bloodGroup: null,
  });
  await authRepository.setActive(user.user_id, true);
  await authRepository.createPlayer(user.user_id);
  await authRepository.assignRole(user.user_id, 'PLAYER');
  return authRepository.findByMobileDigits(digits);
};

/**
 * Mobile OTP login for the community app.
 * Reuses otp_verifications (same pattern as profile change OTPs).
 * SMS gateway is not wired yet — OTP is logged server-side; in non-production
 * responses may include devOtp for local testing.
 */
const requestMobileOtp = async ({ mobile }) => {
  const digits = digitsOnly(mobile);
  if (digits.length < 10) {
    throw new ApiError(400, 'Enter a valid mobile number');
  }

  let user = await authRepository.findByMobileDigits(digits);
  if (!user && isDevLoginMobile(digits)) {
    user = await ensureDevLoginUser(digits);
  }
  if (!user) {
    throw new ApiError(404, 'No account found for this mobile number. Please register.');
  }

  if (!user.is_active) {
    if (isDevLoginMobile(digits)) {
      user = await ensureDevLoginUser(digits);
    } else {
      throw new ApiError(
        403,
        'Your account is pending approval. Please wait for an administrator to approve your registration.'
      );
    }
  }

  const otp = generateOtp();
  await changeRepository.createOtpVerification(user.user_id, otp, otp);
  logger.info('Mobile login OTP generated', { userId: user.user_id, mobile: user.mobile });
  console.log(`SMS OTP (login) sent to ${user.mobile}: ${otp}`);

  const payload = {
    mobile: user.mobile,
    expiresInMinutes: 10,
    message: 'OTP sent to your registered mobile number',
  };
  if (env.nodeEnv !== 'production') {
    payload.devOtp = otp;
  }
  return payload;
};

const verifyMobileOtp = async ({ mobile, otp }, meta = {}) => {
  const digits = digitsOnly(mobile);
  let user = await authRepository.findByMobileDigits(digits);
  if (!user && isDevLoginMobile(digits)) {
    user = await ensureDevLoginUser(digits);
  }
  if (!user) {
    throw new ApiError(404, 'No account found for this mobile number. Please register.');
  }

  if (!user.is_active) {
    if (isDevLoginMobile(digits)) {
      user = await ensureDevLoginUser(digits);
    } else {
      throw new ApiError(
        403,
        'Your account is pending approval. Please wait for an administrator to approve your registration.'
      );
    }
  }

  const verification = await changeRepository.findActiveOtpVerification(user.user_id);
  if (!verification) {
    throw new ApiError(400, 'OTP expired or not found. Please request a new code.');
  }

  if (verification.mobile_otp !== String(otp)) {
    throw new ApiError(400, 'Invalid OTP');
  }

  await changeRepository.markOtpVerified(verification.verification_id);
  const tokens = await issueSession(user.user_id, { ...meta, clientType: 'mobile' });
  const fullUser = await getUserWithRoles(user.user_id);
  return { user: fullUser, ...tokens };
};

module.exports = {
  register,
  login,
  adminLogin,
  refresh,
  me,
  listSessions,
  logout,
  revokeSession,
  logoutAll,
  requestMobileOtp,
  verifyMobileOtp,
};
