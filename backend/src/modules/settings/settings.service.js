const settingsRepository = require('./settings.repository');

const settingsService = {
  getPublic: () => settingsRepository.findPublic(),
  getAll: () => settingsRepository.findAll(),
  update: (settings) => settingsRepository.upsertMany(settings),
};

module.exports = settingsService;
