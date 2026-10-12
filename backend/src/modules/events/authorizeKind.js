const ApiError = require('../../utils/ApiError');
const { authorize } = require('../../middleware/authorize');
const { KIND_PERMISSIONS } = require('./events.constants');

/**
 * Checks the read/write permission that matches the record's kind
 * (tournaments:* for tournaments, events:* for events).
 * resolveKind(req) returns the kind, or null when the record doesn't exist.
 */
const authorizeKind = (action, resolveKind) => async (req, res, next) => {
  try {
    const kind = await resolveKind(req);
    if (!kind) throw new ApiError(404, 'Not found');
    const permissions = KIND_PERMISSIONS[kind];
    if (!permissions) throw new ApiError(400, 'Invalid kind');
    return authorize(permissions[action])(req, res, next);
  } catch (err) {
    return next(err);
  }
};

module.exports = authorizeKind;
