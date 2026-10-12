const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const teamsService = require('./teams.service');

const teamsController = {
  list: asyncHandler(async (req, res) => {
    const categoryId = Number(req.query.category_id);
    const teams = await teamsService.list(Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null);
    return ApiResponse.success(res, teams);
  }),

  getById: asyncHandler(async (req, res) => {
    const team = await teamsService.getById(req.params.id);
    return ApiResponse.success(res, team);
  }),

  create: asyncHandler(async (req, res) => {
    const team = await teamsService.create(req.body);
    return ApiResponse.success(res, team, 'Created', 201);
  }),

  update: asyncHandler(async (req, res) => {
    const team = await teamsService.update(req.params.id, req.body);
    return ApiResponse.success(res, team, 'Updated');
  }),

  uploadLogo: asyncHandler(async (req, res) => {
    const team = await teamsService.setLogo(req.params.id, req.file);
    return ApiResponse.success(res, team, 'Logo uploaded');
  }),

  removeLogo: asyncHandler(async (req, res) => {
    const team = await teamsService.removeLogo(req.params.id);
    return ApiResponse.success(res, team, 'Logo removed');
  }),
};

module.exports = teamsController;
