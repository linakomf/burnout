import axios from 'axios';

/** Как в api.js: пусто или `/api` — прокси CRA; полный URL должен заканчиваться на `/api`. */
function adminPortalBaseURL() {
  const raw = process.env.REACT_APP_API_BASE;
  if (raw == null || String(raw).trim() === '') return '/api/admin-portal';
  const base = String(raw).replace(/\/$/, '');
  const withApi = base.endsWith('/api') ? base : `${base}/api`;
  return `${withApi}/admin-portal`;
}

const adminApi = axios.create({
  baseURL: adminPortalBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminPortalToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const reqUrl = String(err.config?.url || '');
    const isLogin = /\/login\b/.test(reqUrl);
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('adminPortalToken');
      if (!isLogin) window.location.assign('/admin-portal');
    }
    return Promise.reject(err);
  }
);

export default adminApi;
