import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import {
  syncBannerProfileFromUser,
  clearBannerProfileCache } from
'../config/homeBannerVideo';
import {
  readPendingOnboarding,
  clearPendingOnboarding } from
'../utils/onboardingLocalStorage';

const AuthContext = createContext(null);

/** Устаревший ответ GET /users/me (запрос ушёл до PUT профиля) не должен затирать gender/avatar. */
function mergeMeResponse(server, prev) {
  if (!prev) return server;
  const profileStale =
    (prev.gender && prev.avatar) && (!server.gender || !server.avatar);
  if (profileStale) {
    const role =
    prev.role === 'teacher' || prev.role === 'student' ?
    prev.role :
    server.role || prev.role;
    return {
      ...server,
      gender: prev.gender,
      avatar: prev.avatar,
      role
    };
  }
  return { ...prev, ...server };
}

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
      api.
      get('/users/me').
      then((res) => {
        const server = res.data;
        const pending = readPendingOnboarding(server.user_id);

        if (server.onboarding_burnout_completed) {
          clearPendingOnboarding(server.user_id);
          setUser((prev) => {
            const merged = mergeMeResponse(server, prev);
            syncBannerProfileFromUser(merged);
            localStorage.setItem('user', JSON.stringify(merged));
            return merged;
          });
          return;
        }

        // Не помечаем опрос пройденным из localStorage до успешного POST - иначе новый user_id
        // с «чужим» pending или тестовым ключом сразу уходит на /dashboard без опроса.
        setUser((prev) => {
          const merged = mergeMeResponse(server, prev);
          syncBannerProfileFromUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
          return merged;
        });

        if (pending?.answers?.length === 9) {
          api.
          post('/users/onboarding-burnout', { answers: pending.answers }).
          then((r) => {
            clearPendingOnboarding(server.user_id);
            setUser((prev) => {
              const base = mergeMeResponse(server, prev);
              const merged = { ...base, ...r.data.user };
              syncBannerProfileFromUser(merged);
              localStorage.setItem('user', JSON.stringify(merged));
              return merged;
            });
          }).
          catch(() => {});
        }
      }).
      catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        clearBannerProfileCache();
        setUser(null);
      }).
      finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const u = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    syncBannerProfileFromUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const newUser = res.data.user;
    clearPendingOnboarding(newUser?.user_id);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
    syncBannerProfileFromUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearBannerProfileCache();
    setUser(null);
  };

  const updateUser = useCallback((newData) => {
    if (!newData || typeof newData !== 'object') return;
    const { token: newToken, ...rest } = newData;
    if (newToken) localStorage.setItem('token', newToken);
    setUser((prev) => {
      const base = prev || {};
      const updated = { ...base, ...rest };
      if (Object.prototype.hasOwnProperty.call(updated, 'token')) delete updated.token;
      syncBannerProfileFromUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>);

};

export const useAuth = () => useContext(AuthContext);
