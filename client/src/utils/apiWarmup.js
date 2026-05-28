import { getApiBaseURL } from './api';

let warmupPromise = null;

/**
 * Прогрев serverless на Vercel до отправки формы (избегаем 504 на регистрации).
 */
export function warmupApi() {
  if (process.env.NODE_ENV !== 'production') return Promise.resolve(false);

  if (!warmupPromise) {
    const base = getApiBaseURL().replace(/\/$/, '');
    warmupPromise = fetch(`${base}/warm`, {
      method: 'GET',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(55000)
    })
      .then((r) => r.ok)
      .catch(() => false);
  }
  return warmupPromise;
}
