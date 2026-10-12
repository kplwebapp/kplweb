const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const galleryService = require('./gallery.service');

const galleryController = {
  listPublic: asyncHandler(async (_req, res) => {
    const items = await galleryService.listPublic();
    return ApiResponse.success(res, items);
  }),

  listAll: asyncHandler(async (_req, res) => {
    const items = await galleryService.listAll();
    return ApiResponse.success(res, items);
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await galleryService.getById(req.params.id);
    return ApiResponse.success(res, item);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await galleryService.create(req.body, req.user?.id);
    return ApiResponse.success(res, item, 'Gallery item created', 201);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await galleryService.update(req.params.id, req.body);
    return ApiResponse.success(res, item, 'Gallery item updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await galleryService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Gallery item deleted');
  }),
};

module.exports = galleryController;
