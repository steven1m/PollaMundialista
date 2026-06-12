require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const matchesRoutes = require('./routes/matches');
const predictionsRoutes = require('./routes/predictions');
const chatRoutes = require('./routes/chat');
const notifsRoutes = require('./routes/notifs');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const chatClients = new Set();

wss.on('connection', (ws) => {
  chatClients.add(ws);
  ws.on('close', () => chatClients.delete(ws));
});

app.locals.broadcastChat = (msg) => {
  const data = JSON.stringify({ type: 'chat', data: msg });
  for (const client of chatClients) {
    if (client.readyState === 1) client.send(data);
  }
};

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifs', notifsRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
