const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { galleryPhotosUpload } = require('../../middleware/upload');
const {
  idParamsSchema,
  teamParamsSchema,
  matchParamsSchema,
  mediaParamsSchema,
  addTeamsSchema,
  matchSchema,
  addVideosSchema,
  captionSchema,
} = require('./tournamentDetails.validation');
const controller = require('./tournamentDetails.controller');

/** Mounted under /events: teams, matches, points table and gallery of a tournament. */
const router = Router();

const canRead = [authenticate, authorize(PERMISSIONS.TOURNAMENTS_READ)];
const canWrite = [authenticate, authorize(PERMISSIONS.TOURNAMENTS_WRITE)];
const params = (schema) => validate(schema, 'params');

router.get('/slug/:slug/details', controller.getPublicDetails);

router.get('/:id/teams', ...canRead, params(idParamsSchema), controller.listTeams);
router.post('/:id/teams', ...canWrite, params(idParamsSchema), validate(addTeamsSchema), controller.addTeams);
router.delete('/:id/teams/:teamId', ...canWrite, params(teamParamsSchema), controller.removeTeam);

router.get('/:id/matches', ...canRead, params(idParamsSchema), controller.listMatches);
router.post('/:id/matches', ...canWrite, params(idParamsSchema), validate(matchSchema), controller.createMatch);
router.put('/:id/matches/:matchId', ...canWrite, params(matchParamsSchema), validate(matchSchema), controller.updateMatch);
router.delete('/:id/matches/:matchId', ...canWrite, params(matchParamsSchema), controller.removeMatch);

router.get('/:id/points', ...canRead, params(idParamsSchema), controller.getPointsTable);

router.get('/:id/media', ...canRead, params(idParamsSchema), controller.listMedia);
router.post('/:id/media/photos', ...canWrite, params(idParamsSchema), galleryPhotosUpload, controller.addPhotos);
router.post('/:id/media/videos', ...canWrite, params(idParamsSchema), validate(addVideosSchema), controller.addVideos);
router.patch('/:id/media/:mediaId', ...canWrite, params(mediaParamsSchema), validate(captionSchema), controller.updateCaption);
router.delete('/:id/media/:mediaId', ...canWrite, params(mediaParamsSchema), controller.removeMedia);

module.exports = router;
