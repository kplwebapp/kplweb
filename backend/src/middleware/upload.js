const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../..', env.upload.dir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const createFileFilter = (allowedExtensions, allowedMimeTypes, errorMessage) => (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = allowedMimeTypes.has(file.mimetype);
  const extOk = allowedExtensions.has(ext);
  if (!mimeOk || !extOk) {
    return cb(new ApiError(400, errorMessage));
  }
  return cb(null, true);
};

const generalFileFilter = createFileFilter(
  new Set(['.jpeg', '.jpg', '.png', '.gif', '.webp', '.pdf']),
  new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']),
  'Invalid file type'
);

const profilePhotoFileFilter = createFileFilter(
  new Set(['.jpg', '.jpeg', '.png']),
  new Set(['image/jpeg', 'image/png']),
  'Only JPG, JPEG, and PNG image files are allowed.'
);

const uploadLimits = { fileSize: env.upload.maxFileSizeMb * 1024 * 1024 };

const upload = multer({
  storage,
  fileFilter: generalFileFilter,
  limits: uploadLimits,
});

const profilePhotoUpload = multer({
  storage,
  fileFilter: profilePhotoFileFilter,
  limits: uploadLimits,
});

const ACTIVITY_IMAGE_MAX_MB = 2;
const GALLERY_MAX_PHOTOS = 20;

const activityImageFilter = createFileFilter(
  new Set(['.jpg', '.jpeg', '.png', '.gif']),
  new Set(['image/jpeg', 'image/png', 'image/gif']),
  'Only JPG, PNG and GIF images are allowed.'
);

const activityImageMulter = (maxFiles) =>
  multer({
    storage,
    fileFilter: activityImageFilter,
    limits: { fileSize: ACTIVITY_IMAGE_MAX_MB * 1024 * 1024, files: maxFiles },
  });

const withImageErrors = (middleware, maxFiles) => (req, res, next) =>
  middleware(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, `${maxFiles === 1 ? 'Image' : 'Each image'} must be ${ACTIVITY_IMAGE_MAX_MB} MB or smaller.`));
    }
    if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ApiError(400, maxFiles === 1 ? 'Upload one image at a time.' : `Upload up to ${maxFiles} photos at a time.`));
    }
    return next(err);
  });

/** Single "image" field (tournament/event images, team logos): JPG/PNG/GIF, max 2 MB. */
const activityImageUpload = withImageErrors(activityImageMulter(1).single('image'), 1);

/** Multiple "images" fields for tournament gallery photos: JPG/PNG/GIF, max 2 MB each. */
const galleryPhotosUpload = withImageErrors(
  activityImageMulter(GALLERY_MAX_PHOTOS).array('images', GALLERY_MAX_PHOTOS),
  GALLERY_MAX_PHOTOS
);

module.exports = upload;
module.exports.profilePhotoUpload = profilePhotoUpload;
module.exports.activityImageUpload = activityImageUpload;
module.exports.galleryPhotosUpload = galleryPhotosUpload;
