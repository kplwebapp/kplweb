const Joi = require('joi');

const id = Joi.number().integer().positive();
const optionalInt = (min, max) => Joi.number().integer().min(min).max(max).empty('').allow(null).default(null);

const overs = Joi.number()
  .min(0)
  .max(999)
  .precision(1)
  .custom((value, helpers) =>
    Math.round((value - Math.trunc(value)) * 10) > 5 ? helpers.error('overs.balls') : value
  )
  .empty('')
  .allow(null)
  .default(null)
  .messages({ 'overs.balls': '{#label} must be in overs.balls format, e.g. 19.3 (balls 0–5)' });

const idParamsSchema = Joi.object({ id: id.required() }).unknown(true);
const teamParamsSchema = Joi.object({ id: id.required(), teamId: id.required() });
const matchParamsSchema = Joi.object({ id: id.required(), matchId: id.required() });
const mediaParamsSchema = Joi.object({ id: id.required(), mediaId: id.required() });

const addTeamsSchema = Joi.object({
  team_ids: Joi.array().items(id).min(1).max(50).required(),
});

const matchSchema = Joi.object({
  team1_id: id.required(),
  team2_id: id.required().invalid(Joi.ref('team1_id')).messages({ 'any.invalid': 'Choose two different teams' }),
  match_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .empty('')
    .allow(null)
    .default(null)
    .messages({ 'string.pattern.base': 'Match date must be in YYYY-MM-DD format' }),
  stage: Joi.string().valid('LEAGUE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL').default('LEAGUE'),
  status: Joi.string().valid('SCHEDULED', 'COMPLETED', 'NO_RESULT').default('SCHEDULED'),
  result: Joi.string().valid('TEAM1', 'TEAM2', 'TIE').empty('').allow(null).default(null),
  team1_runs: optionalInt(0, 9999),
  team1_wickets: optionalInt(0, 10),
  team1_overs: overs,
  team2_runs: optionalInt(0, 9999),
  team2_wickets: optionalInt(0, 10),
  team2_overs: overs,
  summary: Joi.string().trim().max(300).empty('').allow(null).default(null),
});

const caption = Joi.string().trim().max(300).empty('').allow(null).default(null);

const MAX_VIDEOS_PER_REQUEST = 10;

const addVideosSchema = Joi.object({
  videos: Joi.array()
    .items(Joi.object({ url: Joi.string().trim().max(500).required(), caption }))
    .min(1)
    .max(MAX_VIDEOS_PER_REQUEST)
    .required()
    .messages({ 'array.max': `Add up to ${MAX_VIDEOS_PER_REQUEST} videos at a time` }),
});
const captionSchema = Joi.object({ caption });

module.exports = {
  idParamsSchema,
  teamParamsSchema,
  matchParamsSchema,
  mediaParamsSchema,
  addTeamsSchema,
  matchSchema,
  addVideosSchema,
  captionSchema,
};
