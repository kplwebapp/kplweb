const Joi = require('joi');

const recordBallSchema = Joi.object({
  inningsId: Joi.number().integer().required(),
  overNumber: Joi.number().integer().min(0).required(),
  ballNumber: Joi.number().integer().min(1).max(6).required(),
  batsmanId: Joi.number().integer().required(),
  bowlerId: Joi.number().integer().required(),
  runs: Joi.number().integer().min(0).max(6).default(0),
  extras: Joi.number().integer().min(0).default(0),
  wicketType: Joi.string().allow(null, ''),
  wicketPlayerId: Joi.number().integer().allow(null),
  isLegalDelivery: Joi.boolean().default(true),
});

const updateScoresSchema = Joi.object({
  innings: Joi.array().items(
    Joi.object({
      innings_id: Joi.number().integer().optional(),
      innings_number: Joi.number().integer().valid(1, 2).required(),
      batting_team_id: Joi.number().integer().required(),
      bowling_team_id: Joi.number().integer().required(),
      total_runs: Joi.number().integer().min(0).required(),
      total_wickets: Joi.number().integer().min(0).max(10).required(),
      total_overs: Joi.number().min(0).max(50).required(),
      status: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED').default('IN_PROGRESS'),
    })
  ).min(1).max(2).required(),
  matchStatus: Joi.string().valid('SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED', 'CANCELLED'),
});

module.exports = { recordBallSchema, updateScoresSchema };
