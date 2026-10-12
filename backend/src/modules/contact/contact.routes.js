const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { submitContactSchema, updateStatusSchema } = require('./contact.validation');
const contactController = require('./contact.controller');

const router = Router();

router.post('/', validate(submitContactSchema), contactController.submit);
router.get('/messages', authenticate, authorize(PERMISSIONS.SETTINGS_READ), contactController.listAll);
router.patch('/messages/:id', authenticate, authorize(PERMISSIONS.SETTINGS_WRITE), validate(updateStatusSchema), contactController.updateStatus);

module.exports = router;
