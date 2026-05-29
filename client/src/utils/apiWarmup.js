import { getApiBaseURL } from './api';

let warmupPromise = null;

/**
 * Фоновый прогрев serverless (не блокирует форму).
 */
export function warmupApi() {
  if (process.env.NODE_ENV !== 'production') return Promise.resolve(false);

  if (!warmupPromise) {
    const base = getApiBaseURL().replace(/\/$/, '');
    warmupPromise = fetch(`${base}/warm`, {
      method: 'GET',
      credentials: 'same-origin',
      signal: AbortSignal.timeout(12000)
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        setTimeout(() => {
          warmupPromise = null;
        }, 30000);
      });
  }
  return warmupPromise;
}
