const pool = require('./db');

/** После pg_dump INSERT с явными id последовательности отстают — ломает регистрацию. */
async function ensureSerialSequences() {
  const tables = [
    ['users', 'user_id'],
    ['categories', 'category_id'],
    ['tests', 'test_id'],
    ['questions', 'question_id'],
    ['test_results', 'result_id'],
    ['diary_entries', 'entry_id'],
    ['user_notifications', 'notification_id']
  ];

  for (const [table, col] of tables) {
    try {
      await pool.query(
        `SELECT setval(
          pg_get_serial_sequence($1, $2),
          GREATEST(COALESCE((SELECT MAX(${col}) FROM public.${table}), 0), 1)
        )`,
        [`public.${table}`, col]
      );
    } catch (e) {
      console.warn(`ensureSerialSequences ${table}:`, e.message);
    }
  }
}

module.exports = { ensureSerialSequences };
