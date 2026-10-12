const pool = require('../../config/database');

const findByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

const findById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT user_id, first_name, last_name, full_name, email, is_active, created_at
     FROM users WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const createUser = async ({
  firstName,
  middleName,
  lastName,
  fullName,
  email,
  passwordHash,
  mobile,
  dob,
  vibhaag,
  bloodGroup,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, middle_name, last_name, full_name, email, password_hash, mobile, dob, vibhaag, blood_group, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
     RETURNING user_id, first_name, middle_name, last_name, full_name, email, mobile, dob, vibhaag, blood_group, is_active, created_at`,
    [firstName, middleName || null, lastName, fullName, email, passwordHash, mobile || null, dob || null, vibhaag || null, bloodGroup || null]
  );
  return rows[0];
};

const createPlayer = async (userId) => {
  await pool.query(
    `INSERT INTO players (user_id, registration_status)
     VALUES ($1, 'PENDING')
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
};

const assignRole = async (userId, roleCode) => {
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT $1, role_id FROM roles WHERE role_code = $2
     ON CONFLICT DO NOTHING`,
    [userId, roleCode]
  );
};

module.exports = { findByEmail, findById, createUser, createPlayer, assignRole };
