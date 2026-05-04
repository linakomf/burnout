import axios from 'axios';
import { clearBannerProfileCache } from '../config/homeBannerVideo';

/** Как backendPublicUrl: в проде при отдельном хосте API задайте REACT_APP_API_ORIGIN (без /api). */
function getApiBaseURL() {
  const origin = (process.env.REACT_APP_API_ORIGIN || '').trim().replace(/\/$/, '');
  if (origin) return `${origin}/api`;
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const reqUrl = err.config?.url || '';
    const isAuthForm = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearBannerProfileCache();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;