const pool = require('../../config/database');

const findAllRoles = async () => {
  const { rows } = await pool.query(
    `SELECT r.role_id, r.role_code, r.role_name, r.description, r.created_at,
            COALESCE(json_agg(p.permission_code ORDER BY p.permission_code)
              FILTER (WHERE p.permission_code IS NOT NULL), '[]') AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
     LEFT JOIN permissions p ON p.permission_id = rp.permission_id
     GROUP BY r.role_id
     ORDER BY r.role_id`
  );
  return rows;
};

const findRoleById = async (roleId) => {
  const { rows } = await pool.query(
    `SELECT r.role_id, r.role_code, r.role_name, r.description, r.created_at,
            COALESCE(json_agg(p.permission_code ORDER BY p.permission_code)
              FILTER (WHERE p.permission_code IS NOT NULL), '[]') AS permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
     LEFT JOIN permissions p ON p.permission_id = rp.permission_id
     WHERE r.role_id = $1
     GROUP BY r.role_id`,
    [roleId]
  );
  return rows[0] || null;
};

const findRoleByCode = async (roleCode) => {
  const { rows } = await pool.query(
    `SELECT role_id, role_code, role_name, description FROM roles WHERE role_code = $1`,
    [roleCode]
  );
  return rows[0] || null;
};

const findAllPermissions = async () => {
  const { rows } = await pool.query(
    `SELECT permission_id, permission_code, permission_name, module, description
     FROM permissions
     ORDER BY module, permission_code`
  );
  return rows;
};

const findPermissionIdsByCodes = async (codes) => {
  if (!codes.length) return [];
  const { rows } = await pool.query(
    `SELECT permission_id, permission_code
     FROM permissions
     WHERE permission_code = ANY($1::text[])`,
    [codes]
  );
  return rows;
};

const createRole = async ({ roleCode, roleName, description }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO roles (role_code, role_name, description)
     VALUES ($1, $2, $3)
     RETURNING role_id, role_code, role_name, description, created_at`,
    [roleCode, roleName, description || null]
  );
  return rows[0];
};

const updateRole = async (roleId, { roleName, description }, client = pool) => {
  const { rows } = await client.query(
    `UPDATE roles
     SET role_name = $2,
         description = $3
     WHERE role_id = $1
     RETURNING role_id, role_code, role_name, description, created_at`,
    [roleId, roleName, description || null]
  );
  return rows[0] || null;
};

const replaceRolePermissions = async (roleId, permissionIds, client = pool) => {
  await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
  for (const permissionId of permissionIds) {
    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [roleId, permissionId]
    );
  }
};

const countUsersWithRole = async (roleId) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM user_roles WHERE role_id = $1',
    [roleId]
  );
  return rows[0].count;
};

const deleteRole = async (roleId) => {
  const { rowCount } = await pool.query('DELETE FROM roles WHERE role_id = $1', [roleId]);
  return rowCount > 0;
};

module.exports = {
  findAllRoles,
  findRoleById,
  findRoleByCode,
  findAllPermissions,
  findPermissionIdsByCodes,
  createRole,
  updateRole,
  replaceRolePermissions,
  countUsersWithRole,
  deleteRole,
};
