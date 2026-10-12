const Joi = require('joi');

const pointsRowSchema = Joi.object({
  points_table_id: Joi.number().integer().optional(),
  team_id: Joi.number().integer().required(),
  matches_played: Joi.number().integer().min(0).required(),
  matches_won: Joi.number().integer().min(0).required(),
  matches_lost: Joi.number().integer().min(0).required(),
  matches_tied: Joi.number().integer().min(0).default(0),
  matches_nr: Joi.number().integer().min(0).default(0),
  points: Joi.number().integer().min(0).required(),
  net_run_rate: Joi.number().required(),
});

const bulkUpdatePointsTableSchema = Joi.object({
  seasonId: Joi.number().integer().required(),
  rows: Joi.array().items(pointsRowSchema).min(1).required(),
});

module.exports = { bulkUpdatePointsTableSchema };
