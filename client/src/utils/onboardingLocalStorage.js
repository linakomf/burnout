const key = (userId) => `burnout_onb_${userId}`;

/** Локальный черновик, если API недоступен — потом синхронизируем */
export function savePendingOnboarding(userId, { percent, rawScore, answers }) {
  if (userId == null) return;
  try {
    localStorage.setItem(
      key(userId),
      JSON.stringify({ percent, rawScore, answers, savedAt: Date.now() })
    );
  } catch {
    /* quota / private mode */
  }
}

export function readPendingOnboarding(userId) {
  if (userId == null) return null;
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data.answers) || data.answers.length !== 10) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearPendingOnboarding(userId) {
  if (userId == null) return;
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* ignore */
  }
}
