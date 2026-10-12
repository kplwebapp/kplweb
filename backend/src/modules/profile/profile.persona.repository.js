const pool = require('../../config/database');

const profilePersonaRepository = {
  findByUserId(userId) {
    return pool.query(
      `SELECT persona_profile_id, user_id, persona_type, answers, created_at, updated_at
       FROM member_persona_profiles
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );
  },

  findByIdForUser(personaProfileId, userId) {
    return pool.query(
      `SELECT persona_profile_id, user_id, persona_type, answers, created_at, updated_at
       FROM member_persona_profiles
       WHERE persona_profile_id = $1 AND user_id = $2`,
      [personaProfileId, userId]
    );
  },

  findByUserAndType(userId, personaType) {
    return pool.query(
      `SELECT persona_profile_id
       FROM member_persona_profiles
       WHERE user_id = $1 AND persona_type = $2
       LIMIT 1`,
      [userId, personaType]
    );
  },

  create(userId, personaType, answers) {
    return pool.query(
      `INSERT INTO member_persona_profiles (user_id, persona_type, answers)
       VALUES ($1, $2, $3)
       RETURNING persona_profile_id, user_id, persona_type, answers, created_at, updated_at`,
      [userId, personaType, answers]
    );
  },

  update(personaProfileId, userId, answers) {
    return pool.query(
      `UPDATE member_persona_profiles
       SET answers = $3, updated_at = CURRENT_TIMESTAMP
       WHERE persona_profile_id = $1 AND user_id = $2
       RETURNING persona_profile_id, user_id, persona_type, answers, created_at, updated_at`,
      [personaProfileId, userId, answers]
    );
  },

  delete(personaProfileId, userId) {
    return pool.query(
      `DELETE FROM member_persona_profiles
       WHERE persona_profile_id = $1 AND user_id = $2
       RETURNING persona_profile_id`,
      [personaProfileId, userId]
    );
  },
};

module.exports = profilePersonaRepository;
