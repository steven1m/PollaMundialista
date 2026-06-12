const express = require('express');
const pool = require('../db/pool');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const ROUND_MAP = {
  'Ronda de 32': 'ronda_de_32',
  'Ronda de 16': 'ronda_de_16',
  'Cuartos de Final': 'cuartos_de_final',
  'Semifinal': 'semifinal',
  'Tercer Puesto': 'tercer_puesto',
  'Final': 'final',
};

router.get('/settings', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

router.post('/unlock-round', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { round } = req.body;
    const key = ROUND_MAP[round] || round;

    const settings = await pool.query('SELECT unlocked_rounds FROM settings WHERE id = 1');
    const current = settings.rows[0]?.unlocked_rounds || [];
    if (!current.includes(key)) {
      current.push(key);
    }
    if (!current.includes(round)) {
      current.push(round);
    }

    await pool.query('UPDATE settings SET unlocked_rounds = $1 WHERE id = 1', [current]);

    await pool.query(
      `UPDATE matches SET status = 'upcoming'
       WHERE round = $1 AND status = 'locked'`,
      [round]
    );

    const users = await pool.query("SELECT id FROM users WHERE status = 'approved' AND is_admin = FALSE");
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifs (user_id, type, message) VALUES ($1, 'round_unlock', $2)`,
        [u.id, `Ronda desbloqueada: ${round}. ¡Ya puedes predecir!`]
      );
    }

    res.json({ unlocked_rounds: current });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desbloquear ronda' });
  }
});

router.post('/activate-phase', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phase } = req.body;
    if (![1, 2].includes(phase)) {
      return res.status(400).json({ error: 'Fase debe ser 1 o 2' });
    }

    if (phase === 2) {
      await pool.query('UPDATE users SET p2pts = 0 WHERE is_admin = FALSE');
    }

    await pool.query('UPDATE settings SET active_phase = $1 WHERE id = 1', [phase]);

    const users = await pool.query("SELECT id FROM users WHERE status = 'approved' AND is_admin = FALSE");
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifs (user_id, type, message) VALUES ($1, 'phase_change', $2)`,
        [u.id, `¡Fase ${phase} activada! ${phase === 2 ? 'Los puntos de Fase 2 reinician en cero.' : ''}`]
      );
    }

    const settings = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(settings.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al activar fase' });
  }
});

router.get('/premios', authMiddleware, async (_req, res) => {
  try {
    const settings = await pool.query('SELECT * FROM settings WHERE id = 1');
    const s = settings.rows[0];

    const calcPodium = async (phase) => {
      const ptsCol = phase === 1 ? 'p1pts' : 'p2pts';
      const bolsa = phase === 1 ? parseFloat(s.phase1_bolsa) : parseFloat(s.phase2_bolsa);
      const users = await pool.query(
        `SELECT id, name, ${ptsCol} AS pts FROM users
         WHERE status = 'approved' AND is_admin = FALSE
         ORDER BY ${ptsCol} DESC LIMIT 3`
      );

      const distribution = [0.5, 0.3, 0.2];
      const podium = users.rows.map((u, i) => ({
        position: i + 1,
        name: u.name,
        points: u.pts,
        amount: Math.round(bolsa * (distribution[i] || 0)),
      }));

      return { bolsa, podium };
    };

    const phase1 = await calcPodium(1);
    const phase2 = await calcPodium(2);

    res.json({ phase1, phase2, active_phase: s.active_phase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular premios' });
  }
});

router.get('/pending-users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE status = 'pending' AND is_admin = FALSE ORDER BY created_at ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pendientes' });
  }
});

module.exports = router;
