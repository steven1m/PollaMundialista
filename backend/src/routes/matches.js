const express = require('express');
const pool = require('../db/pool');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { applyMatchResult } = require('../services/scoring');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await pool.query('SELECT active_phase, unlocked_rounds FROM settings WHERE id = 1');
    const { active_phase, unlocked_rounds } = settings.rows[0] || { active_phase: 1, unlocked_rounds: ['group'] };

    let query = 'SELECT * FROM matches WHERE phase = $1';
    const params = [req.query.phase || active_phase];

    if (req.query.status) {
      query += ' AND status = $2';
      params.push(req.query.status);
    }

    query += ' ORDER BY match_order ASC, match_date ASC';

    const result = await pool.query(query, params);

    const matches = result.rows.map((m) => {
      const isKnockout = m.stage === 'Eliminatorias';
      const roundKey = m.round.toLowerCase().replace(/\s+/g, '_');
      const groupKey = 'group';
      let locked = m.status === 'locked';
      if (isKnockout && locked) {
        const unlocked = unlocked_rounds.some(
          (r) => r === roundKey || r === m.round || (r === 'group' && false)
        );
        if (unlocked) locked = false;
      }
      return {
        ...m,
        effectively_locked: locked && m.status !== 'played',
        can_predict: m.status === 'upcoming' || (isKnockout && !locked && m.status !== 'played'),
      };
    });

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener partidos' });
  }
});

router.post('/:id/result', authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { home_score, away_score } = req.body;
    if (home_score == null || away_score == null) {
      return res.status(400).json({ error: 'Marcador requerido' });
    }

    await client.query('BEGIN');
    const match = await applyMatchResult(client, req.params.id, home_score, away_score);
    await client.query('COMMIT');

    const users = await pool.query("SELECT id FROM users WHERE status = 'approved' AND is_admin = FALSE");
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifs (user_id, type, message) VALUES ($1, 'result', $2)`,
        [
          u.id,
          `Resultado registrado: ${match.home_team} ${home_score}-${away_score} ${match.away_team}`,
        ]
      );
    }

    const updated = await pool.query('SELECT * FROM matches WHERE id = $1', [req.params.id]);
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Error al registrar resultado' });
  } finally {
    client.release();
  }
});

router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['upcoming', 'locked', 'played'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const result = await pool.query(
      'UPDATE matches SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.patch('/:id/teams', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { home_team, away_team } = req.body;
    const result = await pool.query(
      `UPDATE matches SET home_team = COALESCE($1, home_team), away_team = COALESCE($2, away_team),
       status = CASE WHEN status = 'locked' THEN 'upcoming' ELSE status END
       WHERE id = $3 RETURNING *`,
      [home_team, away_team, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar equipos' });
  }
});

module.exports = router;
