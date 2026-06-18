import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { usePolling, formatDate, exportToExcel } from '../hooks/useApp';

export default function Admin() {
  const { refreshSettings } = useAuth();
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('inscripciones');

  const fetchData = useCallback(async () => {
    const [pending, matches, users, settings] = await Promise.all([
      api.getPendingUsers(),
      api.getMatches(),
      api.getUsers('status=approved'),
      api.getSettings(),
    ]);
    return { pending, matches, users, settings };
  }, []);

  const { data, loading, error, refresh } = usePolling(fetchData, 15000);

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
    refresh();
    refreshSettings();
  };

  const handleApprove = async (id, status) => {
    try {
      await api.approveUser(id, status);
      notify(status === 'approved' ? 'Usuario aprobado' : 'Usuario rechazado');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleResult = async (matchId, home, away) => {
    try {
      await api.setResult(matchId, home, away);
      notify('Resultado registrado');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleStatus = async (matchId, status) => {
    const label = status === 'locked' ? 'iniciar el partido (bloquear predicciones)' : 'revertir a Próximo';
    if (!confirm(`¿Confirmar ${label}?`)) return;
    try {
      await api.setMatchStatus(matchId, status);
      notify(status === 'locked' ? 'Partido en curso' : 'Partido revertido a Próximo');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleUnlock = async (round) => {
    if (!confirm(`¿Desbloquear ${round}?`)) return;
    try {
      await api.unlockRound(round);
      notify(`Ronda ${round} desbloqueada`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handlePhase = async (phase) => {
    const warn = phase === 2
      ? '¿Activar Fase 2? Esto reiniciará los puntos de Fase 2 a cero para todos.'
      : '¿Activar Fase 1?';
    if (!confirm(warn)) return;
    try {
      await api.activatePhase(phase);
      notify(`Fase ${phase} activada`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handlePoints = async (userId, delta) => {
    try {
      await api.adjustPoints(userId, delta);
      notify(`Puntos ${delta > 0 ? 'sumados' : 'restados'}`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleTeams = async (matchId, home, away) => {
    try {
      await api.updateTeams(matchId, home, away);
      notify('Equipos actualizados');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const handleExport = async () => {
    const phase = data?.settings?.active_phase || 1;
    try {
      const exportData = await api.exportData(phase);
      exportToExcel(exportData.positions, exportData.predictions, phase, `polla-admin-fase${phase}.xlsx`);
    } catch (err) {
      setMsg(err.message);
    }
  };

  if (loading && !data) return <p>Cargando panel admin...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const tabs = [
    { id: 'inscripciones', label: 'Inscripciones' },
    { id: 'resultados', label: 'Resultados' },
    { id: 'rondas', label: 'Rondas' },
    { id: 'equipos', label: 'Equipos' },
    { id: 'fase', label: 'Fase' },
    { id: 'puntos', label: 'Puntos' },
  ];

  const knockoutRounds = [...new Set(data.matches.filter((m) => m.stage === 'Eliminatorias').map((m) => m.round))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Panel Admin</h1>
        <button className="btn btn-accent" onClick={handleExport}>📥 Exportar Excel</button>
      </div>

      {msg && <div className={`alert ${msg.includes('Error') || msg.includes('error') ? 'alert-error' : 'alert-success'}`}>{msg}</div>}

      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.id === 'inscripciones' && data.pending.length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 4 }}>{data.pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'inscripciones' && (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Inscripciones pendientes</h2>
          {data.pending.length === 0 ? (
            <p className="empty-state">No hay inscripciones pendientes</p>
          ) : (
            data.pending.map((u) => (
              <div key={u.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                <strong>{u.name}</strong> · {u.city} · {u.cargo}
                <div>Nequi: <code>{u.nequi}</code></div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-primary" onClick={() => handleApprove(u.id, 'approved')}>Aprobar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleApprove(u.id, 'rejected')}>Rechazar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'resultados' && (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Registrar resultados</h2>
          {data.matches.filter((m) => m.status !== 'played').slice(0, 20).map((m) => (
            <ResultRow key={m.id} match={m} onSave={handleResult} onStatus={handleStatus} />
          ))}
        </div>
      )}

      {activeTab === 'rondas' && (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Desbloquear rondas eliminatorias</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Desbloqueadas: {data.settings.unlocked_rounds?.join(', ') || 'ninguna'}
          </p>
          {knockoutRounds.map((round) => (
            <button key={round} className="btn btn-outline" style={{ margin: '0.25rem' }} onClick={() => handleUnlock(round)}>
              🔓 {round}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'equipos' && (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Actualizar equipos en cruces</h2>
          {data.matches.filter((m) => m.home_team.includes('Gan.') || m.away_team.includes('Gan.')).map((m) => (
            <TeamRow key={m.id} match={m} onSave={handleTeams} />
          ))}
        </div>
      )}

      {activeTab === 'fase' && (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>Activar fase</h2>
          <p>Fase activa: <strong>Fase {data.settings.active_phase}</strong></p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={() => handlePhase(1)} disabled={data.settings.active_phase === 1}>
              Activar Fase 1
            </button>
            <button className="btn btn-accent" onClick={() => handlePhase(2)} disabled={data.settings.active_phase === 2}>
              Activar Fase 2 (reinicia p2pts)
            </button>
          </div>
        </div>
      )}

      {activeTab === 'puntos' && (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Ajuste manual — Fase {data.settings.active_phase}
          </h2>
          <table>
            <thead>
              <tr><th>Nombre</th><th>Puntos F{data.settings.active_phase}</th><th>Ajuste</th></tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{data.settings.active_phase === 1 ? u.p1pts : u.p2pts}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => handlePoints(u.id, 1)}>+1</button>{' '}
                    <button className="btn btn-sm btn-outline" onClick={() => handlePoints(u.id, -1)}>-1</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ResultRow({ match, onSave, onStatus }) {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const statusLabel = match.status === 'locked' ? '🔴 En curso' : '🟢 Próximo';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
      <span style={{ flex: 1, minWidth: 180 }}>
        {match.home_team} vs {match.away_team}
        <span className="badge badge-info" style={{ marginLeft: 6 }}>{match.round}</span>
        <span className="badge" style={{ marginLeft: 6 }}>{statusLabel}</span>
      </span>
      {match.status === 'upcoming' && (
        <button className="btn btn-sm btn-danger" onClick={() => onStatus(match.id, 'locked')}>
          🔒 Iniciar partido
        </button>
      )}
      {match.status === 'locked' && (
        <>
          <button className="btn btn-sm btn-outline" onClick={() => onStatus(match.id, 'upcoming')}>
            ↩ Revertir
          </button>
          <input type="number" min="0" value={home} onChange={(e) => setHome(e.target.value)} style={{ width: 45, padding: 4, textAlign: 'center' }} />
          <span>-</span>
          <input type="number" min="0" value={away} onChange={(e) => setAway(e.target.value)} style={{ width: 45, padding: 4, textAlign: 'center' }} />
          <button className="btn btn-sm btn-primary" disabled={home === '' || away === ''} onClick={() => onSave(match.id, parseInt(home), parseInt(away))}>
            Guardar
          </button>
        </>
      )}
    </div>
  );
}

function TeamRow({ match, onSave }) {
  const [home, setHome] = useState(match.home_team);
  const [away, setAway] = useState(match.away_team);

  return (
    <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      <span className="badge badge-info">{match.round}</span>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        <input value={home} onChange={(e) => setHome(e.target.value)} style={{ flex: 1, padding: 6, minWidth: 120 }} />
        <span>vs</span>
        <input value={away} onChange={(e) => setAway(e.target.value)} style={{ flex: 1, padding: 6, minWidth: 120 }} />
        <button className="btn btn-sm btn-primary" onClick={() => onSave(match.id, home, away)}>Actualizar</button>
      </div>
    </div>
  );
}
