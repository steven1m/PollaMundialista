const express = require('express');
const pool = require('../db/pool');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const settings = await pool.query('SELECT active_phase FROM settings WHERE id = 1');
    const phase = req.query.phase || settings.rows[0]?.active_phase || 1;
    const userId = req.query.user_id;

    let targetUserId = req.user.is_admin ? (userId ? parseInt(userId) : null) : req.user.id;

    const result = await pool.query(
      `SELECT p.*, m.home_team, m.away_team, m.home_score, m.away_score, m.status AS match_status,
              m.stage, m.round, m.match_date, m.phase, u.name AS user_name
       FROM predictions p
       JOIN matches m ON m.id = p.match_id
       JOIN users u ON u.id = p.user_id
       WHERE m.phase = $1 AND ($2::int IS NULL OR p.user_id = $2)
       ORDER BY m.match_order ASC`,
      [phase, targetUserId]
    );

    const preds = result.rows;
    const played = preds.filter((p) => p.match_status === 'played');
    const stats = {
      total_predictions: preds.length,
      played: played.length,
      total_points: played.reduce((s, p) => s + p.points, 0),
      exact_scores: played.filter((p) => p.points === 3).length,
      correct_results: played.filter((p) => p.points === 1).length,
      wrong: played.filter((p) => p.points === 0).length,
    };

    res.json({ predictions: preds, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener predicciones' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.is_admin) {
      return res.status(403).json({ error: 'El administrador no puede hacer predicciones' });
    }

    const { match_id, home_pred, away_pred } = req.body;
    if (match_id == null || home_pred == null || away_pred == null) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    if (home_pred < 0 || away_pred < 0 || home_pred > 20 || away_pred > 20) {
      return res.status(400).json({ error: 'Marcador inválido' });
    }

    const match = await pool.query('SELECT * FROM matches WHERE id = $1', [match_id]);
    if (match.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }
    const m = match.rows[0];

    const settings = await pool.query('SELECT active_phase, unlocked_rounds FROM settings WHERE id = 1');
    if (m.phase !== settings.rows[0].active_phase) {
      return res.status(400).json({ error: 'Este partido no pertenece a la fase activa' });
    }
    if (m.status === 'played') {
      return res.status(400).json({ error: 'El partido ya se jugó' });
    }
    if (m.status === 'locked') {
      const unlocked = settings.rows[0].unlocked_rounds.some(
        (r) => r === m.round.toLowerCase().replace(/\s+/g, '_') || r === m.round
      );
      if (!unlocked) {
        return res.status(400).json({ error: 'Esta ronda aún no está desbloqueada' });
      }
    }

    const result = await pool.query(
      `INSERT INTO predictions (user_id, match_id, home_pred, away_pred)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, match_id) DO UPDATE SET home_pred = $3, away_pred = $4
       RETURNING *`,
      [req.user.id, match_id, home_pred, away_pred]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar predicción' });
  }
});

router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const phase = req.query.phase || 1;

    const users = await pool.query(
      `SELECT id, name, city, cargo, p1pts, p2pts FROM users
       WHERE status = 'approved' AND is_admin = FALSE
       ORDER BY ${phase === 1 ? 'p1pts' : 'p2pts'} DESC`
    );

    const preds = await pool.query(
      `SELECT u.name, m.stage, m.round, m.home_team, m.away_team,
              m.home_score, m.away_score, p.home_pred, p.away_pred, p.points, m.status
       FROM predictions p
       JOIN users u ON u.id = p.user_id
       JOIN matches m ON m.id = p.match_id
       WHERE m.phase = $1 AND u.is_admin = FALSE
       ORDER BY u.name, m.match_order`,
      [phase]
    );

    res.json({ positions: users.rows, predictions: preds.rows, phase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al exportar' });
  }
});

module.exports = router;
