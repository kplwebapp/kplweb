const { Router } = require('express');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { createMatchSchema, updateMatchSchema } = require('./matches.validation');
const matchesController = require('./matches.controller');

const router = Router();

router.get('/', optionalAuth, matchesController.list);
router.get('/:id', optionalAuth, matchesController.getById);
router.post('/', authenticate, authorize(PERMISSIONS.MATCHES_WRITE), validate(createMatchSchema), matchesController.create);
router.put('/:id', authenticate, authorize(PERMISSIONS.MATCHES_WRITE), validate(updateMatchSchema), matchesController.update);
router.patch('/:id', authenticate, authorize(PERMISSIONS.MATCHES_WRITE), validate(updateMatchSchema), matchesController.update);

module.exports = router;
