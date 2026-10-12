const Joi = require('joi');

const aboutContentSchema = Joi.object({
  title: Joi.string().max(200).required(),
  introduction: Joi.string().required(),
  mission: Joi.string().required(),
  vision: Joi.string().required(),
  community: Joi.string().required(),
});

module.exports = { aboutContentSchema };
