import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import {
  readPendingOnboarding,
  clearPendingOnboarding,
} from '../utils/onboardingLocalStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api
        .get('/users/me')
        .then((res) => {
          const server = res.data;
          const pending = readPendingOnboarding(server.user_id);

          if (server.onboarding_burnout_completed) {
            clearPendingOnboarding(server.user_id);
            setUser(server);
            localStorage.setItem('user', JSON.stringify(server));
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
          localStorage.setItem('user', JSON.stringify(u));

          if (pending?.answers?.length === 10) {
            api
              .post('/users/onboarding-burnout', { answers: pending.answers })
              .then((r) => {
                clearPendingOnboarding(server.user_id);
                const merged = { ...server, ...r.data.user };
                setUser(merged);
                localStorage.setItem('user', JSON.stringify(merged));
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
