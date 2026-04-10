-- Миграция: типы подсчёта, GAD-7, ежедневный тест, таблицы практик.
-- psql -U postgres -d burnout_db -f server/db/migration_v2_anxiety_practices.sql

ALTER TABLE tests ADD COLUMN IF NOT EXISTS scoring_type VARCHAR(40) DEFAULT 'likert_sum';

-- test_id=1 (PSS) в каталоге не используется
UPDATE tests SET scoring_type = 'mbi_student' WHERE test_id = 2;
UPDATE tests SET scoring_type = 'likert_sum' WHERE test_id IN (3, 4, 5);

INSERT INTO tests (title, description, category_id, scoring_type)
SELECT 'GAD-7: скрининг тревожности',
       'Семь вопросов за последние 2 недели. Логика GAD-7; не заменяет консультацию врача.',
       1,
       'gad7'
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE title = 'GAD-7: скрининг тревожности');

INSERT INTO questions (test_id, question_text, options, order_num)
SELECT t.test_id, v.qtext, v.opts::jsonb, v.ord
FROM tests t
CROSS JOIN (VALUES
  ('За последние 2 недели как часто вас беспокоило ощущение нервозности, тревоги или напряжённости?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 1),
  ('Как часто вам было трудно остановить беспокойство или контролировать его?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 2),
  ('Как часто вы слишком сильно беспокоились о разных вещах?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 3),
  ('Как часто вам было трудно расслабиться?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 4),
  ('Как часто вы были настолько беспокойны, что трудно усидеть на месте?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 5),
  ('Как часто вы легко раздражались или злились?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 6),
  ('Как часто вам казалось, что может случиться что-то плохое?',
   '["Ни разу","Несколько дней","Более половины дней","Почти каждый день"]', 7)
) AS v(qtext, opts, ord)
WHERE t.title = 'GAD-7: скрининг тревожности'
  AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.test_id = t.test_id);

INSERT INTO tests (title, description, category_id, scoring_type)
SELECT 'Ежедневный чек-ин (5 вопросов)',
       'Быстрая самооценка за сегодня — для регулярной динамики в аналитике.',
       1,
       'daily5'
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE title = 'Ежедневный чек-ин (5 вопросов)');

INSERT INTO questions (test_id, question_text, options, order_num)
SELECT t.test_id, v.qtext, v.opts::jsonb, v.ord
FROM tests t
CROSS JOIN (VALUES
  ('Насколько вы сейчас устали (физически и эмоционально)?',
   '["Совсем нет","Слегка","Умеренно","Сильно","Очень сильно"]', 1),
  ('Насколько сложно сосредоточиться на задачах?',
   '["Совсем нет","Слегка","Умеренно","Сильно","Очень сильно"]', 2),
  ('Насколько вы чувствуете тревогу или напряжение?',
   '["Совсем нет","Слегка","Умеренно","Сильно","Очень сильно"]', 3),
  ('Насколько вы откладываете дела или избегаете их?',
   '["Совсем нет","Слегка","Умеренно","Сильно","Очень сильно"]', 4),
  ('Насколько день ощущается тяжёлым или неприятным?',
   '["Совсем легко","Скорее легко","Средне","Скорее тяжело","Очень тяжело"]', 5)
) AS v(qtext, opts, ord)
WHERE t.title = 'Ежедневный чек-ин (5 вопросов)'
  AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.test_id = t.test_id);

CREATE TABLE IF NOT EXISTS practice_sessions (
  session_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
  practice_key VARCHAR(64) NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS practice_favorites (
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  practice_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, practice_key)
);
