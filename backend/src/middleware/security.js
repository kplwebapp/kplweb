const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const LIVE_AUCTION_READ = /\/auctions\/(public|\d+\/(public|stream))$/;

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
    // Live auction screens poll and hold streams for hours; those reads are cached and cheap.
    skip: (req) => req.method === 'GET' && LIVE_AUCTION_READ.test(req.path),
  }),
];

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts' },
});

module.exports = { securityMiddleware, authRateLimit };
