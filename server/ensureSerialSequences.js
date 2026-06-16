const pool = require('./db');

const SERIAL_TABLES = [
  ['users', 'user_id'],
  ['categories', 'category_id'],
  ['tests', 'test_id'],
  ['questions', 'question_id'],
  ['test_results', 'result_id'],
  ['diary_entries', 'entry_id'],
  ['user_notifications', 'notification_id'],
  ['psychologist_invitations', 'invitation_id'],
  ['psychologist_documents', 'document_id'],
  ['support_request_notes', 'note_id'],
  ['support_request_confirmations', 'confirmation_id'],
  ['support_requests', 'request_id'],
  ['practice_sessions', 'session_id'],
];

async function syncSerialSequence(table, col, schema = 'public') {
  const qualified = `${schema}.${table}`;
  await pool.query(
    `SELECT setval(
      pg_get_serial_sequence($1, $2),
      GREATEST(COALESCE((SELECT MAX(${col}) FROM ${qualified}), 0), 1)
    )`,
    [qualified, col]
  );
}

async function ensureSerialSequences() {
  for (const [table, col] of SERIAL_TABLES) {
    try {
      await syncSerialSequence(table, col);
    } catch (e) {
      console.warn(`ensureSerialSequences ${table}:`, e.message);
    }
  }
}

module.exports = { ensureSerialSequences, syncSerialSequence };
