const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const matchesService = require('./matches.service');

const matchesController = {
  list: asyncHandler(async (req, res) => {
    const { rows, total } = await matchesService.list({
      seasonId: req.query.seasonId ? Number(req.query.seasonId) : undefined,
      status: req.query.status,
      limit: Number(req.query.limit) || 100,
      offset: Number(req.query.offset) || 0,
    });
    return ApiResponse.paginated(res, rows, {
      total,
      limit: Number(req.query.limit) || 100,
      offset: Number(req.query.offset) || 0,
    });
  }),

  getById: asyncHandler(async (req, res) => {
    const item = await matchesService.getById(req.params.id);
    return ApiResponse.success(res, item);
  }),

  create: asyncHandler(async (req, res) => {
    const item = await matchesService.create(req.body);
    return ApiResponse.success(res, item, 'Match created', 201);
  }),

  update: asyncHandler(async (req, res) => {
    const item = await matchesService.update(req.params.id, req.body);
    return ApiResponse.success(res, item, 'Match updated');
  }),
};

module.exports = matchesController;
