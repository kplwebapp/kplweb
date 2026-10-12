const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const eventsService = require('./events.service');
const { KINDS } = require('./events.constants');

// Express 5 exposes req.query as a getter, so Joi defaults/conversions may not be written back.
const queryFlag = (value) => value === true || value === 'true';

const eventsController = {
  listPublic: asyncHandler(async (req, res) => {
    const items = await eventsService.listPublic(req.query.kind || KINDS.EVENT, queryFlag(req.query.include_past));
    return ApiResponse.success(res, items);
  }),

  listManage: asyncHandler(async (req, res) => {
    const { kind, category_id: categoryId, status, archived } = req.query;
    const items = await eventsService.listManage({
      kind,
      categoryId: categoryId ? Number(categoryId) : null,
      status: status || null,
      archived: queryFlag(archived),
    });
    return ApiResponse.success(res, items);
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const item = await eventsService.getPublicBySlug(req.params.slug);
    return ApiResponse.success(res, item);
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await eventsService.getById(req.params.id);
    return ApiResponse.success(res, item);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await eventsService.create(req.body);
    return ApiResponse.success(res, item, 'Created', 201);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await eventsService.update(req.params.id, req.body);
    return ApiResponse.success(res, item, 'Updated');
  }),

  uploadImage: asyncHandler(async (req, res) => {
    const item = await eventsService.setImage(req.params.id, req.file);
    return ApiResponse.success(res, item, 'Image uploaded');
  }),

  removeImage: asyncHandler(async (req, res) => {
    const item = await eventsService.removeImage(req.params.id);
    return ApiResponse.success(res, item, 'Image removed');
  }),

  archive: asyncHandler(async (req, res) => {
    const item = await eventsService.setArchived(req.params.id, true);
    return ApiResponse.success(res, item, 'Archived');
  }),

  restore: asyncHandler(async (req, res) => {
    const item = await eventsService.setArchived(req.params.id, false);
    return ApiResponse.success(res, item, 'Restored');
  }),

  remove: asyncHandler(async (req, res) => {
    await eventsService.remove(req.params.id);
    return ApiResponse.success(res, null, 'Deleted');
  }),

  listRegistrations: asyncHandler(async (req, res) => {
    const result = await eventsService.listRegistrations(req.params.id);
    return ApiResponse.success(res, result);
  }),
};

module.exports = eventsController;
