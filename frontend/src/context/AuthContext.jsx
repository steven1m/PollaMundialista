import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [settings, setSettings] = useState(null);

  const refreshSettings = useCallback(async () => {
    if (!user) return;
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const login = async (credentials) => {
    const data = await api.login(credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSettings(null);
  };

  return (
    <AuthContext.Provider value={{ user, settings, login, logout, refreshSettings, setSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
