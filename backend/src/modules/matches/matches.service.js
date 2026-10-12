const ApiError = require('../../utils/ApiError');
const matchesRepository = require('./matches.repository');

const matchesService = {
  list: (query) => matchesRepository.findAll(query),

  getById: async (id) => {
    const item = await matchesRepository.findById(id);
    if (!item) throw new ApiError(404, 'Match not found');
    return item;
  },

  create: async (data) => {
    if (data.team1_id === data.team2_id) {
      throw new ApiError(400, 'Teams must be different');
    }
    return matchesRepository.create(data);
  },

  update: async (id, data) => {
    if (data.team1_id != null && data.team2_id != null && data.team1_id === data.team2_id) {
      throw new ApiError(400, 'Teams must be different');
    }
    const item = await matchesRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Match not found');
    return item;
  },
};

module.exports = matchesService;
