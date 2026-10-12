const ApiError = require('../../utils/ApiError');
const pagesRepository = require('./pages.repository');

const pagesService = {
  getBySlug: async (slug) => {
    const page = await pagesRepository.findBySlug(slug);
    if (!page) throw new ApiError(404, 'Page not found');
    return page;
  },
  upsert: (slug, content) => pagesRepository.upsert(slug, content),
};

module.exports = pagesService;
