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

module.exports = { listRoles, listPermissions };
