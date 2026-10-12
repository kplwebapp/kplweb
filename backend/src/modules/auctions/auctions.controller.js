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

  upsertAuction: asyncHandler(async (req, res) => {
    const auction = await auctionsService.upsertAuction(req.body);
    return ApiResponse.success(res, auction, 'Auction saved');
  }),

  createLot: asyncHandler(async (req, res) => {
    const lot = await auctionsService.createLot(req.body);
    return ApiResponse.success(res, lot, 'Lot added', 201);
  }),

  updateLot: asyncHandler(async (req, res) => {
    const lot = await auctionsService.updateLot(Number(req.params.lotId), req.body);
    return ApiResponse.success(res, lot, 'Lot updated');
  }),

  deleteLot: asyncHandler(async (req, res) => {
    await auctionsService.deleteLot(Number(req.params.lotId));
    return ApiResponse.success(res, null, 'Lot deleted');
  }),
};

module.exports = auctionsController;
