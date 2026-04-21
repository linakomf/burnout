import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
  readPendingOnboarding,
  clearPendingOnboarding,
} from '../utils/onboardingLocalStorage';
import { setAppRoleFromUser, clearAppRole } from '../utils/appRole';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
}

function persistUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function persistSession(token, user) {
  localStorage.setItem('token', token);
  persistUser(user);
}

function clearSessionStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAppRoleFromUser(user);
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/users/me')
        .then((res) => {
          const server = res.data;
          if (server.role === 'admin') {
            setUser(server);
            persistUser(server);
            return;
          }
          const pending = readPendingOnboarding(server.user_id);

          if (server.onboarding_burnout_completed) {
            clearPendingOnboarding(server.user_id);
            setUser(server);
            persistUser(server);
            return;
          }

          let u = server;
          if (pending) {
            u = {
              ...server,
              onboarding_burnout_completed: true,
              onboarding_burnout_percent: pending.percent ?? server.onboarding_burnout_percent,
            };
          }
          setUser(u);
          persistUser(u);

          if (pending?.answers?.length === 10) {
            api
              .post('/users/onboarding-burnout', { answers: pending.answers })
              .then((r) => {
                clearPendingOnboarding(server.user_id);
                const merged = { ...server, ...r.data.user };
                setUser(merged);
                persistUser(merged);
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          clearSessionStorage();
          clearAppRole();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    persistSession(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    persistSession(res.data.token, res.data.user);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    clearSessionStorage();
    clearAppRole();
    setUser(null);
  };

  const updateUser = useCallback((newData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...newData };
      try {
        persistUser(merged);
      } catch {
        /* private mode */
      }
      return merged;
    });
  }, []);

  /** Полная подгрузка пользователя с сервера (404/401 — сброс сессии, без необработанного исключения) */
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/users/me');
      const server = res.data;
      setUser(server);
      try {
        persistUser(server);
      } catch {
        /* ignore */
      }
      return server;
    } catch (e) {
      const s = e.response?.status;
      if (s === 404 || s === 401) {
        try {
          clearSessionStorage();
          clearAppRole();
        } catch {
          /* ignore */
        }
        setUser(null);
        return null;
      }
      throw e;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, refreshUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
