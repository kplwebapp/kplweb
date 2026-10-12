const pool = require('../../config/database');

const findAllRoles = async () => {
  const { rows } = await pool.query(
    `SELECT r.role_id, r.role_code, r.role_name, r.description,
            COALESCE(json_agg(p.permission_code) FILTER (WHERE p.permission_code IS NOT NULL), '[]') AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
     LEFT JOIN permissions p ON p.permission_id = rp.permission_id
     GROUP BY r.role_id
     ORDER BY r.role_id`
  );
  return rows;
};

const findAllPermissions = async () => {
  const { rows } = await pool.query(
    'SELECT permission_id, permission_code, permission_name, module FROM permissions ORDER BY module, permission_code'
  );
  return rows;
};

module.exports = { findAllRoles, findAllPermissions };
