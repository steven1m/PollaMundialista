import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Posiciones from './pages/Posiciones';
import Predicciones from './pages/Predicciones';
import Historial from './pages/Historial';
import Premios from './pages/Premios';
import Chat from './pages/Chat';
import Alertas from './pages/Alertas';
import Admin from './pages/Admin';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute() {
  const { user } = useAuth();
  if (!user?.is_admin) return <Navigate to="/" replace />;
  return <Admin />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Posiciones />} />
        <Route path="predicciones" element={<Predicciones />} />
        <Route path="historial" element={<Historial />} />
        <Route path="premios" element={<Premios />} />
        <Route path="chat" element={<Chat />} />
        <Route path="alertas" element={<Alertas />} />
        <Route path="admin" element={<AdminRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
