const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const asyncHandler = require('../../utils/asyncHandler');
const auctionsService = require('./auctions.service');

const auctionsController = {
  getBySeason: asyncHandler(async (req, res) => {
    const seasonId = Number(req.query.seasonId);
    if (!seasonId) {
      throw new ApiError(400, 'seasonId is required');
    }
    const data = await auctionsService.getBySeason(seasonId);
    if (!data) {
      return ApiResponse.success(res, null, 'No auction for this season');
    }
    return ApiResponse.success(res, data);
  }),
};

module.exports = auctionsController;
