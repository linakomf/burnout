/**
 * Повтор запроса при холодном старте Vercel (504 / сеть).
 */
export async function withApiRetry(requestFn, { retries = 2, delayMs = 1500 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      const retryable =
        !err?.response ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err.code === 'ECONNABORTED' ||
        err.code === 'ERR_NETWORK';
      if (!retryable || attempt >= retries) break;
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}
