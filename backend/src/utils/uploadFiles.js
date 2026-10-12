const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');
const logger = require('./logger');

const uploadDir = path.resolve(__dirname, '../../..', env.upload.dir);

const toPublicPath = (filename) => `/uploads/${filename}`;

/** Deletes a file previously stored under /uploads; ignores external URLs and missing files. */
const removeUploadedFile = async (publicPath) => {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const filename = path.basename(publicPath);
  try {
    await fs.unlink(path.join(uploadDir, filename));
  } catch (err) {
    if (err.code !== 'ENOENT') logger.error('Failed to delete uploaded file', { file: filename, error: err.message });
  }
};

module.exports = { toPublicPath, removeUploadedFile };
