import axios from 'axios';
import { clearBannerProfileCache } from '../config/homeBannerVideo';


export function getApiOrigin() {
  const raw = (process.env.REACT_APP_API_ORIGIN || '').trim().replace(/\/$/, '');
  if (
    process.env.NODE_ENV === 'production' &&
    raw &&
    /localhost|127\.0\.0\.1|\[::1\]/i.test(raw)
  ) {
    console.warn(
      '[api] REACT_APP_API_ORIGIN указывает на localhost в production — используем /api на текущем домене.'
    );
    return '';
  }
  return raw;
}


export function getApiBaseURL() {
  const origin = getApiOrigin();
  if (origin) return `${origin}/api`;
  return '/api';
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000
});

api.interceptors.request.use((config) => {
  const base = String(config.baseURL || '');
  if (base.includes('loca.lt')) {
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
  }
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const reqUrl = err.config?.url || '';
    const isAuthForm = reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register');
    const authMsg = err.response?.data?.message;
    const needsReLogin =
      err.response?.status === 401 ||
      (err.response?.status === 403 &&
        typeof authMsg === 'string' &&
        /токен|войдите/i.test(authMsg));
    if (needsReLogin && !isAuthForm) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      clearBannerProfileCache();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;