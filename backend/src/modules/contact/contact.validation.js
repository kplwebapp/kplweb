const Joi = require('joi');

const submitContactSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  mobile: Joi.string().max(15).allow('', null),
  subject: Joi.string().max(200).required(),
  message: Joi.string().required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('NEW', 'READ', 'ARCHIVED').required(),
});

module.exports = { submitContactSchema, updateStatusSchema };
