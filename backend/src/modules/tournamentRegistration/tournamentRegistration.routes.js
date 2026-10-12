const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { slugParamsSchema, cricketRegistrationSchema } = require('./tournamentRegistration.validation');
const controller = require('./tournamentRegistration.controller');

/** Mounted under /events: a signed-in member registering themselves for a cricket tournament. */
const router = Router();

router.get('/slug/:slug/registration', authenticate, validate(slugParamsSchema, 'params'), controller.getForm);
router.put(
  '/slug/:slug/registration',
  authenticate,
  validate(slugParamsSchema, 'params'),
  validate(cricketRegistrationSchema),
  controller.register
);

module.exports = router;
