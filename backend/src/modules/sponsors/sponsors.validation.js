const Joi = require('joi');

const createSponsorSchema = Joi.object({
  sponsor_name: Joi.string().max(200).required(),
  logo_url: Joi.string().max(2000).allow('', null),
  website_url: Joi.string().max(2000).allow('', null),
  tier: Joi.string().max(30).default('STANDARD'),
  is_active: Joi.boolean().default(true),
  display_order: Joi.number().integer().min(0).default(0),
});

const updateSponsorSchema = Joi.object({
  sponsor_name: Joi.string().max(200),
  logo_url: Joi.string().max(2000).allow('', null),
  website_url: Joi.string().max(2000).allow('', null),
  tier: Joi.string().max(30),
  is_active: Joi.boolean(),
  display_order: Joi.number().integer().min(0),
}).min(1);

module.exports = { createSponsorSchema, updateSponsorSchema };
