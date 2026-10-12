const Joi = require('joi');

const createGallerySchema = Joi.object({
  title: Joi.string().max(200).allow('', null),
  image_url: Joi.string().max(2000).required(),
  caption: Joi.string().allow('', null),
  category: Joi.string().max(50).default('GENERAL'),
});

const updateGallerySchema = Joi.object({
  title: Joi.string().max(200).allow('', null),
  image_url: Joi.string().max(2000),
  caption: Joi.string().allow('', null),
  category: Joi.string().max(50),
}).min(1);

module.exports = { createGallerySchema, updateGallerySchema };
