const { Router } = require('express');
const { authenticate } = require('../../middleware/auth');
const { authorize } = require('../../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');
const validate = require('../../middleware/validate');
const { createGallerySchema, updateGallerySchema } = require('./gallery.validation');
const galleryController = require('./gallery.controller');

const router = Router();

router.get('/', galleryController.listPublic);
router.get('/manage', authenticate, authorize(PERMISSIONS.GALLERY_READ), galleryController.listAll);
router.get('/:id', authenticate, authorize(PERMISSIONS.GALLERY_READ), galleryController.getById);
router.post('/', authenticate, authorize(PERMISSIONS.GALLERY_WRITE), validate(createGallerySchema), galleryController.create);
router.put('/:id', authenticate, authorize(PERMISSIONS.GALLERY_WRITE), validate(updateGallerySchema), galleryController.update);
router.delete('/:id', authenticate, authorize(PERMISSIONS.GALLERY_WRITE), galleryController.remove);

module.exports = router;
