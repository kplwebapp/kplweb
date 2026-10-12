const { Router } = require('express');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { bulkUpdatePointsTableSchema } = require('./statistics.validation');
const statsController = require('./statistics.controller');

const router = Router();

router.get('/seasons', optionalAuth, statsController.getSeasons);
router.get('/points-table', optionalAuth, statsController.getPointsTable);
router.put('/points-table', authenticate, authorize(PERMISSIONS.STATS_WRITE), validate(bulkUpdatePointsTableSchema), statsController.bulkUpdatePointsTable);
router.get('/players', optionalAuth, statsController.getPlayerStats);
router.get('/teams', optionalAuth, statsController.getTeamStats);

module.exports = router;
