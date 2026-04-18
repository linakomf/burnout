const pool = require('./db');

/**
 * Создаёт колонки онбординга; вызывать перед UPDATE, чтобы не падать, если стартовая миграция не отработала.
 */
async function runOnboardingMigration() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_burnout_completed BOOLEAN DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_burnout_percent INT;
  `);
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_burnout_completed_at TIMESTAMP;
  `);
}

/** При старте сервера — мягко, с логом */
async function ensureOnboardingSchema() {
  try {
    await runOnboardingMigration();
    await pool.query(`
      UPDATE users SET onboarding_burnout_completed = TRUE WHERE role = 'admin';
    `);
    console.log('✅ onboarding_burnout columns готовы');
  } catch (err) {
    console.warn('⚠️ ensureOnboardingSchema:', err.message);
  }
}

module.exports = { ensureOnboardingSchema, runOnboardingMigration };
