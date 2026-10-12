const pool = require('../../config/database');

const contactRepository = {
  create: async (data) => {
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (name, email, mobile, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING contact_message_id, name, email, subject, status, submitted_at`,
      [data.name, data.email, data.mobile || null, data.subject, data.message]
    );
    return rows[0];
  },

  findAll: async () => {
    const { rows } = await pool.query(
      `SELECT contact_message_id, name, email, mobile, subject, message, status, submitted_at
       FROM contact_messages
       ORDER BY submitted_at DESC`
    );
    return rows;
  },

  updateStatus: async (id, status) => {
    const { rows } = await pool.query(
      `UPDATE contact_messages SET status = $2 WHERE contact_message_id = $1 RETURNING *`,
      [id, status]
    );
    return rows[0] || null;
  },
};

module.exports = contactRepository;
