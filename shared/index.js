const { ROLES, ROLE_HIERARCHY } = require('./constants/roles');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('./constants/permissions');
const {
  ADMIN_PANEL_AREAS,
  permissionsForAreas,
  areasFromPermissions,
} = require('./constants/adminAreas');
const { API_ROUTES } = require('./constants/apiRoutes');

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ADMIN_PANEL_AREAS,
  permissionsForAreas,
  areasFromPermissions,
  API_ROUTES,
};
