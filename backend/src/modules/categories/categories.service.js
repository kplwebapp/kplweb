const ApiError = require('../../utils/ApiError');
const slugify = require('../../utils/slugify');
const categoriesRepository = require('./categories.repository');

const categoriesService = {
  listPublic: (kind) => categoriesRepository.findByKind(kind, { activeOnly: true }),
  listAll: (kind) => categoriesRepository.findByKind(kind, { activeOnly: false }),

  getById: async (id) => {
    const item = await categoriesRepository.findById(id);
    if (!item) throw new ApiError(404, 'Category not found');
    return item;
  },

  create: async ({ kind, name, display_order }) => {
    const base = slugify(name, 'category');
    let slug = base;
    let suffix = 2;
    while (await categoriesRepository.slugExists(kind, slug)) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }
    const order = display_order ?? (await categoriesRepository.nextDisplayOrder(kind));
    return categoriesRepository.create({ kind, name, slug, display_order: order });
  },

  update: async (id, data) => {
    const item = await categoriesRepository.update(id, data);
    if (!item) throw new ApiError(404, 'Category not found');
    return item;
  },
};

module.exports = categoriesService;
