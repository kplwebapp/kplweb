const ApiError = require('../../utils/ApiError');
const profileRepository = require('./profile.repository');

const formatProfile = (row) => {
  if (!row) return null;
  return {
    user_id: row.user_id,
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    full_name: row.full_name,
    email: row.email,
    mobile: row.mobile,
    date_of_birth: row.dob,
    vibhaag: row.vibhaag,
    blood_group: row.blood_group,
    profile_photo_url: row.profile_photo || null,
    roles: row.roles || [],
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const getProfile = async (userId) => {
  const row = await profileRepository.findByUserId(userId);
  if (!row) throw new ApiError(404, 'Profile not found');
  return formatProfile(row);
};

const updateProfilePhoto = async (userId, filename) => {
  const photoPath = `/uploads/${filename}`;
  const result = await profileRepository.updateProfilePhoto(userId, photoPath);
  if (!result) throw new ApiError(404, 'Profile not found');
  return { profile_photo_url: photoPath };
};

module.exports = { getProfile, updateProfilePhoto, formatProfile };
