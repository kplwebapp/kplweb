const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ApiResponse.success(
    res,
    result,
    'Registration submitted. Your account is pending administrator approval.',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, 'Login successful');
});

const refresh = asyncHandler(async (req, res) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  return ApiResponse.success(res, tokens, 'Token refreshed');
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  return ApiResponse.success(res, user);
});

module.exports = { register, login, refresh, me };
