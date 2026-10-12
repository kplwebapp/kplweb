const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { profilePhotoUpload } = require('../../middleware/upload');
const { PERMISSIONS } = require('@kpl/shared');
const {
  vibhaagChangeRequestSchema,
  verifyOtpSchema,
  changeRequestListQuerySchema,
  createPersonaSchema,
  updatePersonaSchema,
} = require('./profile.validation');
const profileController = require('./profile.controller');

const router = Router();

router.get('/', authenticate, profileController.getProfile);
router.post('/photo', authenticate, profilePhotoUpload.single('photo'), profileController.uploadPhoto);

router.post(
  '/change-request/vibhaag',
  authenticate,
  validate(vibhaagChangeRequestSchema),
  profileController.initiateVibhaagChange
);
router.post('/verify-otp', authenticate, validate(verifyOtpSchema), profileController.verifyOtp);
router.get('/pending-changes', authenticate, profileController.getPendingChanges);

router.get('/personas/definitions', authenticate, profileController.getPersonaDefinitions);
router.get('/personas', authenticate, profileController.listPersonaProfiles);
router.post('/personas', authenticate, validate(createPersonaSchema), profileController.createPersonaProfile);
router.patch('/personas/:id', authenticate, validate(updatePersonaSchema), profileController.updatePersonaProfile);
router.delete('/personas/:id', authenticate, profileController.deletePersonaProfile);

router.get(
  '/change-requests',
  authenticate,
  authorize(PERMISSIONS.USERS_READ),
  validate(changeRequestListQuerySchema, 'query'),
  profileController.listChangeRequests
);
router.patch(
  '/change-requests/:id/approve',
  authenticate,
  authorize(PERMISSIONS.USERS_WRITE),
  profileController.approveChangeRequest
);
router.patch(
  '/change-requests/:id/reject',
  authenticate,
  authorize(PERMISSIONS.USERS_WRITE),
  profileController.rejectChangeRequest
);

module.exports = router;
