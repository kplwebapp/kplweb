const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const dashboardController = require('./dashboard.controller');

const router = Router();

router.get('/summary', authenticate, authorize(PERMISSIONS.DASHBOARD_READ), dashboardController.getSummary);

module.exports = router;
