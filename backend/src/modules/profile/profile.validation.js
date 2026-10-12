const Joi = require('joi');
const { VIBHAAG_OPTIONS } = require('./profile.constants');
const { PERSONA_TYPES } = require('./profile.persona.constants');

const vibhaagChangeRequestSchema = Joi.object({
  vibhaag: Joi.string().valid(...VIBHAAG_OPTIONS).required(),
});

const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^\d+$/).optional(),
  emailOtp: Joi.string().length(6).pattern(/^\d+$/).optional(),
  mobileOtp: Joi.string().length(6).pattern(/^\d+$/).optional(),
  vibhaag: Joi.string().valid(...VIBHAAG_OPTIONS).required(),
}).or('otp', 'emailOtp');

const changeRequestListQuerySchema = Joi.object({
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
});

const createPersonaSchema = Joi.object({
  persona_type: Joi.string().valid(...PERSONA_TYPES).required(),
  answers: Joi.object().default({}),
});

const updatePersonaSchema = Joi.object({
  answers: Joi.object().required(),
});

module.exports = {
  vibhaagChangeRequestSchema,
  verifyOtpSchema,
  changeRequestListQuerySchema,
  createPersonaSchema,
  updatePersonaSchema,
};
