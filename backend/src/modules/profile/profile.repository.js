const pool = require('../../config/database');

const PROFILE_FIELDS = `
  u.user_id,
  u.first_name,
  u.middle_name,
  u.last_name,
  u.full_name,
  u.email,
  u.mobile,
  u.dob,
  u.vibhaag,
  u.blood_group,
  u.profile_photo,
  u.is_active,
  u.created_at,
  u.updated_at,
  COALESCE(json_agg(DISTINCT r.role_code) FILTER (WHERE r.role_code IS NOT NULL), '[]') AS roles
`;

const findByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT ${PROFILE_FIELDS}
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.user_id
     LEFT JOIN roles r ON r.role_id = ur.role_id
     WHERE u.user_id = $1
     GROUP BY u.user_id`,
    [userId]
  );
  return rows[0] || null;
};

const updateProfile = async (userId, fields) => {
  const {
    firstName,
    middleName,
    lastName,
    mobile,
    dob,
    vibhaag,
    bloodGroup,
    fullName,
  } = fields;

  const { rows } = await pool.query(
    `UPDATE users
     SET first_name = COALESCE($2, first_name),
         middle_name = COALESCE($3, middle_name),
         last_name = COALESCE($4, last_name),
         full_name = COALESCE($5, full_name),
         mobile = COALESCE($6, mobile),
         dob = COALESCE($7, dob),
         vibhaag = COALESCE($8, vibhaag),
         blood_group = COALESCE($9, blood_group),
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING user_id, first_name, middle_name, last_name, full_name, email, mobile, dob, vibhaag, blood_group, profile_photo`,
    [userId, firstName, middleName, lastName, fullName, mobile, dob, vibhaag, bloodGroup]
  );
  return rows[0] || null;
};

const updateProfilePhoto = async (userId, photoPath) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET profile_photo = $2, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1
     RETURNING profile_photo`,
    [userId, photoPath]
  );
  return rows[0] || null;
};

module.exports = { findByUserId, updateProfile, updateProfilePhoto };
