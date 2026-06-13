const path = require('path');

let legacyUploadMap = null;

function getLegacyUploadMap() {
  if (legacyUploadMap !== null) return legacyUploadMap;
  try {
    legacyUploadMap = require('../scripts/.migrate-uploads-map.json');
  } catch {
    legacyUploadMap = {};
  }
  return legacyUploadMap;
}



function resolveMediaUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';

  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('

  let p = s.startsWith('/') ? s : `/${s}`;
  if (p.includes('..')) return '';

  const mapped = getLegacyUploadMap()[p];
  if (mapped) return mapped;

  return p;
}

function resolveMediaUrlList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(resolveMediaUrl).filter(Boolean);
}

module.exports = {
  resolveMediaUrl,
  resolveMediaUrlList,
};
