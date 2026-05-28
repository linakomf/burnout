import axios from 'axios';
import { getApiBaseURL } from './api';

function adminPortalBaseURL() {
  return `${getApiBaseURL().replace(/\/$/, '')}/admin-portal`;
}

const adminApi = axios.create({
  baseURL: adminPortalBaseURL(),
  headers: { 'Content-Type': 'application/json' }
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