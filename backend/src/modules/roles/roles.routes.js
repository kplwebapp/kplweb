const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const rolesController = require('./roles.controller');

const router = Router();

router.get('/', authenticate, authorize(PERMISSIONS.ROLES_READ), rolesController.listRoles);
router.get('/permissions', authenticate, authorize(PERMISSIONS.PERMISSIONS_READ), rolesController.listPermissions);

module.exports = router;
