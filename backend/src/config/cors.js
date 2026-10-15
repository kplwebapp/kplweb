const env = require('./env');

module.exports = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  // Lets the admin panel read the file name of downloaded reports.
  exposedHeaders: ['Content-Disposition'],
};
