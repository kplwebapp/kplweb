const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { updateSettingsSchema } = require('./settings.validation');
const settingsController = require('./settings.controller');

const router = Router();

router.get('/public', settingsController.getPublic);
router.get('/', authenticate, authorize(PERMISSIONS.SETTINGS_READ), settingsController.getAll);
router.put('/', authenticate, authorize(PERMISSIONS.SETTINGS_WRITE), validate(updateSettingsSchema), settingsController.update);

module.exports = router;
