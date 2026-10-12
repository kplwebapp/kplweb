const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const pagesService = require('./pages.service');

const pagesController = {
  getBySlug: asyncHandler(async (req, res) => {
    const page = await pagesService.getBySlug(req.params.slug);
    return ApiResponse.success(res, page);
  }),

  updateAbout: asyncHandler(async (req, res) => {
    const page = await pagesService.upsert('about', req.body);
    return ApiResponse.success(res, page, 'About page updated');
  }),
};

module.exports = pagesController;
