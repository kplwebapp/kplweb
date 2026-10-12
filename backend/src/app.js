const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const corsOptions = require('./config/cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');
const ApiError = require('./utils/ApiError');

const app = express();

// Serve uploads before helmet — otherwise Cross-Origin-Resource-Policy: same-origin blocks
// the frontend (different port) from embedding profile photos.
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.resolve(__dirname, '../..', env.upload.dir))
);

app.use(...securityMiddleware);
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({ name: 'Kansara Premier League API', version: '1.0.0', docs: '/api/health' });
});

app.use(env.apiPrefix, apiRoutes);

app.use((_req, _res, next) => {
  next(new ApiError(404, 'Route not found'));
});

app.use(errorHandler);

module.exports = app;
