const Joi = require('joi');

const updateSettingsSchema = Joi.object({
  league_name: Joi.string().max(200),
  contact_email: Joi.string().email(),
  current_season: Joi.string().max(100),
  public_website_url: Joi.string().max(500).allow(''),
  contact_location: Joi.string().max(200),
}).min(1);

module.exports = { updateSettingsSchema };
