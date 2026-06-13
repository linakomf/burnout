
export async function withApiRetry(requestFn, { retries = 4, delayMs = 2500 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      const contentType = String(err?.response?.headers?.['content-type'] || '');
      const isHtml = contentType.includes('text/html');
      const retryable =
        !err?.response ||
        isHtml ||
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
