const pool = require('../db');
const { computeTestResult } = require('../scoring');
const { bucketFromPercent, normalizeRiskLevel } = require('./burnoutRisk');
const { fetchConfirmationsByRequestIds } = require('./supportConfirmations');

const questionsCache = new Map();

async function getQuestions(testId) {
  if (questionsCache.has(testId)) return questionsCache.get(testId);
  const r = await pool.query(
    'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_num, question_id',
    [testId]
  );
  questionsCache.set(testId, r.rows);
  return r.rows;
}

async function buildCatalogBurnout(row) {
  if (!row.burn_result_id || !row.test_id) return null;
  try {
    const questions = await getQuestions(row.test_id);
    const testRow = { scoring_type: row.scoring_type };
    const answersObj =
      typeof row.answers === 'string' ? JSON.parse(row.answers || '{}') : row.answers || {};
    const computed = computeTestResult(testRow, questions, answersObj);
    const percent = computed.percentage != null ? Number(computed.percentage) : null;
    const riskLevel =
      normalizeRiskLevel(computed.level, row.scoring_type) ||
      normalizeRiskLevel(row.burn_level_stored, row.scoring_type) ||
      bucketFromPercent(percent, true);
    return {
      test_title: row.test_title,
      test_date: row.burn_test_at,
      level: riskLevel,
      percent,
      scoring_type: row.scoring_type
    };
  } catch (e) {
    return {
      test_title: row.test_title,
      test_date: row.burn_test_at,
      level: normalizeRiskLevel(row.burn_level_stored, row.scoring_type) || 'unknown',
      percent: null,
      scoring_type: row.scoring_type
    };
  }
}

function mapOnboarding(row) {
  const onboardingPercent =
    row.onboarding_burnout_percent != null ? Number(row.onboarding_burnout_percent) : null;
  const onboardingCompleted = Boolean(row.onboarding_burnout_completed);
  return {
    completed: onboardingCompleted,
    percent: onboardingPercent,
    completed_at: row.onboarding_burnout_completed_at,
    level: bucketFromPercent(onboardingPercent, onboardingCompleted)
  };
}

function mapSupportRowBase(row, catalogBurnout) {
  return {
    request_id: row.request_id,
    user_id: row.user_id,
    display_name: row.display_name,
    contact: row.contact,
    whatsapp: row.whatsapp ?? null,
    message: row.message,
    created_at: row.created_at,
    status: row.status || 'new',
    assigned_psychologist_id: row.assigned_psychologist_id ?? null,
    assigned_at: row.assigned_at ?? null,
    assigned_psychologist_name: row.assigned_psychologist_name ?? null,
    account_email: row.account_email,
    account_name: row.account_name,
    account_role: row.account_role,
    onboarding: mapOnboarding(row),
    catalog_burnout_test: catalogBurnout,
    confirmations: row.confirmations || []
  };
}

const SUPPORT_SELECT_CORE = `
  sr.request_id,
  sr.user_id,
  sr.display_name,
  sr.contact,
  sr.whatsapp,
  sr.message,
  sr.created_at,
  sr.status,
  sr.assigned_psychologist_id,
  sr.assigned_at,
  u.email AS account_email,
  u.name AS account_name,
  u.role AS account_role,
  u.onboarding_burnout_percent,
  u.onboarding_burnout_completed,
  u.onboarding_burnout_completed_at,
  psych.name AS assigned_psychologist_name,
  burn.result_id AS burn_result_id,
  burn.level AS burn_level_stored,
  burn.created_at AS burn_test_at,
  burn.test_title,
  burn.scoring_type,
  burn.answers,
  burn.test_id
`;

const SUPPORT_FROM_JOIN = `
  FROM support_requests sr
  INNER JOIN users u ON u.user_id = sr.user_id
  LEFT JOIN users psych ON psych.user_id = sr.assigned_psychologist_id
  LEFT JOIN LATERAL (
    SELECT tr.result_id, tr.level, tr.created_at, tr.answers, tr.test_id,
      t.title AS test_title, t.scoring_type
    FROM test_results tr
    INNER JOIN tests t ON t.test_id = tr.test_id
    WHERE tr.user_id = sr.user_id
      AND (
        t.scoring_type IN ('mbi_student', 'daily5')
        OR (t.scoring_type = 'likert_sum' AND t.title ILIKE '%выгоран%')
      )
    ORDER BY tr.created_at DESC
    LIMIT 1
  ) burn ON true
`;

async function enrichSupportRows(dbRows) {
  const requestIds = dbRows.map((r) => r.request_id).filter(Boolean);
  const confirmationsMap = await fetchConfirmationsByRequestIds(requestIds);
  const rows = [];
  for (const row of dbRows) {
    const catalogBurnout = await buildCatalogBurnout(row);
    const withConfirmations = {
      ...row,
      confirmations: confirmationsMap.get(row.request_id) || []
    };
    rows.push(mapSupportRowBase(withConfirmations, catalogBurnout));
  }
  return rows;
}

async function fetchUserTestHistory(userId, limit = 8) {
  const r = await pool.query(
    `SELECT tr.result_id, tr.score, tr.level, tr.created_at, tr.answers,
            t.test_id, t.title AS test_title, t.scoring_type
     FROM test_results tr
     INNER JOIN tests t ON t.test_id = tr.test_id
     WHERE tr.user_id = $1
     ORDER BY tr.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  const out = [];
  for (const row of r.rows) {
    let percent = null;
    let level = normalizeRiskLevel(row.level, row.scoring_type) || 'unknown';
    try {
      const questions = await getQuestions(row.test_id);
      const answersObj =
        typeof row.answers === 'string' ? JSON.parse(row.answers || '{}') : row.answers || {};
      const computed = computeTestResult({ scoring_type: row.scoring_type }, questions, answersObj);
      percent = computed.percentage != null ? Number(computed.percentage) : null;
      level =
        normalizeRiskLevel(computed.level, row.scoring_type) ||
        normalizeRiskLevel(row.level, row.scoring_type) ||
        bucketFromPercent(percent, true);
    } catch {
      
    }
    out.push({
      result_id: row.result_id,
      test_title: row.test_title,
      scoring_type: row.scoring_type,
      score: row.score,
      level,
      percent,
      created_at: row.created_at
    });
  }
  return out;
}

async function fetchRecentCheckins(userId, limit = 5) {
  const r = await pool.query(
    `SELECT tr.result_id, tr.level, tr.created_at, tr.score, t.title AS test_title
     FROM test_results tr
     INNER JOIN tests t ON t.test_id = tr.test_id
     WHERE tr.user_id = $1 AND t.scoring_type = 'daily5'
     ORDER BY tr.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return r.rows.map((row) => ({
    result_id: row.result_id,
    test_title: row.test_title,
    level: normalizeRiskLevel(row.level, 'daily5') || 'unknown',
    score: row.score,
    created_at: row.created_at
  }));
}

module.exports = {
  SUPPORT_SELECT_CORE,
  SUPPORT_FROM_JOIN,
  enrichSupportRows,
  fetchUserTestHistory,
  fetchRecentCheckins,
  mapSupportRowBase,
  buildCatalogBurnout,
  mapOnboarding
};
