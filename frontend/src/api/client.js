const API = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getUsers: (params) => request(`/users${params ? `?${params}` : ''}`),
  approveUser: (id, status) =>
    request(`/users/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adjustPoints: (id, delta) =>
    request(`/users/${id}/points`, { method: 'PATCH', body: JSON.stringify({ delta }) }),

  getMatches: (params) => request(`/matches${params ? `?${params}` : ''}`),
  setResult: (id, home_score, away_score) =>
    request(`/matches/${id}/result`, { method: 'POST', body: JSON.stringify({ home_score, away_score }) }),
  setMatchStatus: (id, status) =>
    request(`/matches/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateTeams: (id, home_team, away_team) =>
    request(`/matches/${id}/teams`, { method: 'PATCH', body: JSON.stringify({ home_team, away_team }) }),

  getPredictions: (params) => request(`/predictions${params ? `?${params}` : ''}`),
  savePrediction: (body) => request('/predictions', { method: 'POST', body: JSON.stringify(body) }),
  exportData: (phase) => request(`/predictions/export?phase=${phase}`),

  getChat: (since) => request(`/chat${since ? `?since=${since}` : ''}`),
  sendChat: (message) => request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  getNotifs: (unread) => request(`/notifs${unread ? '?unread=true' : ''}`),
  getUnreadCount: () => request('/notifs/unread-count'),
  markNotifsRead: () => request('/notifs/read-all', { method: 'PATCH' }),

  getSettings: () => request('/admin/settings'),
  unlockRound: (round) => request('/admin/unlock-round', { method: 'POST', body: JSON.stringify({ round }) }),
  activatePhase: (phase) => request('/admin/activate-phase', { method: 'POST', body: JSON.stringify({ phase }) }),
  getPremios: () => request('/admin/premios'),
  getPendingUsers: () => request('/admin/pending-users'),
};

export function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${proto}//${host}/ws`;
}
