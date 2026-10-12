const Joi = require('joi');
const { PERSONA_FIELD_DEFS } = require('../profile/profile.persona.constants');

const optionsOf = (key) => PERSONA_FIELD_DEFS.cricketer.find((f) => f.key === key).options;
const choice = (key, label) =>
  Joi.string().trim().valid(...optionsOf(key)).required().label(label)
    .messages({ 'any.only': `Choose a valid ${label.toLowerCase()}`, 'any.required': `${label} is required` });

const slugParamsSchema = Joi.object({ slug: Joi.string().trim().max(200).required() });

const cricketRegistrationSchema = Joi.object({
  batting_style: choice('batting_style', 'Batting style'),
  bowling_style: choice('bowling_style', 'Bowling style'),
  is_wicketkeeper: choice('is_wicketkeeper', 'Wicketkeeper'),
  tshirt_size: choice('tshirt_size', 'T-shirt size'),
  trouser_size: choice('trouser_size', 'Trouser size'),
  tshirt_number: Joi.number().integer().min(0).max(999).required().label('T-shirt number')
    .messages({ 'any.required': 'T-shirt number is required' }),
});

module.exports = { slugParamsSchema, cricketRegistrationSchema };
