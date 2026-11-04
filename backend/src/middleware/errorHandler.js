const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { renderErrorPage, wantsHtml } = require('../utils/errorPageHtml');

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

const sendError = (req, res, { statusCode, message, errors = null, code }) => {
  const status = statusCode || 500;
  const payload = {
    success: false,
    code: code || STATUS_CODES[status] || `HTTP_${status}`,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };

  if (wantsHtml(req)) {
    res.status(status).type('html').send(
      renderErrorPage({ statusCode: status, message, code: payload.code })
    );
    return;
  }

  res.status(status).json(payload);
};

const errorHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    return sendError(req, res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      code: STATUS_CODES[err.statusCode],
    });
  }

  if (err.name === 'ValidationError') {
    return sendError(req, res, {
      statusCode: 400,
      message: 'Validation failed',
      errors: err.details?.map((d) => ({ field: d.path.join('.'), message: d.message })),
      code: 'VALIDATION_FAILED',
    });
  }

  if (err.name === 'MulterError') {
    return sendError(req, res, {
      statusCode: 400,
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message,
      code: 'UPLOAD_ERROR',
    });
  }

  if (err.code === '23505') {
    return sendError(req, res, {
      statusCode: 409,
      message: 'Duplicate entry',
      code: 'DUPLICATE',
    });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  return sendError(req, res, {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
  });
};

module.exports = errorHandler;
