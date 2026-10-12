const Joi = require('joi');

const listQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

module.exports = { listQuerySchema };
