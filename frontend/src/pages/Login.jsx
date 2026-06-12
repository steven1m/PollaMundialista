import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credentials = isAdmin ? { password } : { name };
      await login(credentials);
      navigate('/');
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
          <h1>⚽ Polla Mundialista</h1>
          <p>Aragón Aluminio · Mundial 2026</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={`auth-tab${!isAdmin ? ' active' : ''}`} onClick={() => setIsAdmin(false)}>
            Participante
          </button>
          <button type="button" className={`auth-tab${isAdmin ? ' active' : ''}`} onClick={() => setIsAdmin(true)}>
            Admin
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isAdmin ? (
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como aparece en tu registro"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Contraseña de administrador</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {!isAdmin && (
          <div className="auth-footer">
            ¿No estás registrado? <Link to="/register">Regístrate aquí</Link>
          </div>
        )}
      </div>
    </div>
  );
}
