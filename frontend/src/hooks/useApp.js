import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useUnreadNotifs() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getUnreadCount();
      setCount(data.count);
    } catch {
      setCount(0);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { count, refresh };
}

export function usePolling(fetchFn, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
    const interval = setInterval(load, intervalMs);
    return () => clearInterval(interval);
  }, [load, intervalMs]);

  return { data, loading, error, refresh: load };
}

export function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function exportToExcel(positions, predictions, phase, filename) {
  import('xlsx').then((XLSX) => {
    const posSheet = positions.map((u, i) => ({
      Posición: i + 1,
      Nombre: u.name,
      Ciudad: u.city,
      Cargo: u.cargo,
      'Puntos F1': u.p1pts,
      'Puntos F2': u.p2pts,
      'Puntos Fase': phase === 1 ? u.p1pts : u.p2pts,
    }));

    const predSheet = predictions.map((p) => ({
      Participante: p.name,
      Etapa: p.stage,
      Ronda: p.round,
      Local: p.home_team,
      Visitante: p.away_team,
      'Pred. Local': p.home_pred,
      'Pred. Visitante': p.away_pred,
      'Resultado Local': p.home_score ?? '',
      'Resultado Visitante': p.away_score ?? '',
      Puntos: p.points,
      Estado: p.status,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(posSheet), 'Posiciones');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(predSheet), 'Predicciones');
    XLSX.writeFile(wb, filename || `polla-fase${phase}.xlsx`);
  });
}
