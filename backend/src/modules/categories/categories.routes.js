const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const authorizeKind = require('../events/authorizeKind');
const categoriesRepository = require('./categories.repository');
const { kindQuerySchema, createCategorySchema, updateCategorySchema } = require('./categories.validation');
const categoriesController = require('./categories.controller');

const router = Router();

const kindFromQuery = (req) => req.query.kind;
const kindFromBody = (req) => req.body.kind;
const kindFromRecord = async (req) => (await categoriesRepository.findById(req.params.id))?.kind;

router.get('/', validate(kindQuerySchema, 'query'), categoriesController.listPublic);
router.get(
  '/manage',
  authenticate,
  validate(kindQuerySchema, 'query'),
  authorizeKind('read', kindFromQuery),
  categoriesController.listAll
);
router.post(
  '/',
  authenticate,
  validate(createCategorySchema),
  authorizeKind('write', kindFromBody),
  categoriesController.create
);
router.put(
  '/:id',
  authenticate,
  authorizeKind('write', kindFromRecord),
  validate(updateCategorySchema),
  categoriesController.update
);

module.exports = router;
