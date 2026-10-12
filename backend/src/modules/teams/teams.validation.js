const Joi = require('joi');

const teamCode = Joi.string().trim().uppercase().max(10).allow('', null);
const shortName = Joi.string().trim().max(50).allow('', null);
const categoryId = Joi.number().integer().positive();

const createTeamSchema = Joi.object({
  team_name: Joi.string().trim().max(100).required(),
  team_code: teamCode,
  short_name: shortName,
  category_id: categoryId.required().messages({ 'any.required': 'Choose the game this team plays' }),
});

const updateTeamSchema = Joi.object({
  team_name: Joi.string().trim().max(100),
  team_code: teamCode,
  short_name: shortName,
  category_id: categoryId,
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createTeamSchema, updateTeamSchema };
