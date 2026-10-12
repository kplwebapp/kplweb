const Joi = require('joi');
const { KINDS } = require('../events/events.constants');

const kind = Joi.string().valid(...Object.values(KINDS));

const kindQuerySchema = Joi.object({
  kind: kind.required(),
});

const createCategorySchema = Joi.object({
  kind: kind.required(),
  name: Joi.string().trim().max(100).required(),
  display_order: Joi.number().integer().min(0),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().max(100),
  display_order: Joi.number().integer().min(0),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { kindQuerySchema, createCategorySchema, updateCategorySchema };
