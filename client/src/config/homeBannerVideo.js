const base = (path) => `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}${path}`;

const STORAGE_KEY = 'burnout_banner_profile';

/** Пути в public/media — совпадают с комбинациями роль + пол из онбординга (boy/girl). */
const BY_KEY = {
  'student:boy': '/media/student-boy.mp4',
  'student:girl': '/media/student-girl.mp4',
  'teacher:boy': '/media/teacher-boy.mp4',
  'teacher:girl': '/media/teacher-girl.mp4'
};

const DEFAULT_PATH = BY_KEY['student:boy'];

function readBannerProfileCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return null;
    return p;
  } catch {
    return null;
  }
}

export function persistBannerProfile(userId, role, gender) {
  const rNorm = String(role ?? '').trim().toLowerCase();
  const gNorm = String(gender ?? '').trim().toLowerCase();
  const r = rNorm === 'teacher' ? 'teacher' : rNorm === 'student' ? 'student' : null;
  const g = gNorm === 'girl' ? 'girl' : gNorm === 'boy' ? 'boy' : null;
  if (userId == null || !r || !g) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ userId: Number(userId), role: r, gender: g })
    );
  } catch {
  }
}

export function clearBannerProfileCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

/** Обновить кэш баннера из объекта пользователя (после login / me / PUT). */
export function syncBannerProfileFromUser(u) {
  if (!u || u.user_id == null) return;
  persistBannerProfile(u.user_id, u.role, u.gender);
}

/**
 * @param {string | undefined} role — 'student' | 'teacher' | ...
 * @param {string | undefined} gender — 'boy' | 'girl' из профиля
 * @returns {string} абсолютный URL для <source src>
 */
export function getHomeBannerVideoSrc(role, gender) {
  const rNorm = String(role ?? '').trim().toLowerCase();
  const r = rNorm === 'teacher' ? 'teacher' : 'student';
  const gNorm = String(gender ?? '').trim().toLowerCase();
  const g = gNorm === 'girl' ? 'girl' : 'boy';
  const path = BY_KEY[`${r}:${g}`] || DEFAULT_PATH;
  return base(path);
}

/**
 * Видео баннера: при совпадении user_id кэш (роль/пол с онбординга) имеет приоритет,
 * чтобы не показывать student-boy при устаревшем объекте user без лишних запросов /api.
 */
export function resolveHomeBannerVideoSrc(user) {
  if (user?.user_id == null) {
    return getHomeBannerVideoSrc(user?.role, user?.gender);
  }
  const cached = readBannerProfileCache();
  if (cached && Number(cached.userId) === Number(user.user_id)) {
    return getHomeBannerVideoSrc(cached.role, cached.gender);
  }
  return getHomeBannerVideoSrc(user.role, user.gender);
}
