const Joi = require('joi');
const {
  AUCTION_PLAYER_CATEGORIES,
  DEFAULT_POINTS_PER_TEAM,
  DEFAULT_MAX_PLAYERS_PER_TEAM,
  normalizeCategory,
} = require('./auction.constants');

const categorySchema = Joi.string()
  .valid(...AUCTION_PLAYER_CATEGORIES)
  .custom((value, helpers) => {
    const normalized = normalizeCategory(value);
    if (!normalized) return helpers.error('any.invalid');
    return normalized;
  });

const upsertAuctionSchema = Joi.object({
  season_id: Joi.number().integer().required(),
  title: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  auction_date: Joi.date().iso().allow(null),
  venue: Joi.string().max(200).allow('', null),
  status: Joi.string().valid('UPCOMING', 'LIVE', 'COMPLETED'),
  budget_per_team: Joi.number().integer().min(0).default(DEFAULT_POINTS_PER_TEAM),
  max_players_per_team: Joi.number().integer().min(1).max(25).default(DEFAULT_MAX_PLAYERS_PER_TEAM),
});

const createLotSchema = Joi.object({
  season_id: Joi.number().integer().required(),
  lot_number: Joi.number().integer().min(1).required(),
  player_name: Joi.string().max(200).required(),
  player_role: categorySchema.required(),
  vibhaag: Joi.string().max(100).allow('', null),
  base_price: Joi.number().integer().min(0),
  status: Joi.string().valid('PENDING', 'SOLD', 'UNSOLD'),
});

const updateLotSchema = Joi.object({
  lot_number: Joi.number().integer().min(1),
  player_name: Joi.string().max(200),
  player_role: categorySchema,
  vibhaag: Joi.string().max(100).allow('', null),
  base_price: Joi.number().integer().min(0),
  sold_price: Joi.number().integer().min(0).allow(null),
  team_id: Joi.number().integer().allow(null),
  status: Joi.string().valid('PENDING', 'SOLD', 'UNSOLD'),
});

module.exports = { upsertAuctionSchema, createLotSchema, updateLotSchema };
