const app = require('./app');
const env = require('./config/env');
const pool = require('./config/database');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const uploadDir = path.resolve(__dirname, '../..', env.upload.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const server = app.listen(env.port, async () => {
  try {
    await pool.query('SELECT 1');
    logger.info(`KPL API running on port ${env.port}`, { env: env.nodeEnv });
  } catch (err) {
    logger.error('Database connection failed on startup', { error: err.message });
  }
});

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
