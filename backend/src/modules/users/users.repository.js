const pool = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { createCrudModule } = require('../../utils/createCrudModule');

const base = createCrudModule({
  table: 'users',
  idColumn: 'user_id',
  resourceName: 'User',
  selectColumns: 'user_id, first_name, last_name, full_name, email, is_active, created_at',
});

const repository = {
  ...base.repository,
  setMemberStatus: async (userId, { isActive, registrationStatus }) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `UPDATE users
         SET is_active = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING user_id, first_name, last_name, full_name, email, is_active, created_at`,
        [userId, isActive]
      );
      if (!rows.length) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query(
        `INSERT INTO players (user_id, registration_status)
         VALUES ($1, $2)
         ON CONFLICT (user_id)
         DO UPDATE SET registration_status = $2, updated_at = CURRENT_TIMESTAMP`,
        [userId, registrationStatus]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

const service = {
  ...base.service,
  approve: async (id) => {
    const user = await repository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.is_active) throw new ApiError(400, 'User is already approved');
    const updated = await repository.setMemberStatus(id, {
      isActive: true,
      registrationStatus: 'APPROVED',
    });
    return updated;
  },
  reject: async (id) => {
    const user = await repository.findById(id);
    if (!user) throw new ApiError(404, 'User not found');
    const updated = await repository.setMemberStatus(id, {
      isActive: false,
      registrationStatus: 'REJECTED',
    });
    return updated;
  },
};

const controller = {
  ...base.controller,
  approve: asyncHandler(async (req, res) => {
    const user = await service.approve(req.params.id);
    return ApiResponse.success(res, user, 'Member approved');
  }),
  reject: asyncHandler(async (req, res) => {
    const user = await service.reject(req.params.id);
    return ApiResponse.success(res, user, 'Member rejected');
  }),
};

module.exports = { repository, service, controller };
