const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorizeRoles } = require('../../middleware/authorize');
const { ROLES } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { activityImageUpload } = require('../../middleware/upload');
const authorizeKind = require('./authorizeKind');
const eventsRepository = require('./events.repository');
const {
  publicListQuerySchema,
  manageListQuerySchema,
  createEventSchema,
  updateEventSchema,
} = require('./events.validation');
const eventsController = require('./events.controller');

const router = Router();

const kindFromQuery = (req) => req.query.kind;
const kindFromBody = (req) => req.body.kind;
const kindFromRecord = (req) => eventsRepository.findKindById(req.params.id);

router.get('/', validate(publicListQuerySchema, 'query'), eventsController.listPublic);
router.get('/slug/:slug', eventsController.getBySlug);
router.get(
  '/manage',
  authenticate,
  validate(manageListQuerySchema, 'query'),
  authorizeKind('read', kindFromQuery),
  eventsController.listManage
);
router.get('/:id/registrations', authenticate, authorizeKind('read', kindFromRecord), eventsController.listRegistrations);
router.get('/:id', authenticate, authorizeKind('read', kindFromRecord), eventsController.getById);
router.post('/', authenticate, validate(createEventSchema), authorizeKind('write', kindFromBody), eventsController.create);
router.put(
  '/:id',
  authenticate,
  authorizeKind('write', kindFromRecord),
  validate(updateEventSchema),
  eventsController.update
);
router.post(
  '/:id/image',
  authenticate,
  authorizeKind('write', kindFromRecord),
  activityImageUpload,
  eventsController.uploadImage
);
router.delete('/:id/image', authenticate, authorizeKind('write', kindFromRecord), eventsController.removeImage);
router.patch('/:id/archive', authenticate, authorizeKind('write', kindFromRecord), eventsController.archive);
router.patch('/:id/restore', authenticate, authorizeKind('write', kindFromRecord), eventsController.restore);
router.delete('/:id', authenticate, authorizeRoles(ROLES.SUPER_ADMIN), eventsController.remove);

module.exports = router;
