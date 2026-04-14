import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('zt_token');
    const storedUser = localStorage.getItem('zt_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('zt_token');
        localStorage.removeItem('zt_user');
      }
    }
    setLoading(false);
  }, []);

  function login(newToken, newUser) {
    localStorage.setItem('zt_token', newToken);
    localStorage.setItem('zt_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('zt_token');
    localStorage.removeItem('zt_user');
    setToken(null);
    setUser(null);
  }

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
