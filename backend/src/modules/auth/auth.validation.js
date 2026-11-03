const Joi = require('joi');
const { VIBHAAG_OPTIONS, BLOOD_GROUP_OPTIONS } = require('../profile/profile.constants');

const emailField = Joi.string().email({ tlds: { allow: false } }).required();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(200),
  firstName: Joi.string().trim().min(1).max(50).required(),
  middleName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: emailField,
  password: Joi.string().min(8).max(128).required(),
  mobile: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).required(),
  dob: Joi.alternatives().try(Joi.date().iso(), Joi.string().allow('')),
  dateOfBirth: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required(),
  vibhaag: Joi.string().valid(...VIBHAAG_OPTIONS).required(),
  bloodGroup: Joi.string().valid(...BLOOD_GROUP_OPTIONS).required(),
});

const loginSchema = Joi.object({
  email: emailField,
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const logoutAllSchema = Joi.object({
  keepCurrent: Joi.boolean().default(true),
}).default({ keepCurrent: true });

const mobileOtpRequestSchema = Joi.object({
  mobile: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).required(),
});

const mobileOtpVerifySchema = Joi.object({
  mobile: Joi.string().pattern(/^[0-9+\-\s()]{7,15}$/).required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutAllSchema,
  mobileOtpRequestSchema,
  mobileOtpVerifySchema,
};
