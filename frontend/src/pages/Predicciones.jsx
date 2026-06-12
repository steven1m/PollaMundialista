import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { usePolling, formatDate } from '../hooks/useApp';

export default function Predicciones() {
  const { user, settings } = useAuth();
  const phase = settings?.active_phase || 1;
  const [saving, setSaving] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchData = useCallback(async () => {
    const [matches, predsData] = await Promise.all([
      api.getMatches(`phase=${phase}`),
      api.getPredictions(`phase=${phase}`),
    ]);
    return { matches, predictions: predsData.predictions };
  }, [phase]);

  const { data, loading, error, refresh } = usePolling(fetchData, 30000);

  const predMap = useMemo(() => {
    if (!data?.predictions) return {};
    return Object.fromEntries(data.predictions.map((p) => [p.match_id, p]));
  }, [data?.predictions]);

  const grouped = useMemo(() => {
    if (!data?.matches) return {};
    const upcoming = data.matches.filter(
      (m) => m.status === 'upcoming' || (m.can_predict && m.status !== 'played')
    );
    return upcoming.reduce((acc, m) => {
      const key = `${m.stage} — ${m.round}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(m);
      return acc;
    }, {});
  }, [data?.matches]);

  const handleSave = async (matchId, home, away) => {
    setSaving(matchId);
    setMsg('');
    try {
      await api.savePrediction({ match_id: matchId, home_pred: home, away_pred: away });
      setMsg('Predicción guardada');
      refresh();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (user?.is_admin) {
    return (
      <div>
        <h1 className="page-title">Predicciones</h1>
        <div className="alert alert-info">El administrador no puede hacer predicciones.</div>
      </div>
    );
  }

  if (loading && !data) return <p>Cargando...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Predicciones — Fase {phase}</h1>
      {msg && <div className={`alert ${msg.includes('guardada') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

      {Object.keys(grouped).length === 0 ? (
        <div className="card empty-state">No hay partidos disponibles para predecir en esta fase.</div>
      ) : (
        Object.entries(grouped).map(([stage, matches]) => (
          <div key={stage} className="card" style={{ marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>{stage}</h2>
            {matches.map((m) => (
              <MatchPredictionRow
                key={m.id}
                match={m}
                pred={predMap[m.id]}
                saving={saving === m.id}
                onSave={handleSave}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function MatchPredictionRow({ match, pred, saving, onSave }) {
  const [home, setHome] = useState(() => pred?.home_pred ?? '');
  const [away, setAway] = useState(() => pred?.away_pred ?? '');

  useEffect(() => {
    setHome(pred?.home_pred ?? '');
    setAway(pred?.away_pred ?? '');
  }, [pred?.home_pred, pred?.away_pred]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <strong>{match.home_team}</strong> vs <strong>{match.away_team}</strong>
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{formatDate(match.match_date)}</div>
      </div>
      <input
        type="number" min="0" max="20" value={home}
        onChange={(e) => setHome(e.target.value)}
        style={{ width: 50, padding: '0.4rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 6 }}
      />
      <span>—</span>
      <input
        type="number" min="0" max="20" value={away}
        onChange={(e) => setAway(e.target.value)}
        style={{ width: 50, padding: '0.4rem', textAlign: 'center', border: '1px solid var(--border)', borderRadius: 6 }}
      />
      <button
        className="btn btn-sm btn-primary"
        disabled={saving || home === '' || away === ''}
        onClick={() => onSave(match.id, parseInt(home), parseInt(away))}
      >
        {saving ? '...' : pred ? 'Actualizar' : 'Guardar'}
      </button>
      {pred && <span className="badge badge-success">✓</span>}
    </div>
  );
}
