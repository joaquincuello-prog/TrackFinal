import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('trackfinal_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('trackfinal_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Si tenemos token pero queremos validar sesión al montar la app
    const verifySession = async () => {
      if (token) {
        try {
          const res = await authService.getPerfil();
          if (res && res.usuario) {
            setUser(res.usuario);
            localStorage.setItem('trackfinal_user', JSON.stringify(res.usuario));
          }
        } catch (err) {
          console.warn('Sesión no válida o expirada:', err.message);
          logout();
        }
      }
      setInitialLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response && response.token && response.usuario) {
        setToken(response.token);
        setUser(response.usuario);
        localStorage.setItem('trackfinal_token', response.token);
        localStorage.setItem('trackfinal_user', JSON.stringify(response.usuario));
        return { success: true, usuario: response.usuario };
      }
      throw new Error('Respuesta de autenticación incompleta');
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error al iniciar sesión';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('trackfinal_token');
    localStorage.removeItem('trackfinal_user');
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    initialLoading,
    login,
    logout,
    hasRole: (roles) => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return roles.includes(user.rol);
      }
      return user.rol === roles;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
