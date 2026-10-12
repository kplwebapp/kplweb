const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { aboutContentSchema } = require('./pages.validation');
const pagesController = require('./pages.controller');

const router = Router();

router.put('/about', authenticate, authorize(PERMISSIONS.SETTINGS_WRITE), validate(aboutContentSchema), pagesController.updateAbout);
router.get('/:slug', pagesController.getBySlug);

module.exports = router;
