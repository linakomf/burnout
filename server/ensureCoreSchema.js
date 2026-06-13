const pool = require('./db');



async function ensureCoreSchema() {
  await pool.query('CREATE SCHEMA IF NOT EXISTS public');
  try {
    await pool.query('GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER');
  } catch (e) {
    console.warn('ensureCoreSchema grant public:', e.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      user_id SERIAL PRIMARY KEY,
      name VARCHAR(45) NOT NULL,
      age INT,
      email VARCHAR(45) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(45) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await pool.query(`ALTER TABLE public.users ALTER COLUMN email TYPE VARCHAR(254)`);
    await pool.query(`ALTER TABLE public.users ALTER COLUMN name TYPE VARCHAR(120)`);
  } catch (e) {
    console.warn('ensureCoreSchema widen users columns:', e.message);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.categories (
      category_id SERIAL PRIMARY KEY,
      name VARCHAR(45) NOT NULL,
      description VARCHAR(255),
      target_role VARCHAR(45) DEFAULT 'all' CHECK (target_role IN ('student', 'teacher', 'all'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.tests (
      test_id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      category_id INT REFERENCES public.categories(category_id) ON DELETE SET NULL,
      scoring_type VARCHAR(40) DEFAULT 'likert_sum',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.questions (
      question_id SERIAL PRIMARY KEY,
      test_id INT REFERENCES public.tests(test_id) ON DELETE CASCADE,
      question_text VARCHAR(255) NOT NULL,
      options JSONB,
      order_num INT DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.test_results (
      result_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE,
      test_id INT REFERENCES public.tests(test_id) ON DELETE CASCADE,
      score INT NOT NULL,
      level VARCHAR(45),
      answers JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.diary_entries (
      entry_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE,
      mood VARCHAR(45),
      mood_score INT DEFAULT 5 CHECK (mood_score BETWEEN 1 AND 10),
      note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.user_notifications (
      notification_id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
      type VARCHAR(80) NOT NULL DEFAULT 'system',
      title VARCHAR(200) NOT NULL,
      body TEXT NOT NULL,
      payload JSONB,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created
      ON public.user_notifications (user_id, created_at DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread
      ON public.user_notifications (user_id, is_read, created_at DESC);
  `);

  const catCheck = await pool.query('SELECT COUNT(*)::int AS c FROM public.categories');
  if (catCheck.rows[0].c === 0) {
    await pool.query(`
      INSERT INTO public.categories (name, description, target_role) VALUES
      ('Базовые тесты', 'Общие тесты для всех пользователей', 'all'),
      ('Для студентов', 'Тесты на выгорание для студентов', 'student'),
      ('Для преподавателей', 'Тесты на профессиональное выгорание', 'teacher');
    `);
  }

  console.log('✅ Базовые таблицы и категории готовы');
}

module.exports = { ensureCoreSchema };
