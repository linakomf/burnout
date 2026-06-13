import api from './api';



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
