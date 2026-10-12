const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityMiddleware = [
  helmet({
    // Allow /uploads images to be embedded by the frontend on another origin.
    crossOriginResourcePolicy: false,
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests' },
  }),
];

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts' },
});

module.exports = { securityMiddleware, authRateLimit };
