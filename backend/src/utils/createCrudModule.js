/**
 * Module boilerplate factory — each feature module follows controller/service/routes/validation/repository pattern.
 */
const pool = require('../config/database');
const ApiError = require('./ApiError');
const ApiResponse = require('./ApiResponse');
const asyncHandler = require('./asyncHandler');

const createCrudModule = ({ table, idColumn, resourceName, selectColumns = '*' }) => {
  const repository = {
    findAll: async (limit = 50, offset = 0) => {
      const { rows } = await pool.query(
        `SELECT ${selectColumns} FROM ${table} ORDER BY ${idColumn} DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      const count = await pool.query(`SELECT COUNT(*)::int AS total FROM ${table}`);
      return { rows, total: count.rows[0].total };
    },
    findById: async (id) => {
      const { rows } = await pool.query(
        `SELECT ${selectColumns} FROM ${table} WHERE ${idColumn} = $1`,
        [id]
      );
      return rows[0] || null;
    },
  };

  const service = {
    list: async (query) => repository.findAll(query.limit || 50, query.offset || 0),
    getById: async (id) => {
      const item = await repository.findById(id);
      if (!item) throw new ApiError(404, `${resourceName} not found`);
      return item;
    },
  };

  const controller = {
    list: asyncHandler(async (req, res) => {
      const { rows, total } = await service.list(req.query);
      return ApiResponse.paginated(res, rows, {
        total,
        limit: Number(req.query.limit) || 50,
        offset: Number(req.query.offset) || 0,
      });
    }),
    getById: asyncHandler(async (req, res) => {
      const item = await service.getById(req.params.id);
      return ApiResponse.success(res, item);
    }),
  };

  return { repository, service, controller };
};

module.exports = { createCrudModule };
