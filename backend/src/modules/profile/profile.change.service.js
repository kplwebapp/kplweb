const crypto = require('crypto');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const profileRepository = require('./profile.repository');
const changeRepository = require('./profile.change.repository');
const { VIBHAAG_OPTIONS } = require('./profile.constants');

const generateOtp = () => String(crypto.randomInt(100000, 999999));

const formatChangeRequest = (row) => {
  if (!row) return null;
  return {
    request_id: row.request_id,
    user_id: row.user_id,
    field_name: row.field_name,
    old_value: row.old_value,
    new_value: row.new_value,
    status: row.status,
    otp_verified_at: row.otp_verified_at,
    created_at: row.created_at,
    reviewed_at: row.reviewed_at,
    reviewed_by: row.reviewed_by,
    user: row.first_name != null ? {
      first_name: row.first_name,
      last_name: row.last_name,
      full_name: row.full_name,
      email: row.email,
      mobile: row.mobile,
    } : undefined,
  };
};

const initiateVibhaagChange = async (userId, newVibhaag) => {
  if (!VIBHAAG_OPTIONS.includes(newVibhaag)) {
    throw new ApiError(400, 'Invalid vibhaag value');
  }

  const profile = await profileRepository.findByUserId(userId);
  if (!profile) throw new ApiError(404, 'Profile not found');

  const currentVibhaag = profile.vibhaag || '';
  if (currentVibhaag === newVibhaag) {
    throw new ApiError(400, 'New vibhaag must be different from current value');
  }

  const pending = await changeRepository.findPendingVibhaagByUser(userId);
  if (pending) {
    throw new ApiError(409, 'You already have a pending vibhaag change request');
  }

  if (!profile.email) {
    throw new ApiError(400, 'Registered email is required for verification');
  }
  if (!profile.mobile) {
    throw new ApiError(400, 'Registered mobile number is required for verification');
  }

  const otp = generateOtp();
  const verification = await changeRepository.createOtpVerification(userId, otp, otp);

  logger.info('[DEV] Profile change OTP generated', {
    userId,
    email: profile.email,
    mobile: profile.mobile,
    emailOtp: otp,
    mobileOtp: otp,
    expiresAt: verification.expires_at,
  });
  console.log('\n========== KPL PROFILE CHANGE OTP (DEV) ==========');
  console.log(`User: ${profile.full_name || profile.email} (ID ${userId})`);
  console.log(`Email OTP sent to ${profile.email}: ${otp}`);
  console.log(`SMS OTP sent to ${profile.mobile}: ${otp}`);
  console.log(`Expires at: ${verification.expires_at}`);
  console.log('==================================================\n');

  return {
    message: 'Verification codes sent to your registered email and mobile number',
    expires_at: verification.expires_at,
    pending_vibhaag: newVibhaag,
    old_vibhaag: currentVibhaag || null,
  };
};

const verifyOtpAndSubmit = async (userId, { otp, emailOtp, mobileOtp, vibhaag }) => {
  const verification = await changeRepository.findActiveOtpVerification(userId);
  if (!verification) {
    throw new ApiError(400, 'No active verification found. Please request a new code.');
  }

  const emailCode = emailOtp ?? otp;
  const mobileCode = mobileOtp ?? otp;

  if (!emailCode || !mobileCode) {
    throw new ApiError(400, 'OTP is required');
  }

  const emailMatch = verification.email_otp === String(emailCode);
  const mobileMatch = verification.mobile_otp === String(mobileCode);

  if (!emailMatch || !mobileMatch) {
    throw new ApiError(400, 'Invalid verification code(s)');
  }

  if (!VIBHAAG_OPTIONS.includes(vibhaag)) {
    throw new ApiError(400, 'Invalid vibhaag value');
  }

  const profile = await profileRepository.findByUserId(userId);
  if (!profile) throw new ApiError(404, 'Profile not found');

  const currentVibhaag = profile.vibhaag || '';
  if (currentVibhaag === vibhaag) {
    throw new ApiError(400, 'Vibhaag has not changed');
  }

  const pending = await changeRepository.findPendingVibhaagByUser(userId);
  if (pending) {
    throw new ApiError(409, 'You already have a pending vibhaag change request');
  }

  await changeRepository.markOtpVerified(verification.verification_id);

  const request = await changeRepository.createChangeRequest({
    userId,
    fieldName: 'vibhaag',
    oldValue: currentVibhaag || null,
    newValue: vibhaag,
  });

  return formatChangeRequest(request);
};

const getPendingChanges = async (userId) => {
  const rows = await changeRepository.findPendingByUser(userId);
  return rows.map(formatChangeRequest);
};

const listChangeRequests = async (query = {}) => {
  const rows = await changeRepository.listChangeRequests(query);
  return rows.map(formatChangeRequest);
};

const approveChangeRequest = async (requestId, reviewerId) => {
  const result = await changeRepository.approveChangeRequest(requestId, reviewerId);
  if (!result) throw new ApiError(404, 'Change request not found');
  if (result.error === 'NOT_PENDING') {
    throw new ApiError(400, 'Change request is not pending');
  }
  return formatChangeRequest(result);
};

const rejectChangeRequest = async (requestId, reviewerId) => {
  const result = await changeRepository.rejectChangeRequest(requestId, reviewerId);
  if (!result) throw new ApiError(404, 'Pending change request not found');
  return formatChangeRequest(result);
};

module.exports = {
  initiateVibhaagChange,
  verifyOtpAndSubmit,
  getPendingChanges,
  listChangeRequests,
  approveChangeRequest,
  rejectChangeRequest,
};
