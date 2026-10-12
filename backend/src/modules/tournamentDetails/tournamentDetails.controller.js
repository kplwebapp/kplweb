const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./tournamentDetails.service');

const eventId = (req) => Number(req.params.id);

const tournamentDetailsController = {
  getPublicDetails: asyncHandler(async (req, res) => {
    const details = await service.getPublicDetails(req.params.slug);
    return ApiResponse.success(res, details);
  }),

  listTeams: asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await service.listTeams(eventId(req)));
  }),

  addTeams: asyncHandler(async (req, res) => {
    const teams = await service.addTeams(eventId(req), req.body.team_ids);
    return ApiResponse.success(res, teams, 'Teams added');
  }),

  removeTeam: asyncHandler(async (req, res) => {
    await service.removeTeam(eventId(req), Number(req.params.teamId));
    return ApiResponse.success(res, null, 'Team removed');
  }),

  listMatches: asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await service.listMatches(eventId(req)));
  }),

  createMatch: asyncHandler(async (req, res) => {
    const match = await service.createMatch(eventId(req), req.body);
    return ApiResponse.success(res, match, 'Created', 201);
  }),

  updateMatch: asyncHandler(async (req, res) => {
    const match = await service.updateMatch(eventId(req), Number(req.params.matchId), req.body);
    return ApiResponse.success(res, match, 'Updated');
  }),

  removeMatch: asyncHandler(async (req, res) => {
    await service.removeMatch(eventId(req), Number(req.params.matchId));
    return ApiResponse.success(res, null, 'Deleted');
  }),

  getPointsTable: asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await service.getPointsTable(eventId(req)));
  }),

  listMedia: asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await service.listMedia(eventId(req)));
  }),

  addPhotos: asyncHandler(async (req, res) => {
    const photos = await service.addPhotos(eventId(req), req.files, req.body.caption);
    return ApiResponse.success(res, photos, 'Photos uploaded', 201);
  }),

  addVideos: asyncHandler(async (req, res) => {
    const videos = await service.addVideos(eventId(req), req.body.videos);
    return ApiResponse.success(res, videos, videos.length === 1 ? 'Video added' : 'Videos added', 201);
  }),

  updateCaption: asyncHandler(async (req, res) => {
    const item = await service.updateCaption(eventId(req), Number(req.params.mediaId), req.body.caption);
    return ApiResponse.success(res, item, 'Updated');
  }),

  removeMedia: asyncHandler(async (req, res) => {
    await service.removeMedia(eventId(req), Number(req.params.mediaId));
    return ApiResponse.success(res, null, 'Deleted');
  }),
};

module.exports = tournamentDetailsController;
