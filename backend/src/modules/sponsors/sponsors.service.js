const ApiError = require('../../utils/ApiError');
const sponsorsRepository = require('./sponsors.repository');

const sponsorsService = {
  listPublic: () => sponsorsRepository.findPublic(),
  listAll: () => sponsorsRepository.findAll(),
  getById: async (id) => {
    const item = await sponsorsRepository.findById(id);
    if (!item) throw new ApiError(404, 'Sponsor not found');
    return item;
  },
  create: (data) => sponsorsRepository.create(data),
  update: async (id, data) => {
    const item = await sponsorsRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Sponsor not found');
    return item;
  },
  remove: async (id) => {
    const deleted = await sponsorsRepository.remove(id);
    if (!deleted) throw new ApiError(404, 'Sponsor not found');
  },
};

module.exports = sponsorsService;
