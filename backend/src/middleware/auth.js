const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwt.secret);

    const { rows } = await pool.query(
      `SELECT u.user_id, u.email, u.first_name, u.last_name, u.full_name, u.is_active,
              COALESCE(json_agg(DISTINCT r.role_code) FILTER (WHERE r.role_code IS NOT NULL), '[]') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.user_id
       LEFT JOIN roles r ON r.role_id = ur.role_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [payload.sub]
    );

    if (!rows.length || !rows[0].is_active) {
      throw new ApiError(401, 'Invalid or inactive user');
    }

    req.user = {
      id: rows[0].user_id,
      email: rows[0].email,
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      fullName: rows[0].full_name,
      roles: rows[0].roles,
    };

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    return next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuth };
