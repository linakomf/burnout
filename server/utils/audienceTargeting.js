

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


function isStrictCatalogAudience() {
  const v = String(process.env.CATALOG_STRICT_AUDIENCE || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}



function appendAudienceFilter(user, alias = '', paramStart = 1) {
  if (!isStrictCatalogAudience()) {
    return { sql: '', params: [], nextIndex: paramStart };
  }

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
    parts.push(
      `(COALESCE(${p}target_role, 'all') = 'all' OR ${p}target_role = $${idx})`
    );
    idx += 1;
  }

  const genderTag = userGenderTag(user);
  if (genderTag) {
    params.push(genderTag);
    parts.push(
      `(COALESCE(${p}target_gender, 'all') = 'all' OR ${p}target_gender = $${idx})`
    );
    idx += 1;
  }

  return {
    sql: parts.length ? ` AND ${parts.join(' AND ')}` : '',
    params,
    nextIndex: idx,
  };
}

function appendTestAudienceFilter(user, testAlias = 't', catAlias = 'c', paramStart = 1) {
  if (!isStrictCatalogAudience()) {
    return { sql: '', params: [], nextIndex: paramStart };
  }

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
      `((COALESCE(${c}target_role, 'all') = 'all' OR ${c}target_role = $${n}) AND (COALESCE(${t}target_role, 'all') = 'all' OR ${t}target_role = $${n}))`
    );
    idx += 1;
  }

  const genderTag = userGenderTag(user);
  if (genderTag) {
    params.push(genderTag);
    const n = idx;
    parts.push(
      `((COALESCE(${c}target_gender, 'all') = 'all' OR ${c}target_gender = $${n}) AND (COALESCE(${t}target_gender, 'all') = 'all' OR ${t}target_gender = $${n}))`
    );
    idx += 1;
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
