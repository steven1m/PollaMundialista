import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', city: '', cargo: '', nequi: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await api.register(form);
      setSuccess(data.message);
      setForm({ name: '', city: '', cargo: '', nequi: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Registro</h1>
          <p>Completa tus datos para participar en la polla</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre completo</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Ciudad</label>
            <input name="city" value={form.city} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Cargo</label>
            <input name="cargo" value={form.cargo} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Número de comprobante Nequi</label>
            <input name="nequi" value={form.nequi} onChange={handleChange} placeholder="Ej: 1234567890" required />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar inscripción'}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
