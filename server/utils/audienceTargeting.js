/** Кому показывать карточку: роль и пол (пол не показывается пользователям в UI). */

const TARGET_ROLES = new Set(['all', 'student', 'teacher']);
const TARGET_GENDERS = new Set(['all', 'female', 'male']);

function pickTargetRole(raw, fallback = 'all') {
  const v = String(raw ?? '').trim();
  return TARGET_ROLES.has(v) ? v : fallback;
}

function pickTargetGender(raw, fallback = 'all') {
  const v = String(raw ?? '').trim();
  return TARGET_GENDERS.has(v) ? v : fallback;
}

function userGenderTag(user) {
  const g = String(user?.gender || '').trim();
  if (g === 'girl') return 'female';
  if (g === 'boy') return 'male';
  return null;
}

function skipAudienceFilter(user) {
  return user?.role === 'admin';
}

/**
 * SQL-фрагмент AND … для фильтрации каталога.
 * @param {object|null} user — req.user (JWT); без пользователя — только universal.
 * @param {string} [alias] — префикс таблицы, напр. "f"
 * @param {number} [paramStart]
 */
function appendAudienceFilter(user, alias = '', paramStart = 1) {
  if (skipAudienceFilter(user)) {
    return { sql: '', params: [], nextIndex: paramStart };
  }

  const p = alias ? `${alias}.` : '';
  const params = [];
  let idx = paramStart;
  const parts = [];

  const role = user?.role;
  if (role === 'student' || role === 'teacher') {
    params.push(role);
    parts.push(`(${p}target_role = 'all' OR ${p}target_role = $${idx})`);
    idx += 1;
  } else {
    parts.push(`${p}target_role = 'all'`);
  }

  const genderTag = userGenderTag(user);
  if (genderTag) {
    params.push(genderTag);
    parts.push(`(${p}target_gender = 'all' OR ${p}target_gender = $${idx})`);
    idx += 1;
  } else {
    parts.push(`${p}target_gender = 'all'`);
  }

  return {
    sql: parts.length ? ` AND ${parts.join(' AND ')}` : '',
    params,
    nextIndex: idx,
  };
}

/** Фильтр тестов: категория + сам тест (оба условия). */
function appendTestAudienceFilter(user, testAlias = 't', catAlias = 'c', paramStart = 1) {
  if (skipAudienceFilter(user)) {
    return { sql: '', params: [], nextIndex: paramStart };
  }

  const t = testAlias ? `${testAlias}.` : '';
  const c = catAlias ? `${catAlias}.` : '';
  const params = [];
  let idx = paramStart;
  const parts = [];

  const role = user?.role;
  if (role === 'student' || role === 'teacher') {
    params.push(role);
    const n = idx;
    parts.push(
      `((${c}target_role = 'all' OR ${c}target_role = $${n}) AND (${t}target_role = 'all' OR ${t}target_role = $${n}))`
    );
    idx += 1;
  } else {
    parts.push(`${c}target_role = 'all' AND ${t}target_role = 'all'`);
  }

  const genderTag = userGenderTag(user);
  if (genderTag) {
    params.push(genderTag);
    const n = idx;
    parts.push(
      `((${c}target_gender = 'all' OR ${c}target_gender = $${n}) AND (${t}target_gender = 'all' OR ${t}target_gender = $${n}))`
    );
    idx += 1;
  } else {
    parts.push(`${c}target_gender = 'all' AND ${t}target_gender = 'all'`);
  }

  return {
    sql: parts.length ? ` AND ${parts.join(' AND ')}` : '',
    params,
    nextIndex: idx,
  };
}

module.exports = {
  TARGET_ROLES,
  TARGET_GENDERS,
  pickTargetRole,
  pickTargetGender,
  userGenderTag,
  skipAudienceFilter,
  appendAudienceFilter,
  appendTestAudienceFilter,
};
