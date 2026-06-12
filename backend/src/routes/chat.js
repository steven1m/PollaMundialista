const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const since = req.query.since;
    let query = `SELECT c.*, u.name AS user_name FROM chat c
                 JOIN users u ON u.id = c.user_id
                 WHERE u.is_admin = FALSE`;
    const params = [];
    if (since) {
      query += ' AND c.created_at > $1';
      params.push(since);
    }
    query += ' ORDER BY c.created_at ASC LIMIT 200';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener chat' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.is_admin) {
      return res.status(403).json({ error: 'El administrador no puede escribir en el chat' });
    }

    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    const result = await pool.query(
      `INSERT INTO chat (user_id, message) VALUES ($1, $2) RETURNING *`,
      [req.user.id, message.trim().slice(0, 500)]
    );

    const withName = await pool.query(
      `SELECT c.*, u.name AS user_name FROM chat c
       JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [result.rows[0].id]
    );

    const msg = withName.rows[0];
    if (req.app.locals.broadcastChat) {
      req.app.locals.broadcastChat(msg);
    }

    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

module.exports = router;
