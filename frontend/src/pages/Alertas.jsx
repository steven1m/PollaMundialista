import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useUnreadNotifs, formatDate } from '../hooks/useApp';

export default function Alertas() {
  const [notifs, setNotifs] = useState([]);
  const [error, setError] = useState('');
  const { refresh: refreshBadge } = useUnreadNotifs();

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifs();
      setNotifs(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await api.markNotifsRead();
    refreshBadge();
    load();
  };

  const typeIcon = {
    result: '⚽',
    approved: '✅',
    new_user: '👤',
    phase_change: '🔄',
    round_unlock: '🔓',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Alertas</h1>
        {notifs.some((n) => !n.read) && (
          <button className="btn btn-sm btn-outline" onClick={markAllRead}>Marcar todas como leídas</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {notifs.length === 0 ? (
          <p className="empty-state">No hay notificaciones</p>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '0.75rem',
                borderBottom: '1px solid var(--border)',
                opacity: n.read ? 0.6 : 1,
                background: n.read ? 'transparent' : '#fef9e7',
              }}
            >
              <span style={{ marginRight: 8 }}>{typeIcon[n.type] || '🔔'}</span>
              {n.message}
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                {formatDate(n.created_at)}
                {!n.read && <span className="badge badge-warning" style={{ marginLeft: 8 }}>Nueva</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
