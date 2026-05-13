/** Чтение из DOM (автозаполнение часто не синхронизировано с React state). */
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

/** Сообщение для формы входа/регистрации (сеть, ответ API). */
export function formatAuthAxiosError(err, t) {
  const data = err?.response?.data;
  const msg = typeof data === 'object' && data != null && typeof data.message === 'string' ? data.message : null;
  if (msg && msg.trim()) return msg;
  const code = String(err?.code || '');
  if (!err?.response) {
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') return t('auth.errServer');
    return t('auth.errNetwork');
  }
  const contentType = String(err.response.headers?.['content-type'] || '');
  if (contentType.includes('text/html')) return t('auth.errApiUnreachable');
  const st = err.response.status;
  if (st === 404 || st === 502 || st === 504) return t('auth.errApiUnreachable');
  if (st >= 500) return t('auth.errServer');
  return '';
}
