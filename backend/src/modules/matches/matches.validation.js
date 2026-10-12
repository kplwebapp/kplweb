const Joi = require('joi');

const createMatchSchema = Joi.object({
  season_id: Joi.number().integer().required(),
  team1_id: Joi.number().integer().required(),
  team2_id: Joi.number().integer().required(),
  venue: Joi.string().max(200).allow('', null),
  match_date: Joi.date().iso().allow(null),
  match_type: Joi.string().max(30).default('LEAGUE'),
  overs_limit: Joi.number().integer().min(1).max(50).default(20),
  status: Joi.string().valid('SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED', 'CANCELLED').default('SCHEDULED'),
  result_summary: Joi.string().allow('', null),
});

const updateMatchSchema = Joi.object({
  season_id: Joi.number().integer(),
  team1_id: Joi.number().integer(),
  team2_id: Joi.number().integer(),
  venue: Joi.string().max(200).allow('', null),
  match_date: Joi.date().iso().allow(null),
  match_type: Joi.string().max(30),
  overs_limit: Joi.number().integer().min(1).max(50),
  status: Joi.string().valid('SCHEDULED', 'LIVE', 'COMPLETED', 'ABANDONED', 'CANCELLED'),
  result_summary: Joi.string().allow('', null),
  winner_team_id: Joi.number().integer().allow(null),
}).min(1);

module.exports = { createMatchSchema, updateMatchSchema };
