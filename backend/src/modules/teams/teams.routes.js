const { Router } = require('express');
const { authenticate, optionalAuth } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { activityImageUpload } = require('../../middleware/upload');
const { createTeamSchema, updateTeamSchema } = require('./teams.validation');
const teamsController = require('./teams.controller');

const router = Router();
const canWrite = [authenticate, authorize(PERMISSIONS.TEAMS_WRITE)];

// Public browse (web + mobile) — same active roster on both clients
router.get('/', optionalAuth, teamsController.list);
router.get('/:id', optionalAuth, teamsController.getById);
router.post('/', ...canWrite, validate(createTeamSchema), teamsController.create);
router.put('/:id', ...canWrite, validate(updateTeamSchema), teamsController.update);
router.post('/:id/logo', ...canWrite, activityImageUpload, teamsController.uploadLogo);
router.delete('/:id/logo', ...canWrite, teamsController.removeLogo);

module.exports = router;
