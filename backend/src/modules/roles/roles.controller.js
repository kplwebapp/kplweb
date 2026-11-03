const { ADMIN_PANEL_AREAS } = require('@kpl/shared');
const rolesService = require('./roles.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const listRoles = asyncHandler(async (_req, res) => {
  const roles = await rolesService.listRoles();
  return ApiResponse.success(res, roles);
});

const listPermissions = asyncHandler(async (_req, res) => {
  const permissions = await rolesService.listPermissions();
  return ApiResponse.success(res, permissions);
});

const listAdminAreas = asyncHandler(async (_req, res) => {
  return ApiResponse.success(res, ADMIN_PANEL_AREAS);
});

const getRole = asyncHandler(async (req, res) => {
  const role = await rolesService.getRole(Number(req.params.roleId));
  return ApiResponse.success(res, role);
});

const createRole = asyncHandler(async (req, res) => {
  const role = await rolesService.createRole(req.body);
  return ApiResponse.success(res, role, 'Role created', 201);
});

const updateRole = asyncHandler(async (req, res) => {
  const role = await rolesService.updateRole(Number(req.params.roleId), req.body);
  return ApiResponse.success(res, role, 'Role updated');
});

const deleteRole = asyncHandler(async (req, res) => {
  const result = await rolesService.deleteRole(Number(req.params.roleId));
  return ApiResponse.success(res, result, 'Role deleted');
});

module.exports = {
  listRoles,
  listPermissions,
  listAdminAreas,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
