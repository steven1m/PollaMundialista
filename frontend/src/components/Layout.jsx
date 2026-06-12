import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnreadNotifs } from '../hooks/useApp';
import './Layout.css';

export default function Layout() {
  const { user, logout, settings } = useAuth();
  const { count: unreadCount } = useUnreadNotifs();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Posiciones' },
    { to: '/predicciones', label: 'Predicciones' },
    { to: '/historial', label: 'Historial' },
    { to: '/premios', label: 'Premios' },
    { to: '/chat', label: 'Chat' },
    { to: '/alertas', label: 'Alertas', badge: unreadCount },
  ];

  if (user?.is_admin) {
    navItems.push({ to: '/admin', label: 'Admin' });
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-main">⚽ Polla Mundialista</span>
            <span className="logo-sub">Aragón Aluminio · Comité de Convivencia Laboral</span>
          </div>

          <nav className="nav">
            {navItems.map(({ to, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {label}
                {badge > 0 && <span className="nav-badge">{badge > 9 ? '9+' : badge}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {settings && <span className="phase-badge">Fase {settings.active_phase}</span>}
            <span>{user?.name}</span>
            <button className="btn btn-sm btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="footer">
        Polla Mundialista 2026 · Aragón Aluminio · Comité de Convivencia Laboral
      </footer>
    </div>
  );
}
