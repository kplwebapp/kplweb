const pool = require('../../config/database');

const CRICKETER = 'cricketer';

const tournamentRegistrationRepository = {
  findRegistration: async (eventId, userId) => {
    const { rows } = await pool.query(
      `SELECT registration_id, status, registered_at
       FROM tournament_registrations
       WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    return rows[0] || null;
  },

  findCricketSkills: async (userId) => {
    const { rows } = await pool.query(
      `SELECT answers FROM member_persona_profiles
       WHERE user_id = $1 AND persona_type = $2
       ORDER BY persona_profile_id
       LIMIT 1`,
      [userId, CRICKETER]
    );
    return rows[0]?.answers || null;
  },

  /** Saves the member's cricket skills and registers them for the tournament in one transaction. */
  register: async (eventId, userId, skills) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `UPDATE member_persona_profiles
         SET answers = $3, updated_at = CURRENT_TIMESTAMP
         WHERE persona_profile_id = (
           SELECT persona_profile_id FROM member_persona_profiles
           WHERE user_id = $1 AND persona_type = $2
           ORDER BY persona_profile_id LIMIT 1
         )`,
        [userId, CRICKETER, skills]
      );
      if (updated.rowCount === 0) {
        await client.query(
          `INSERT INTO member_persona_profiles (user_id, persona_type, answers) VALUES ($1, $2, $3)`,
          [userId, CRICKETER, skills]
        );
      }
      const { rows } = await client.query(
        `INSERT INTO tournament_registrations (event_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (event_id, user_id) DO UPDATE SET status = tournament_registrations.status
         RETURNING registration_id, status, registered_at, (xmax = 0) AS created`,
        [eventId, userId]
      );
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = tournamentRegistrationRepository;
