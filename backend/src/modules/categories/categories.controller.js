const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const categoriesService = require('./categories.service');

const categoriesController = {
  listPublic: asyncHandler(async (req, res) => {
    const items = await categoriesService.listPublic(req.query.kind);
    return ApiResponse.success(res, items);
  }),

  listAll: asyncHandler(async (req, res) => {
    const items = await categoriesService.listAll(req.query.kind);
    return ApiResponse.success(res, items);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await categoriesService.create(req.body);
    return ApiResponse.success(res, item, 'Category created', 201);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await categoriesService.update(req.params.id, req.body);
    return ApiResponse.success(res, item, 'Category updated');
  }),
};

module.exports = categoriesController;
