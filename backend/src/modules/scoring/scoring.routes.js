const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { recordBallSchema, updateScoresSchema } = require('./scoring.validation');
const scoringController = require('./scoring.controller');

const router = Router();

router.get('/live/:matchId', scoringController.getLiveScore);
router.put('/:matchId/scores', authenticate, authorize(PERMISSIONS.SCORING_WRITE), validate(updateScoresSchema), scoringController.updateMatchScores);
router.patch('/:matchId/scores', authenticate, authorize(PERMISSIONS.SCORING_WRITE), validate(updateScoresSchema), scoringController.updateMatchScores);
router.post('/:matchId/ball', authenticate, authorize(PERMISSIONS.SCORING_LIVE), validate(recordBallSchema), scoringController.recordBall);

module.exports = router;
