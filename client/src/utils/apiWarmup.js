import { getApiBaseURL } from './api';

let warmed = false;

/** Прогрев serverless API на Vercel (холодный старт). */
export function warmupApi() {
  if (warmed || process.env.NODE_ENV !== 'production') return;
  warmed = true;
  const base = getApiBaseURL().replace(/\/$/, '');
  const url = `${base}/health`;
  fetch(url, { method: 'GET', credentials: 'same-origin' }).catch(() => {});
}
