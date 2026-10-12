const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const { controller } = require('./notifications.controller');

const router = Router();

router.get('/', authenticate, authorize(PERMISSIONS.NOTIFICATIONS_READ), controller.list);

module.exports = router;
