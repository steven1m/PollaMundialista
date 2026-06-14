import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { usePolling, formatCOP, formatDate } from '../hooks/useApp';

export default function Posiciones() {
  const { settings } = useAuth();
  const phase = settings?.active_phase || 1;

  const fetchData = useCallback(async () => {
    const [users, matches, premios] = await Promise.all([
      api.getUsers(),
      api.getMatches(`status=upcoming&phase=${phase}`),
      api.getPremios(),
    ]);
    return { users, matches, premios };
  }, [phase]);

  const { data, loading, error } = usePolling(fetchData, 20000);

  if (loading && !data) return <p>Cargando...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const { users, matches, premios } = data;
  const ptsKey = phase === 1 ? 'p1pts' : 'p2pts';
  //const bolsa = phase === 1 ? premios?.phase1?.bolsa : premios?.phase2?.bolsa;
  const bolsa = (25000*users.length);
  const upcoming = matches.filter((m) => m.can_predict).slice(0, 5);

  return (
    <div>
      <h1 className="page-title">Posiciones — Fase {phase}</h1>

      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="card stat-card">
          <div className="value">{users.length}</div>
          <div className="label">Participantes</div>
        </div>
        <div className="card stat-card">
          <div className="value">{formatCOP(bolsa || 0)}</div>
          <div className="label">Bolsa Fase {phase}</div>
        </div>
        <div className="card stat-card">
          <div className="value">{upcoming.length}</div>
          <div className="label">Próximos partidos</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title" style={{ marginTop: 0 }}>Ranking</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Ciudad</th>
                <th>Puntos F1</th>
                <th>Puntos F2</th>
                <th>Puntos activos</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={i < 3 ? { fontWeight: 600 } : {}}>
                  <td>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td>{u.name}</td>
                  <td>{u.city}</td>
                  <td>{u.p1pts}</td>
                  <td>{u.p2pts}</td>
                  <td><strong>{u[ptsKey]}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>Próximos partidos</h2>
          {upcoming.map((m) => (
            <div key={m.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span className="badge badge-info">{m.round}</span>{' '}
              <strong>{m.home_team}</strong> vs <strong>{m.away_team}</strong>
              <span style={{ float: 'right', color: 'var(--muted)', fontSize: '0.85rem' }}>
                {formatDate(m.match_date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
