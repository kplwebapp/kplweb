const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const authRepository = require('./auth.repository');
const pool = require('../../config/database');

const signTokens = (userId) => {
  const accessToken = jwt.sign({ sub: userId }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
  const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const getUserWithRoles = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.user_id, u.first_name, u.middle_name, u.last_name, u.full_name, u.email,
            u.mobile, u.dob, u.vibhaag, u.blood_group, u.profile_photo, u.created_at,
            COALESCE(json_agg(DISTINCT r.role_code) FILTER (WHERE r.role_code IS NOT NULL), '[]') AS roles
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
  };
};

const register = async (body) => {
  const { name, email, password, mobile, vibhaag, bloodGroup } = body;
  const dob = body.dob || body.dateOfBirth || null;

  const existing = await authRepository.findByEmail(email);
  if (existing) throw new ApiError(409, 'Email already registered');

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

const login = async ({ email, password }) => {
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

  const tokens = signTokens(user.user_id);
  const fullUser = await getUserWithRoles(user.user_id);

  return { user: fullUser, ...tokens };
};

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'TEAM_MANAGER', 'SCORER'];

/** Same credentials check as `login`, but only accounts with a staff role may open the admin panel. */
const adminLogin = async (credentials) => {
  const result = await login(credentials);
  if (!result.user.roles.some((role) => STAFF_ROLES.includes(role))) {
    throw new ApiError(403, 'This account does not have access to the admin panel.');
  }
  return result;
};

const refresh = async (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
    if (payload.type !== 'refresh') throw new ApiError(401, 'Invalid refresh token');
    return signTokens(payload.sub);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

const me = async (userId) => getUserWithRoles(userId);

module.exports = { register, login, adminLogin, refresh, me };
