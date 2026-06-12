const sessions = new Map();

function createSession(user) {
  const token = require('crypto').randomBytes(32).toString('hex');
  sessions.set(token, { ...user, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function destroySession(token) {
  sessions.delete(token);
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  req.user = session;
  next();
}

function adminMiddleware(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
}

function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  req.user = getSession(token);
  next();
}

module.exports = {
  createSession,
  getSession,
  destroySession,
  authMiddleware,
  adminMiddleware,
  optionalAuth,
};
