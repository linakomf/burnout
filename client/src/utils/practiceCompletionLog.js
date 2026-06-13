import { format, isWithinInterval, startOfDay } from 'date-fns';

const LOG_KEY = 'burnout_practices_done_v1';

function readLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeLog(obj) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(obj));
  } catch {
    
  }
}


export function logPracticeCompleted(practiceId = 'practice') {
  const dateKey = format(new Date(), 'yyyy-MM-dd');
  const log = readLog();
  const list = Array.isArray(log[dateKey]) ? log[dateKey] : [];
  list.push({ id: String(practiceId), at: new Date().toISOString() });
  log[dateKey] = list;
  writeLog(log);
}

export function countPracticesInRange(start, end) {
  const log = readLog();
  let count = 0;
  Object.entries(log).forEach(([dateKey, entries]) => {
    const d = startOfDay(new Date(`${dateKey}T12:00:00`));
    if (!isWithinInterval(d, { start, end })) return;
    count += Array.isArray(entries) ? entries.length : 0;
  });
  return count;
}

export function practiceDatesInRange(start, end) {
  const log = readLog();
  const set = new Set();
  Object.keys(log).forEach((dateKey) => {
    const d = startOfDay(new Date(`${dateKey}T12:00:00`));
    if (isWithinInterval(d, { start, end }) && Array.isArray(log[dateKey]) && log[dateKey].length) {
      set.add(dateKey);
    }
  });
  return set;
}
