const Joi = require('joi');

const points = Joi.number().integer().min(0).max(1000000000);
const id = Joi.number().integer().positive();

const settings = {
  title: Joi.string().trim().max(200),
  description: Joi.string().trim().max(5000).allow('', null),
  rules: Joi.string().trim().max(5000).allow('', null),
  auction_date: Joi.date().iso().allow(null),
  venue: Joi.string().trim().max(200).allow('', null),
  season_id: id,
  event_id: id.allow(null),
  budget_per_team: points,
  max_players_per_team: Joi.number().integer().min(1).max(50),
  min_players_per_team: Joi.number().integer().min(0).max(50),
  min_bid_increment: Joi.number().integer().min(1).max(1000000000),
  default_base_price: points,
};

const category = Joi.object({
  auction_category_id: id,
  name: Joi.string().trim().min(1).max(50).required(),
  base_price: points.allow(null),
  min_per_team: Joi.number().integer().min(0).max(50).default(0),
  max_per_team: Joi.number().integer().min(0).max(50).allow(null).min(Joi.ref('min_per_team')),
});

const createAuctionSchema = Joi.object({
  ...settings,
  title: settings.title.required(),
  season_id: settings.season_id.required(),
  budget_per_team: settings.budget_per_team.required(),
  max_players_per_team: settings.max_players_per_team.required(),
  min_bid_increment: settings.min_bid_increment.required(),
  categories: Joi.array().items(category).max(20).default([]),
});

const updateAuctionSchema = Joi.object(settings).min(1);

const categoriesSchema = Joi.object({ categories: Joi.array().items(category).max(20).required() });

const teamsSchema = Joi.object({
  teams: Joi.array()
    .items(Joi.object({
      team_id: id.required(),
      budget: points.required(),
      max_players: Joi.number().integer().min(1).max(50).required(),
    }))
    .max(50)
    .required(),
});

const addPlayersSchema = Joi.object({
  user_ids: Joi.array().items(id).min(1).max(500).required(),
  auction_category_id: id.allow(null),
});

const updateLotSchema = Joi.object({
  auction_category_id: id.allow(null),
  base_price: points,
  is_eligible: Joi.boolean(),
  eligibility_note: Joi.string().trim().max(300).allow('', null),
}).min(1);

const reorderSchema = Joi.object({ lot_ids: Joi.array().items(id).min(1).max(1000).required() });

const reasonSchema = Joi.object({ reason: Joi.string().trim().min(3).max(500).required() });
const optionalReasonSchema = Joi.object({ reason: Joi.string().trim().max(500).allow('', null) });

const lotRefSchema = Joi.object({ lot_id: id.required() });
const lotRefWithReasonSchema = lotRefSchema.keys({ reason: Joi.string().trim().min(3).max(500).required() });
const nextPlayerSchema = Joi.object({ lot_id: id.allow(null) });

const bidSchema = Joi.object({
  lot_id: id.required(),
  team_id: id.required(),
  amount: points.required(),
});

module.exports = {
  createAuctionSchema,
  updateAuctionSchema,
  categoriesSchema,
  teamsSchema,
  addPlayersSchema,
  updateLotSchema,
  reorderSchema,
  reasonSchema,
  optionalReasonSchema,
  lotRefSchema,
  lotRefWithReasonSchema,
  nextPlayerSchema,
  bidSchema,
};
