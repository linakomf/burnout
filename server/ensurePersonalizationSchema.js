const pool = require('./db');

async function runPersonalizationMigration() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_personalization_json JSONB DEFAULT NULL;
  `);
}

async function ensurePersonalizationSchema() {
  try {
    await runPersonalizationMigration();
    console.log('✅ daily_personalization_json готов');
  } catch (err) {
    console.warn('⚠️ ensurePersonalizationSchema:', err.message);
  }
}

module.exports = { ensurePersonalizationSchema, runPersonalizationMigration };
