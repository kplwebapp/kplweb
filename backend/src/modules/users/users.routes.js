const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { listQuerySchema } = require('./users.validation');
const usersController = require('./users.controller');

const router = Router();

router.get('/', authenticate, authorize(PERMISSIONS.USERS_READ), validate(listQuerySchema, 'query'), usersController.list);
router.patch('/:id/approve', authenticate, authorize(PERMISSIONS.USERS_WRITE), usersController.approve);
router.patch('/:id/reject', authenticate, authorize(PERMISSIONS.USERS_WRITE), usersController.reject);
router.get('/:id', authenticate, authorize(PERMISSIONS.USERS_READ), usersController.getById);

module.exports = router;
