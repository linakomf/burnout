-- ============================================
-- BURNOUT DETECTION APP - DATABASE SCHEMA
-- ============================================

CREATE DATABASE IF NOT EXISTS burnout_db;
\c burnout_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    age INT,
    email VARCHAR(45) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(45) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin table
CREATE TABLE IF NOT EXISTS admin (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    email VARCHAR(45) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(45) NOT NULL,
    description VARCHAR(255),
    target_role VARCHAR(45) DEFAULT 'all' CHECK (target_role IN ('student', 'teacher', 'all'))
);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
    test_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    category_id INT REFERENCES categories(category_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    question_id SERIAL PRIMARY KEY,
    test_id INT REFERENCES tests(test_id) ON DELETE CASCADE,
    question_text VARCHAR(255) NOT NULL,
    options JSONB,
    order_num INT DEFAULT 0
);

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
    result_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    test_id INT REFERENCES tests(test_id) ON DELETE CASCADE,
    score INT NOT NULL,
    level VARCHAR(45),
    answers JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diary Entries table
CREATE TABLE IF NOT EXISTS diary_entries (
    entry_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    mood VARCHAR(45),
    mood_score INT DEFAULT 5 CHECK (mood_score BETWEEN 1 AND 10),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert categories
INSERT INTO categories (name, description, target_role) VALUES
('Базовые тесты', 'Общие тесты для всех пользователей', 'all'),
('Для студентов', 'Тесты на выгорание для студентов', 'student'),
('Для преподавателей', 'Тесты на профессиональное выгорание', 'teacher');

-- Insert tests
INSERT INTO tests (title, description, category_id) VALUES
('Тест на общий стресс (PSS)', 'Шкала воспринимаемого стресса — 10 вопросов для измерения уровня стресса за последний месяц', 1),
('MBI — Опросник выгорания Маслах (студенты)', 'Адаптированная версия для студентов: эмоциональное истощение, деперсонализация, эффективность', 2),
('Тест на академическую усталость', 'Оценка усталости от учебы и мотивации', 2),
('MBI — Профессиональное выгорание (преподаватели)', 'Классическая версия MBI для педагогов', 3),
('Тест на рабочую перегрузку', 'Оценка нагрузки и баланса работы и жизни', 3);

-- Insert questions for Test 1 (PSS - 10 questions)
INSERT INTO questions (test_id, question_text, options, order_num) VALUES
(1, 'За последний месяц как часто вас расстраивало что-то неожиданное?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 1),
(1, 'За последний месяц как часто вы чувствовали, что не можете контролировать важные вещи?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 2),
(1, 'Как часто вы чувствовали нервозность и стресс?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 3),
(1, 'Как часто вы успешно справлялись с раздражительными жизненными неприятностями?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 4),
(1, 'Как часто вы чувствовали, что эффективно справляетесь с важными изменениями?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 5),
(1, 'Как часто вы чувствовали уверенность в способности справиться с личными проблемами?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 6),
(1, 'Как часто вы чувствовали, что дела идут по вашему?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 7),
(1, 'Как часто вы чувствовали, что не можете справиться со всем?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 8),
(1, 'Как часто вы могли контролировать раздражение в жизни?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 9),
(1, 'Как часто вы чувствовали, что трудности накапливаются так высоко, что не можете их преодолеть?', '["Никогда","Почти никогда","Иногда","Довольно часто","Очень часто"]', 10);

-- Insert questions for Test 2 (MBI Students - 9 questions)
INSERT INTO questions (test_id, question_text, options, order_num) VALUES
(2, 'Я чувствую себя эмоционально истощённым от учёбы', '["Никогда","Редко","Иногда","Часто","Всегда"]', 1),
(2, 'К концу учебного дня я чувствую себя опустошённым', '["Никогда","Редко","Иногда","Часто","Всегда"]', 2),
(2, 'Я чувствую усталость, когда думаю о необходимости идти на занятия', '["Никогда","Редко","Иногда","Часто","Всегда"]', 3),
(2, 'Мне стало безразлично, успею ли я сдать задание в срок', '["Никогда","Редко","Иногда","Часто","Всегда"]', 4),
(2, 'Я сомневаюсь в важности учёбы', '["Никогда","Редко","Иногда","Часто","Всегда"]', 5),
(2, 'Я эффективно решаю учебные задачи', '["Никогда","Редко","Иногда","Часто","Всегда"]', 6),
(2, 'Я чувствую вдохновение от учёбы', '["Никогда","Редко","Иногда","Часто","Всегда"]', 7),
(2, 'Мне удаётся создавать спокойную атмосферу на занятиях', '["Никогда","Редко","Иногда","Часто","Всегда"]', 8),
(2, 'Я чувствую стимул и заряжен после выполнения заданий', '["Никогда","Редко","Иногда","Часто","Всегда"]', 9);

-- Default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Администратор', 'admin@burnout.kz', '$2b$10$rOzJqb5QfCkFkXvEJL7O4.8SZhHoR1qKJaFJCH1.fOL6HwEPFJeGe', 'admin');
