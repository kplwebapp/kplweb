const pool = require('../../config/database');

const PUBLIC_KEYS = ['league_name', 'contact_email', 'current_season', 'contact_location'];

const settingsRepository = {
  findPublic: async () => {
    const { rows } = await pool.query(
      `SELECT setting_key, setting_value FROM site_settings
       WHERE setting_key = ANY($1)`,
      [PUBLIC_KEYS]
    );
    return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  },

  findAll: async () => {
    const { rows } = await pool.query(
      'SELECT setting_key, setting_value, updated_at FROM site_settings ORDER BY setting_key'
    );
    return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  },

  upsertMany: async (settings) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(settings)) {
        await client.query(
          `INSERT INTO site_settings (setting_key, setting_value)
           VALUES ($1, $2)
           ON CONFLICT (setting_key) DO UPDATE SET
             setting_value = EXCLUDED.setting_value,
             updated_at = CURRENT_TIMESTAMP`,
          [key, value]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return settingsRepository.findAll();
  },
};

module.exports = settingsRepository;
