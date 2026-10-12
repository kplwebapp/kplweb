const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const settingsService = require('./settings.service');

const settingsController = {
  getPublic: asyncHandler(async (_req, res) => {
    const settings = await settingsService.getPublic();
    return ApiResponse.success(res, settings);
  }),

  getAll: asyncHandler(async (_req, res) => {
    const settings = await settingsService.getAll();
    return ApiResponse.success(res, settings);
  }),

  update: asyncHandler(async (req, res) => {
    const settings = await settingsService.update(req.body);
    return ApiResponse.success(res, settings, 'Settings updated');
  }),
};

module.exports = settingsController;
