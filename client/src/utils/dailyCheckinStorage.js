




const LOG_KEY = 'burnout_checkin_log_v1';
const LEGACY_KEY = 'burnout_daily_checkin_v1';

export const CHECKIN_MOOD_EMOJIS = ['😄', '🙂', '😐', '😔', '😥'];

function clampPct(n) {
  return Math.min(100, Math.max(0, Math.round(Number(n) || 0)));
}

function readLogOnly() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw);
    if (j && typeof j === 'object' && !Array.isArray(j)) return j;
  } catch {

  }
  return {};
}

function writeLog(obj) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(obj));
  } catch {

  }
}

function normalizeStoredDay(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const moodIndex =
  entry.moodIndex != null ?
  Math.min(4, Math.max(0, Number(entry.moodIndex))) :
  2;
  return {
    mood: clampPct(entry.mood),
    stress: clampPct(entry.stress),
    energy: clampPct(entry.energy),
    moodIndex,
    notes: typeof entry.notes === 'string' ? entry.notes : '',
    savedAt: typeof entry.savedAt === 'string' ? entry.savedAt : undefined
  };
}

function migrateLegacy() {
  try {
    const leg = localStorage.getItem(LEGACY_KEY);
    if (!leg) return;
    const p = JSON.parse(leg);
    if (!p || !p.date) {
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    const log = readLogOnly();
    if (!log[p.date]) {
      const n = normalizeStoredDay(p);
      if (n) {
        n.savedAt = n.savedAt || new Date().toISOString();
        log[p.date] = n;
        writeLog(log);
      }
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {

  }
}




export function getCheckinLog() {
  migrateLegacy();
  return readLogOnly();
}




export function getCheckinForDate(dateStr) {
  const log = getCheckinLog();
  const raw = log[dateStr];
  if (!raw) return null;
  return normalizeStoredDay(raw);
}





export function setCheckinForDate(dateStr, data) {
  const log = getCheckinLog();
  const n = normalizeStoredDay({ ...data, date: dateStr });
  if (!n) return;
  n.savedAt = new Date().toISOString();
  log[dateStr] = n;
  writeLog(log);
}




export function getCheckinsSortedDesc() {
  const log = getCheckinLog();
  return Object.entries(log).
  map(([date, entry]) => {
    const n = normalizeStoredDay(entry);
    if (!n) return null;
    return { date, ...n };
  }).
  filter(Boolean).
  sort((a, b) => b.date.localeCompare(a.date));
}

export function percentToOneToTen(pct) {
  const v = Math.round(Number(pct) / 10);
  return Math.min(10, Math.max(1, v));
}

export function emitCheckinSaved() {
  try {
    window.dispatchEvent(new CustomEvent('burnout-checkin-saved'));
  } catch {

  }
}