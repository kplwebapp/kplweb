const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./tournamentRegistration.service');

const tournamentRegistrationController = {
  getForm: asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await service.getForm(req.params.slug, req.user.id));
  }),

  register: asyncHandler(async (req, res) => {
    const result = await service.register(req.params.slug, req.user.id, req.body);
    const message = result.created ? 'You are registered for this tournament' : 'Your registration details were updated';
    return ApiResponse.success(res, result, message, result.created ? 201 : 200);
  }),
};

module.exports = tournamentRegistrationController;
