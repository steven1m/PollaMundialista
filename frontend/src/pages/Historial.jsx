import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { usePolling, formatDate } from '../hooks/useApp';

export default function Historial() {
  const { user, settings } = useAuth();
  const phase = settings?.active_phase || 1;
  const [filterUser, setFilterUser] = useState('');
  const [users, setUsers] = useState([]);

  const fetchData = useCallback(async () => {
    const params = `phase=${phase}${filterUser ? `&user_id=${filterUser}` : ''}`;
    const [predData, usersData] = await Promise.all([
      api.getPredictions(params),
      user?.is_admin ? api.getUsers() : Promise.resolve([]),
    ]);
    if (user?.is_admin) setUsers(usersData);
    return predData;
  }, [phase, filterUser, user?.is_admin]);

  const { data, loading, error } = usePolling(fetchData, 30000);

  if (loading && !data) return <p>Cargando...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { predictions, stats } = data;
  const played = predictions.filter((p) => p.match_status === 'played');

  return (
    <div>
      <h1 className="page-title">Historial — Fase {phase}</h1>

      {user?.is_admin && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filtrar por participante</label>
            <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Todos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-card">
          <div className="value">{stats.total_points}</div>
          <div className="label">Puntos totales</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.exact_scores}</div>
          <div className="label">Marcadores exactos (3 pts)</div>
        </div>
        <div className="card stat-card">
          <div className="value">{stats.correct_results}</div>
          <div className="label">Resultados correctos (1 pt)</div>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {user?.is_admin && <th>Participante</th>}
                <th>Partido</th>
                <th>Predicción</th>
                <th>Resultado</th>
                <th>Puntos</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {played.length === 0 ? (
                <tr><td colSpan={user?.is_admin ? 6 : 5} className="empty-state">Sin predicciones jugadas aún</td></tr>
              ) : (
                played.map((p) => (
                  <tr key={p.id}>
                    {user?.is_admin && <td>{p.user_name}</td>}
                    <td>{p.home_team} vs {p.away_team}<br /><span className="badge badge-info">{p.round}</span></td>
                    <td>{p.home_pred} - {p.away_pred}</td>
                    <td>{p.home_score} - {p.away_score}</td>
                    <td>
                      <span className={`badge ${p.points === 3 ? 'badge-success' : p.points === 1 ? 'badge-warning' : 'badge-danger'}`}>
                        {p.points} pts
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(p.match_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
