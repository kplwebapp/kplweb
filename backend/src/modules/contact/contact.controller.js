const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const contactService = require('./contact.service');

const contactController = {
  submit: asyncHandler(async (req, res) => {
    const message = await contactService.submit(req.body);
    return ApiResponse.success(res, message, 'Message received', 201);
  }),

  listAll: asyncHandler(async (_req, res) => {
    const messages = await contactService.listAll();
    return ApiResponse.success(res, messages);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const message = await contactService.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, message, 'Status updated');
  }),
};

module.exports = contactController;
