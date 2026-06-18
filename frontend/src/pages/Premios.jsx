import { useCallback } from 'react';
import { api } from '../api/client';
import { usePolling, formatCOP, exportToExcel } from '../hooks/useApp';

export default function Premios() {
  const fetchData = useCallback(() => api.getPremios(), []);
  const { data, loading, error } = usePolling(fetchData, 60000);

  const handleExport = async (phase) => {
    try {
      const exportData = await api.exportData(phase);
      exportToExcel(
        exportData.positions,
        exportData.predictions,
        phase,
        `polla-premios-fase${phase}.xlsx`
      );
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading && !data) return <p>Cargando...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1 className="page-title">Premios</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Distribución: 1° 50% · 2° 30% · 3° 20% de la bolsa · Inscripción: $25.000 COP · +50% aporte empresa
      </p>

      <div className="grid-2">
        <PhasePodium phase={1} data={data.phase1} onExport={() => handleExport(1)} active={data.active_phase === 1} />
        <PhasePodium phase={2} data={data.phase2} onExport={() => handleExport(2)} active={data.active_phase === 2} />
      </div>
    </div>
  );
}

function PhasePodium({ phase, data, onExport, active }) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="card" style={{ border: active ? '2px solid var(--accent)' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Fase {phase} {active && <span className="badge badge-warning">Activa</span>}
        </h2>
        <button className="btn btn-sm btn-accent" onClick={onExport}>📥 Excel</button>
      </div>

      <div className="stat-card" style={{ marginBottom: '1rem' }}>
        <div className="value">{formatCOP(data?.bolsa || 0)}</div>
        <div className="label">Bolsa total</div>
      </div>

      {data?.podium?.length === 0 ? (
        <p className="empty-state">Sin participantes aún</p>
      ) : (
        data.podium.map((p, i) => (
          <div key={p.position} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.75rem', marginBottom: '0.5rem',
            background: i === 0 ? '#fef9e7' : i === 1 ? '#f8f9fa' : '#fdf2e9',
            borderRadius: 8,
          }}>
            <span>{medals[i]} {p.name} ({p.points} pts)</span>
            <strong>{formatCOP(p.amount)}</strong>
          </div>
        ))
      )}
    </div>
  );
}
