/**
 * Выбор test_id из доступного каталога по сигналам дашборда (стресс, настроение, энергия).
 * @param {object} p
 * @param {string} [p.role] - 'student' | 'teacher' | 'admin'
 * @param {number} p.stressVal
 * @param {number} p.moodVal
 * @param {number} p.energyVal
 * @param {number[]} p.catalogIds - id из GET /tests для текущего пользователя
 * @returns {number | null}
 */
export function pickRecommendedTestId({ role, stressVal, moodVal, energyVal, catalogIds }) {
  const ids = new Set((catalogIds || []).map((id) => Number(id)).filter(Number.isFinite));
  if (ids.size === 0) return null;

  const ok = (id) => ids.has(Number(id));
  const prefer = (list) => {
    for (const id of list) {
      const n = Number(id);
      if (Number.isFinite(n) && ok(n)) return n;
    }
    return null;
  };

  const isTeacher = role === 'teacher';
  const mbi = isTeacher ? 4 : 2;

  if (stressVal >= 68) {
    const hit = prefer([mbi, 5, 7, 6]);
    if (hit != null) return hit;
  }

  if (stressVal >= 52) {
    const hit = prefer(isTeacher ? [5, mbi, 7, 6] : [3, 5, mbi, 7, 6]);
    if (hit != null) return hit;
  }

  if (moodVal <= 38 && stressVal >= 45) {
    const hit = prefer([6, 7, 5, mbi]);
    if (hit != null) return hit;
  }

  if (moodVal <= 42 || energyVal <= 36) {
    const hit = prefer([7, 5, 6, isTeacher ? 4 : 2, 3]);
    if (hit != null) return hit;
  }

  return prefer([7, 5, 6, mbi, isTeacher ? 5 : 3]);
}
