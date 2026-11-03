const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/authorize');
const { ROLES } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { createRoleSchema, updateRoleSchema } = require('./roles.validation');
const rolesController = require('./roles.controller');

const router = Router();

/** Role and access management is Super Admin only. */
const superAdminOnly = [authenticate, authorizeRoles(ROLES.SUPER_ADMIN)];

router.get('/', ...superAdminOnly, rolesController.listRoles);
router.get('/permissions', ...superAdminOnly, rolesController.listPermissions);
router.get('/areas', ...superAdminOnly, rolesController.listAdminAreas);
router.get('/:roleId', ...superAdminOnly, rolesController.getRole);
router.post('/', ...superAdminOnly, validate(createRoleSchema), rolesController.createRole);
router.put('/:roleId', ...superAdminOnly, validate(updateRoleSchema), rolesController.updateRole);
router.delete('/:roleId', ...superAdminOnly, rolesController.deleteRole);

module.exports = router;
