const Joi = require('joi');
const { ADMIN_PANEL_AREAS } = require('@kpl/shared');

const areaKeys = ADMIN_PANEL_AREAS.map((area) => area.key);

const createRoleSchema = Joi.object({
  roleName: Joi.string().trim().min(2).max(100).required(),
  roleCode: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z][A-Z0-9_]{1,48}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Role code must start with a letter and use only A–Z, 0–9, and underscores',
    }),
  description: Joi.string().trim().max(500).allow('', null),
  areas: Joi.array()
    .items(Joi.string().valid(...areaKeys))
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'Select at least one admin panel area',
    }),
});

const updateRoleSchema = Joi.object({
  roleName: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow('', null),
  areas: Joi.array()
    .items(Joi.string().valid(...areaKeys))
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'Select at least one admin panel area',
    }),
});

module.exports = { createRoleSchema, updateRoleSchema };
