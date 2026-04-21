const pool = require('./db');

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
