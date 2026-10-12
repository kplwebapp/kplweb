const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const sponsorsService = require('./sponsors.service');

const sponsorsController = {
  listPublic: asyncHandler(async (_req, res) => {
    const items = await sponsorsService.listPublic();
    return ApiResponse.success(res, items);
  }),

  listAll: asyncHandler(async (_req, res) => {
    const items = await sponsorsService.listAll();
    return ApiResponse.success(res, items);
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await sponsorsService.getById(req.params.id);
    return ApiResponse.success(res, item);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await sponsorsService.create(req.body);
    return ApiResponse.success(res, item, 'Sponsor created', 201);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await sponsorsService.update(req.params.id, req.body);
    return ApiResponse.success(res, item, 'Sponsor updated');
  }),

  remove: asyncHandler(async (req, res) => {
    await sponsorsService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Sponsor deleted');
  }),
};

module.exports = sponsorsController;
