const ApiError = require('../../utils/ApiError');
const profileService = require('./profile.service');
const changeService = require('./profile.change.service');
const personaService = require('./profile.persona.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  return ApiResponse.success(res, profile);
});

const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No photo file uploaded');
  }
  const result = await profileService.updateProfilePhoto(req.user.id, req.file.filename);
  return ApiResponse.success(res, result, 'Profile photo updated successfully');
});

const initiateVibhaagChange = asyncHandler(async (req, res) => {
  const result = await changeService.initiateVibhaagChange(req.user.id, req.body.vibhaag);
  return ApiResponse.success(res, result, result.message);
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await changeService.verifyOtpAndSubmit(req.user.id, req.body);
  return ApiResponse.success(res, result, 'Your changes have been sent for review');
});

const getPendingChanges = asyncHandler(async (req, res) => {
  const requests = await changeService.getPendingChanges(req.user.id);
  return ApiResponse.success(res, requests);
});

const listChangeRequests = asyncHandler(async (req, res) => {
  const requests = await changeService.listChangeRequests(req.query);
  return ApiResponse.success(res, requests);
});

const approveChangeRequest = asyncHandler(async (req, res) => {
  const result = await changeService.approveChangeRequest(req.params.id, req.user.id);
  return ApiResponse.success(res, result, 'Change request approved');
});

const rejectChangeRequest = asyncHandler(async (req, res) => {
  const result = await changeService.rejectChangeRequest(req.params.id, req.user.id);
  return ApiResponse.success(res, result, 'Change request rejected');
});

const getPersonaDefinitions = asyncHandler(async (_req, res) => {
  const definitions = personaService.getDefinitions();
  return ApiResponse.success(res, definitions);
});

const listPersonaProfiles = asyncHandler(async (req, res) => {
  const profiles = await personaService.listForUser(req.user.id);
  return ApiResponse.success(res, profiles);
});

const createPersonaProfile = asyncHandler(async (req, res) => {
  const profile = await personaService.createForUser(req.user.id, req.body);
  return ApiResponse.success(res, profile, 'Profile details saved');
});

const updatePersonaProfile = asyncHandler(async (req, res) => {
  const profile = await personaService.updateForUser(req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, profile, 'Profile details updated');
});

const deletePersonaProfile = asyncHandler(async (req, res) => {
  await personaService.deleteForUser(req.user.id, req.params.id);
  return ApiResponse.success(res, null, 'Profile details removed');
});

module.exports = {
  getProfile,
  uploadPhoto,
  initiateVibhaagChange,
  verifyOtp,
  getPendingChanges,
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
  getPersonaDefinitions,
  listPersonaProfiles,
  createPersonaProfile,
  updatePersonaProfile,
  deletePersonaProfile,
};
