import axios from 'axios';
import { clearAppRole } from './appRole';

/** В dev с `proxy` в package.json оставьте пустым — тогда `/api` идёт на тот же хост (3000) и проксируется на :5000.
 * Для отдельного URL API: REACT_APP_API_BASE=https://example.com/api */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || '/api',
  headers: { 'Content-Type': 'application/json' },
});

function isAuthLoginOrRegister(config) {
  const path = String(config?.url || '');
  return path.includes('/auth/login') || path.includes('/auth/register');
}

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401: сброс сессии только если это не попытка входа/регистрации (иначе ломается показ «неверный пароль»)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isAuthLoginOrRegister(err.config)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearAppRole();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
