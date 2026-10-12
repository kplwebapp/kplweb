const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { createSponsorSchema, updateSponsorSchema } = require('./sponsors.validation');
const sponsorsController = require('./sponsors.controller');

const router = Router();

router.get('/', sponsorsController.listPublic);
router.get('/manage', authenticate, authorize(PERMISSIONS.SPONSORS_READ), sponsorsController.listAll);
router.get('/:id', authenticate, authorize(PERMISSIONS.SPONSORS_READ), sponsorsController.getById);
router.post('/', authenticate, authorize(PERMISSIONS.SPONSORS_WRITE), validate(createSponsorSchema), sponsorsController.create);
router.put('/:id', authenticate, authorize(PERMISSIONS.SPONSORS_WRITE), validate(updateSponsorSchema), sponsorsController.update);
router.delete('/:id', authenticate, authorize(PERMISSIONS.SPONSORS_WRITE), sponsorsController.remove);

module.exports = router;
