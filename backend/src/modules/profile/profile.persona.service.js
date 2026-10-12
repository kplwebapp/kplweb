const ApiError = require('../../utils/ApiError');
const {
  PERSONA_TYPES,
  PERSONA_LABELS,
  PERSONA_FIELD_DEFS,
  sanitizeAnswers,
} = require('./profile.persona.constants');
const profilePersonaRepository = require('./profile.persona.repository');

function formatPersona(row) {
  return {
    persona_profile_id: row.persona_profile_id,
    persona_type: row.persona_type,
    persona_label: PERSONA_LABELS[row.persona_type] || row.persona_type,
    answers: row.answers || {},
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const profilePersonaService = {
  getDefinitions() {
    return {
      types: PERSONA_TYPES.map((type) => ({
        type,
        label: PERSONA_LABELS[type],
        fields: PERSONA_FIELD_DEFS[type],
      })),
    };
  },

  async listForUser(userId) {
    const result = await profilePersonaRepository.findByUserId(userId);
    return result.rows.map(formatPersona);
  },

  async createForUser(userId, body) {
    const personaType = body.persona_type;
    if (!PERSONA_TYPES.includes(personaType)) {
      throw new ApiError(400, 'Invalid persona type.');
    }

    const answers = sanitizeAnswers(personaType, body.answers);

    const existing = await profilePersonaRepository.findByUserAndType(userId, personaType);
    if (existing.rows.length > 0) {
      throw new ApiError(400, 'You already have a profile for this role.');
    }

    const result = await profilePersonaRepository.create(userId, personaType, answers);
    return formatPersona(result.rows[0]);
  },

  async updateForUser(userId, personaProfileId, body) {
    const existing = await profilePersonaRepository.findByIdForUser(personaProfileId, userId);
    if (existing.rows.length === 0) {
      throw new ApiError(404, 'Persona profile not found.');
    }

    const personaType = existing.rows[0].persona_type;
    const answers = sanitizeAnswers(personaType, body.answers);
    const result = await profilePersonaRepository.update(personaProfileId, userId, answers);
    return formatPersona(result.rows[0]);
  },

  async deleteForUser(userId, personaProfileId) {
    const result = await profilePersonaRepository.delete(personaProfileId, userId);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Persona profile not found.');
    }
  },
};

module.exports = profilePersonaService;
