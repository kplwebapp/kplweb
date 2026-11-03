const {
  areasFromPermissions,
  permissionsForAreas,
  ROLES,
} = require('@kpl/shared');
const ApiError = require('../../utils/ApiError');
const pool = require('../../config/database');
const rolesRepository = require('./roles.repository');

const SYSTEM_ROLE_CODES = new Set(Object.values(ROLES));

const withAreas = (role) => ({
  ...role,
  is_system: SYSTEM_ROLE_CODES.has(role.role_code),
  areas: areasFromPermissions(role.permissions || []),
});

const listRoles = async () => {
  const roles = await rolesRepository.findAllRoles();
  return roles.map(withAreas);
};

const listPermissions = () => rolesRepository.findAllPermissions();

const getRole = async (roleId) => {
  const role = await rolesRepository.findRoleById(roleId);
  if (!role) throw new ApiError(404, 'Role not found');
  return withAreas(role);
};

const resolvePermissionIds = async (areaKeys) => {
  const codes = permissionsForAreas(areaKeys);
  const rows = await rolesRepository.findPermissionIdsByCodes(codes);
  const found = new Set(rows.map((r) => r.permission_code));
  const missing = codes.filter((code) => !found.has(code));
  if (missing.length) {
    throw new ApiError(400, `Unknown permissions: ${missing.join(', ')}`);
  }
  return rows.map((r) => r.permission_id);
};

const createRole = async ({ roleName, roleCode, description, areas }) => {
  const code = String(roleCode).trim().toUpperCase();
  if (SYSTEM_ROLE_CODES.has(code)) {
    throw new ApiError(409, 'That role code is reserved for a built-in role');
  }

  const existing = await rolesRepository.findRoleByCode(code);
  if (existing) throw new ApiError(409, 'A role with this code already exists');

  const permissionIds = await resolvePermissionIds(areas);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const role = await rolesRepository.createRole(
      { roleCode: code, roleName: roleName.trim(), description: description || null },
      client
    );
    await rolesRepository.replaceRolePermissions(role.role_id, permissionIds, client);
    await client.query('COMMIT');
    return getRole(role.role_id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateRole = async (roleId, { roleName, description, areas }) => {
  const existing = await rolesRepository.findRoleById(roleId);
  if (!existing) throw new ApiError(404, 'Role not found');

  if (existing.role_code === ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'The Super Admin role cannot be changed');
  }

  const permissionIds = await resolvePermissionIds(areas);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await rolesRepository.updateRole(
      roleId,
      { roleName: roleName.trim(), description: description || null },
      client
    );
    await rolesRepository.replaceRolePermissions(roleId, permissionIds, client);
    await client.query('COMMIT');
    return getRole(roleId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteRole = async (roleId) => {
  const existing = await rolesRepository.findRoleById(roleId);
  if (!existing) throw new ApiError(404, 'Role not found');
  if (SYSTEM_ROLE_CODES.has(existing.role_code)) {
    throw new ApiError(403, 'Built-in roles cannot be deleted');
  }

  const assigned = await rolesRepository.countUsersWithRole(roleId);
  if (assigned > 0) {
    throw new ApiError(409, `This role is assigned to ${assigned} user(s). Reassign them first.`);
  }

  await rolesRepository.deleteRole(roleId);
  return { deleted: true };
};

module.exports = {
  listRoles,
  listPermissions,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
