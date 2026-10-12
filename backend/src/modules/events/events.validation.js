const Joi = require('joi');
const { KINDS, STATUSES } = require('./events.constants');

const kind = Joi.string().valid(...Object.values(KINDS));

const isoDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .allow('', null)
  .messages({ 'string.pattern.base': '{#label} must be in YYYY-MM-DD format' });

const publicListQuerySchema = Joi.object({
  kind: kind.default(KINDS.EVENT),
  include_past: Joi.boolean().default(false),
});

const manageListQuerySchema = Joi.object({
  kind: kind.required(),
  category_id: Joi.number().integer().positive(),
  status: Joi.string().valid(...STATUSES),
  archived: Joi.boolean().default(false),
});

const createEventSchema = Joi.object({
  kind: kind.required(),
  category_id: Joi.number().integer().positive().required(),
  title: Joi.string().trim().max(200).required(),
  slug: Joi.string().trim().max(200).allow('', null),
  description: Joi.string().max(10000).allow('', null),
  event_date: isoDate,
  end_date: isoDate,
  venue: Joi.string().max(200).allow('', null),
});

const updateEventSchema = Joi.object({
  category_id: Joi.number().integer().positive(),
  title: Joi.string().trim().max(200),
  slug: Joi.string().trim().max(200).allow('', null),
  description: Joi.string().max(10000).allow('', null),
  event_date: isoDate,
  end_date: isoDate,
  venue: Joi.string().max(200).allow('', null),
}).min(1);

module.exports = { publicListQuerySchema, manageListQuerySchema, createEventSchema, updateEventSchema };
