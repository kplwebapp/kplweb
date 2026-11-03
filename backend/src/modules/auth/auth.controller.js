const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const sessionMeta = (req, clientType) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ipFromForwarded =
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : Array.isArray(forwarded) ? forwarded[0] : null;
  return {
    clientType,
    ipAddress: ipFromForwarded || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent') || null,
  };
};

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
  const result = await authService.login(req.body, sessionMeta(req, 'web'));
  return ApiResponse.success(res, result, 'Login successful');
});

const adminLogin = asyncHandler(async (req, res) => {
  const result = await authService.adminLogin(req.body, sessionMeta(req, 'admin'));
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

const listSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.listSessions(req.user.id, req.user.sessionId);
  return ApiResponse.success(res, sessions);
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user.sessionId);
  return ApiResponse.success(res, result, 'Logged out');
});

const revokeSession = asyncHandler(async (req, res) => {
  const result = await authService.revokeSession(req.user.id, req.params.sessionId);
  return ApiResponse.success(res, result, 'Session revoked');
});

const logoutAll = asyncHandler(async (req, res) => {
  const keepCurrent = req.body?.keepCurrent !== false;
  const result = await authService.logoutAll(req.user.id, req.user.sessionId, { keepCurrent });
  return ApiResponse.success(res, result, 'Other sessions revoked');
});

const requestMobileOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestMobileOtp(req.body);
  return ApiResponse.success(res, result, result.message || 'OTP sent');
});

const verifyMobileOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyMobileOtp(req.body, sessionMeta(req, 'mobile'));
  return ApiResponse.success(res, result, 'Login successful');
});

module.exports = {
  register,
  login,
  adminLogin,
  refresh,
  me,
  listSessions,
  logout,
  revokeSession,
  logoutAll,
  requestMobileOtp,
  verifyMobileOtp,
};
