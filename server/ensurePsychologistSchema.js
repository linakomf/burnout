const pool = require('./db');

const USER_ROLES = "('student', 'teacher', 'admin', 'psychologist')";

async function widenUsersRoleCheck() {
  const names = await pool.query(`
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'users' AND c.contype = 'c'
  `);
  for (const row of names.rows) {
    const cn = row.conname;
    if (/role/i.test(cn)) {
      try {
        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${cn}"`);
      } catch (e) {
        console.warn('drop role constraint', cn, e.message);
      }
    }
  }
  try {
    await pool.query(`
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ${USER_ROLES});
    `);
  } catch (e) {
    if (!/already exists/i.test(e.message)) {
      console.warn('users_role_check:', e.message);
    }
  }
}

async function ensurePsychologistSchema() {
  await widenUsersRoleCheck();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS psychologist_profiles (
      user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      account_status VARCHAR(32) NOT NULL DEFAULT 'pending_review'
        CHECK (account_status IN ('pending_review', 'approved', 'rejected', 'blocked')),
      organization VARCHAR(200),
      specialist_level VARCHAR(120),
      work_phone VARCHAR(40),
      whatsapp VARCHAR(40),
      education TEXT,
      specialization VARCHAR(200),
      experience_years INT,
      bio TEXT,
      invited_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      invitation_id INT,
      reviewed_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      review_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS psychologist_invitations (
      invitation_id SERIAL PRIMARY KEY,
      token VARCHAR(128) UNIQUE NOT NULL,
      email VARCHAR(254) NOT NULL,
      invite_name VARCHAR(120) NOT NULL,
      work_phone VARCHAR(40),
      organization VARCHAR(200),
      specialist_level VARCHAR(120),
      invited_by INT REFERENCES users(user_id) ON DELETE SET NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      used_by_user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_psych_invitations_token ON psychologist_invitations (token);
    CREATE INDEX IF NOT EXISTS idx_psych_invitations_email ON psychologist_invitations (LOWER(email));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS psychologist_documents (
      document_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      original_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_psych_documents_user ON psychologist_documents (user_id);
  `);

  await pool.query(`
    ALTER TABLE support_requests
      ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'new';
  `);
  await pool.query(`
    ALTER TABLE support_requests
      ADD COLUMN IF NOT EXISTS assigned_psychologist_id INT REFERENCES users(user_id) ON DELETE SET NULL;
  `);
  await pool.query(`
    ALTER TABLE support_requests
      ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
  `);
  await pool.query(`
    ALTER TABLE support_requests
      ADD COLUMN IF NOT EXISTS assigned_by INT REFERENCES users(user_id) ON DELETE SET NULL;
  `);

  try {
    await pool.query(`
      ALTER TABLE support_requests DROP CONSTRAINT IF EXISTS support_requests_status_check;
    `);
    await pool.query(`
      ALTER TABLE support_requests ADD CONSTRAINT support_requests_status_check
        CHECK (status IN ('new', 'contacted', 'online_consultation', 'in_progress', 'completed'));
    `);
  } catch (e) {
    console.warn('support_requests status check:', e.message);
  }

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_support_requests_psychologist
      ON support_requests (assigned_psychologist_id, created_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_support_requests_status
      ON support_requests (status);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_request_notes (
      note_id SERIAL PRIMARY KEY,
      request_id INT NOT NULL REFERENCES support_requests(request_id) ON DELETE CASCADE,
      psychologist_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_support_request_notes_request
      ON support_request_notes (request_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_request_confirmations (
      confirmation_id SERIAL PRIMARY KEY,
      request_id INT NOT NULL REFERENCES support_requests(request_id) ON DELETE CASCADE,
      milestone VARCHAR(40) NOT NULL,
      psychologist_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      user_confirmed BOOLEAN,
      notification_id INT REFERENCES user_notifications(notification_id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP,
      UNIQUE (request_id, milestone)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_support_confirmations_request
      ON support_request_confirmations (request_id, created_at DESC);
  `);

  const { syncSerialSequence } = require('./ensureSerialSequences');
  for (const [table, col] of [
    ['psychologist_invitations', 'invitation_id'],
    ['psychologist_documents', 'document_id'],
    ['support_request_notes', 'note_id'],
    ['support_request_confirmations', 'confirmation_id'],
  ]) {
    try {
      await syncSerialSequence(table, col);
    } catch (e) {
      console.warn(`ensurePsychologistSchema sequence ${table}:`, e.message);
    }
  }

  console.log('✅ Схема психологов и расширенные обращения готовы');
}

module.exports = { ensurePsychologistSchema };
