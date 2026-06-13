
export function readFormField(formEl, name) {
  const node = formEl.elements.namedItem(name);
  if (!node) return '';
  if (typeof RadioNodeList !== 'undefined' && node instanceof RadioNodeList) {
    return node.value != null ? String(node.value) : '';
  }
  return 'value' in node ? String(node.value ?? '') : '';
}

export function mergeField(domVal, stateVal, trim) {
  const a = trim ? String(domVal ?? '').trim() : String(domVal ?? '');
  if (a) return a;
  const b = trim ? String(stateVal ?? '').trim() : String(stateVal ?? '');
  return b;
}

export function formatAuthAxiosError(err, t) {
  const data = err?.response?.data;
  const msg = typeof data === 'object' && data != null && typeof data.message === 'string' ? data.message : null;
  if (msg && msg.trim()) return msg;
  const code = String(err?.code || '');
  if (!err?.response) {
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return t('auth.errColdStart') || t('auth.errServer');
    }
    if (code === 'ERR_NETWORK') return t('auth.errNetwork');
    return t('auth.errNetwork');
  }
  const contentType = String(err.response.headers?.['content-type'] || '');
  const st = err.response.status;
  if (contentType.includes('text/html') || st === 504) {
    return t('auth.errColdStart') || t('auth.errApiUnreachable');
  }
  if (st === 503) {
    const hint =
      typeof data === 'object' && data != null && typeof data.message === 'string'
        ? data.message
        : null;
    if (hint && /DATABASE_URL|база данных/i.test(hint)) return hint;
    return t('auth.errColdStart') || hint || t('auth.errApiUnreachable');
  }
  if (st === 404 || st === 502) return t('auth.errApiUnreachable');
  if (st >= 500) return t('auth.errServer');
  return '';
}
