export function isVideoCoverAsset(value) {
  if (!value) return false;

  if (typeof File !== 'undefined' && value instanceof File) {
    return String(value.type || '').toLowerCase().startsWith('video/');
  }

  const raw = String(value).trim().toLowerCase();
  if (!raw) return false;

  return /\.(mp4|webm|mov|m4v)(?:[?#].*)?$/.test(raw);
}
