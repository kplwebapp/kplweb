const { ROLE_PERMISSIONS } = require('@kpl/shared');
const ApiError = require('../utils/ApiError');
const pool = require('../config/database');

const getUserPermissions = async (userId) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT p.permission_code
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.permission_id = rp.permission_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return rows.map((r) => r.permission_code);
};

const authorize = (...requiredPermissions) => async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    if (req.user.roles?.includes('SUPER_ADMIN')) {
      return next();
    }

    let permissions = req.user.permissions;
    if (!permissions) {
      permissions = await getUserPermissions(req.user.id);
      req.user.permissions = permissions;
    }

    const hasPermission = requiredPermissions.some((p) => permissions.includes(p));
    if (!hasPermission) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    next();
  } catch (err) {
    next(err);
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required'));
  }
  const allowed = req.user.roles?.some((r) => roles.includes(r));
  if (!allowed) {
    return next(new ApiError(403, 'Insufficient role access'));
  }
  return next();
};

module.exports = { authorize, authorizeRoles, getUserPermissions, ROLE_PERMISSIONS };
