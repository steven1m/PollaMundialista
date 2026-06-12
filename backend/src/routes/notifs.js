const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT * FROM notifs WHERE ';
    const params = [];

    if (req.user.is_admin) {
      query += 'user_id IS NULL';
    } else {
      query += 'user_id = $1';
      params.push(req.user.id);
    }

    if (req.query.unread === 'true') {
      query += ' AND read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    let query = 'SELECT COUNT(*) FROM notifs WHERE read = FALSE AND ';
    const params = [];

    if (req.user.is_admin) {
      query += 'user_id IS NULL';
    } else {
      query += 'user_id = $1';
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    if (req.user.is_admin) {
      await pool.query('UPDATE notifs SET read = TRUE WHERE user_id IS NULL');
    } else {
      await pool.query('UPDATE notifs SET read = TRUE WHERE user_id = $1', [req.user.id]);
    }
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
});

module.exports = router;
