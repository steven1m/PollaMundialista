const express = require('express');
const pool = require('../db/pool');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await pool.query('SELECT active_phase FROM settings WHERE id = 1');
    const phase = settings.rows[0]?.active_phase || 1;
    const ptsCol = phase === 1 ? 'p1pts' : 'p2pts';

    let query = `SELECT id, name, city, cargo, nequi, status, p1pts, p2pts, is_admin, created_at
                 FROM users WHERE is_admin = FALSE`;
    const params = [];

    if (req.user.is_admin && req.query.status) {
      query += ' AND status = $1';
      params.push(req.query.status);
    } else if (!req.user.is_admin) {
      query += " AND status = 'approved'";
    }

    query += ` ORDER BY ${ptsCol} DESC, name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.patch('/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status debe ser approved o rejected' });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 AND is_admin = FALSE RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const u = result.rows[0];
    if (status === 'approved') {
      await pool.query(
        `INSERT INTO notifs (user_id, type, message) VALUES ($1, 'approved', $2)`,
        [u.id, '¡Tu inscripción fue aprobada! Ya puedes participar en la polla.']
      );

      const approvedCount = await pool.query(
        "SELECT COUNT(*) FROM users WHERE status = 'approved' AND is_admin = FALSE"
      );
      const count = parseInt(approvedCount.rows[0].count);
      const bolsaPerPhase = count * 50000;
      await pool.query(
        'UPDATE settings SET phase1_bolsa = $1, phase2_bolsa = $2 WHERE id = 1',
        [bolsaPerPhase, bolsaPerPhase]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.patch('/:id/points', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { delta } = req.body;
    if (![1, -1].includes(delta)) {
      return res.status(400).json({ error: 'Delta debe ser 1 o -1' });
    }

    const settings = await pool.query('SELECT active_phase FROM settings WHERE id = 1');
    const phase = settings.rows[0]?.active_phase || 1;
    const ptsCol = phase === 1 ? 'p1pts' : 'p2pts';

    const result = await pool.query(
      `UPDATE users SET ${ptsCol} = GREATEST(0, ${ptsCol} + $1)
       WHERE id = $2 AND is_admin = FALSE RETURNING *`,
      [delta, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al ajustar puntos' });
  }
});

module.exports = router;
