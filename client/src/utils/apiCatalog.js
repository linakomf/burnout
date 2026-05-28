import api from './api';

/**
 * GET каталога с логом ошибки (не глотать 500/CORS молча).
 * @param {string} path — например '/events'
 * @param {object} emptyData — { events: [] }
 * @param {string} label — для console
 */
export async function apiGetCatalog(path, emptyData, label = path) {
  try {
    return await api.get(path);
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    console.error(`[catalog] ${label} failed`, status || 'network', msg);
    return { data: emptyData };
  }
}
