const express = require('express');
const pool = require('../db/pool');
const { createSession } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, city, cargo, nequi } = req.body;
    if (!name?.trim() || !city?.trim() || !cargo?.trim() || !nequi?.trim()) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const existing = await pool.query(
      'SELECT id, status FROM users WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );
    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      if (u.status === 'rejected') {
        return res.status(400).json({ error: 'Tu inscripción fue rechazada. Contacta al administrador.' });
      }
      return res.status(400).json({ error: 'Ya existe un registro con ese nombre' });
    }

    const result = await pool.query(
      `INSERT INTO users (name, city, cargo, nequi) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), city.trim(), cargo.trim(), nequi.trim()]
    );

    await pool.query(
      `INSERT INTO notifs (user_id, type, message) VALUES (NULL, 'new_user', $1)`,
      [`Nueva inscripción pendiente: ${name.trim()}`]
    );

    res.status(201).json({ message: 'Registro enviado. Espera la aprobación del administrador.', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (password) {
      if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
      const admin = await pool.query('SELECT * FROM users WHERE is_admin = TRUE LIMIT 1');
      if (admin.rows.length === 0) {
        return res.status(500).json({ error: 'Admin no configurado' });
      }
      const u = admin.rows[0];
      const token = createSession({
        id: u.id,
        name: u.name,
        is_admin: true,
        status: u.status,
      });
      return res.json({ token, user: { id: u.id, name: u.name, is_admin: true } });
    }

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(name) = LOWER($1) AND is_admin = FALSE',
      [name.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado. Regístrate primero.' });
    }

    const u = result.rows[0];
    if (u.status === 'pending') {
      return res.status(403).json({ error: 'Tu inscripción está pendiente de aprobación' });
    }
    if (u.status === 'rejected') {
      return res.status(403).json({ error: 'Tu inscripción fue rechazada' });
    }

    const token = createSession({
      id: u.id,
      name: u.name,
      is_admin: false,
      status: u.status,
    });
    res.json({
      token,
      user: { id: u.id, name: u.name, is_admin: false, p1pts: u.p1pts, p2pts: u.p2pts },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Sesión cerrada' });
});

module.exports = router;
