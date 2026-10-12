const ApiError = require('../../utils/ApiError');
const slugify = require('../../utils/slugify');
const { toPublicPath, removeUploadedFile } = require('../../utils/uploadFiles');
const eventsRepository = require('./events.repository');
const categoriesRepository = require('../categories/categories.repository');
const tournamentDetailsRepository = require('../tournamentDetails/tournamentDetails.repository');

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const uniqueSlug = async (source, excludeId = null) => {
  const base = slugify(source, 'event');
  let slug = base;
  let suffix = 2;
  while (await eventsRepository.slugExists(slug, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

const checkDateRange = (start, end) => {
  if (!end) return;
  if (!start) throw new ApiError(400, 'An end date requires a start date');
  if (end < start) throw new ApiError(400, 'End date cannot be before the start date');
};

const checkCategory = async (categoryId, kind) => {
  const category = await categoriesRepository.findById(categoryId);
  if (!category || category.kind !== kind) {
    throw new ApiError(400, 'Category does not exist for this type');
  }
};

const notFound = () => new ApiError(404, 'Not found');

const eventsService = {
  listPublic: (kind, includePast = false) => eventsRepository.findPublic(kind, includePast),
  listManage: (filters) => eventsRepository.findManage(filters),

  getById: async (id) => {
    const item = await eventsRepository.findById(id);
    if (!item) throw notFound();
    return item;
  },

  getPublicBySlug: async (slug) => {
    const item = await eventsRepository.findPublicBySlug(slug);
    if (!item) throw notFound();
    return item;
  },

  create: async (data) => {
    const changes = { ...data };
    if (changes.end_date && changes.end_date === changes.event_date) changes.end_date = null;
    checkDateRange(changes.event_date, changes.end_date);
    await checkCategory(changes.category_id, changes.kind);
    const slug = await uniqueSlug(changes.slug || changes.title);
    return eventsRepository.create({ ...changes, slug });
  },

  update: async (id, data) => {
    const existing = await eventsRepository.findById(id);
    if (!existing) throw notFound();
    const changes = { ...data };

    if (has(changes, 'event_date') || has(changes, 'end_date')) {
      const start = has(changes, 'event_date') ? changes.event_date || null : existing.event_date;
      const end = has(changes, 'end_date') ? changes.end_date || null : existing.end_date;
      if (end && end === start) changes.end_date = null;
      else checkDateRange(start, end);
    }
    if (changes.category_id) await checkCategory(changes.category_id, existing.kind);
    if (changes.slug) changes.slug = await uniqueSlug(changes.slug, id);

    return eventsRepository.update(id, changes);
  },

  setArchived: async (id, archived) => {
    const item = await eventsRepository.setArchived(id, archived);
    if (!item) throw notFound();
    return item;
  },

  setImage: async (id, file) => {
    if (!file) throw new ApiError(400, 'Choose an image file to upload.');
    const newPath = toPublicPath(file.filename);
    const previous = await eventsRepository.findImageById(id);
    if (!previous) {
      await removeUploadedFile(newPath);
      throw notFound();
    }
    const item = await eventsRepository.setImage(id, newPath);
    await removeUploadedFile(previous.image_url);
    return item;
  },

  removeImage: async (id) => {
    const previous = await eventsRepository.findImageById(id);
    if (!previous) throw notFound();
    const item = await eventsRepository.setImage(id, null);
    await removeUploadedFile(previous.image_url);
    return item;
  },

  remove: async (id) => {
    const previous = await eventsRepository.findImageById(id);
    const galleryPhotos = await tournamentDetailsRepository.findPhotoUrls(id);
    const deleted = await eventsRepository.remove(id);
    if (!deleted) throw notFound();
    await Promise.all([previous?.image_url, ...galleryPhotos].map((p) => removeUploadedFile(p)));
  },

  listRegistrations: async (id) => {
    const item = await eventsRepository.findById(id);
    if (!item) throw notFound();
    const players = await eventsRepository.findRegistrations(id);
    return { tournament: item, players };
  },
};

module.exports = eventsService;
