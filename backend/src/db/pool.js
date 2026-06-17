const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Forzar zona horaria Colombia en todas las conexiones
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'America/Bogota'");
});

module.exports = pool;
