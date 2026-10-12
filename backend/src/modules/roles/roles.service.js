const rolesRepository = require('./roles.repository');

const listRoles = () => rolesRepository.findAllRoles();
const listPermissions = () => rolesRepository.findAllPermissions();

module.exports = { listRoles, listPermissions };
