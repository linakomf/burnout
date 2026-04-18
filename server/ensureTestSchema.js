const pool = require('./db');

/** Колонка scoring_type нужна для подсчёта; в старых БД её могло не быть */
async function ensureTestSchema() {
  try {
    await pool.query(`
      ALTER TABLE tests ADD COLUMN IF NOT EXISTS scoring_type VARCHAR(40) DEFAULT 'likert_sum';
    `);
    console.log('✅ tests.scoring_type готов');
  } catch (err) {
    console.warn('⚠️ ensureTestSchema:', err.message);
  }
}

module.exports = { ensureTestSchema };
