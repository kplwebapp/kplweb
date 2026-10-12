const ApiError = require('../../utils/ApiError');
const galleryRepository = require('./gallery.repository');

const galleryService = {
  listPublic: () => galleryRepository.findPublic(),
  listAll: () => galleryRepository.findAll(),
  getById: async (id) => {
    const item = await galleryRepository.findById(id);
    if (!item) throw new ApiError(404, 'Gallery item not found');
    return item;
  },
  create: (data, userId) => galleryRepository.create(data, userId),
  update: async (id, data) => {
    const item = await galleryRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Gallery item not found');
    return item;
  },
  remove: async (id) => {
    const deleted = await galleryRepository.remove(id);
    if (!deleted) throw new ApiError(404, 'Gallery item not found');
  },
};

module.exports = galleryService;
