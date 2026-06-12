const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const { seedMatches } = require('./seed');

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const settings = await pool.query('SELECT * FROM settings WHERE id = 1');
  if (settings.rows.length === 0) {
    await pool.query(
      `INSERT INTO settings (id, active_phase, phase1_bolsa, phase2_bolsa, unlocked_rounds)
       VALUES (1, 1, 0, 0, ARRAY['group'])`
    );
  }

  const admin = await pool.query('SELECT id FROM users WHERE is_admin = TRUE LIMIT 1');
  if (admin.rows.length === 0) {
    await pool.query(
      `INSERT INTO users (name, city, cargo, nequi, status, is_admin)
       VALUES ('Administrador', 'Medellín', 'Admin', '0000000000', 'approved', TRUE)`
    );
  }

  const matchCount = await pool.query('SELECT COUNT(*) FROM matches');
  if (parseInt(matchCount.rows[0].count) === 0) {
    await seedMatches(pool);
  }

  console.log('Database initialized successfully.');
  await pool.end();
}

init().catch((err) => {
  console.error('Init failed:', err);
  process.exit(1);
});
