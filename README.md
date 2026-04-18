# MindTrack — Руководство по запуску

## Структура проекта

```
burnout-app/
├── client/                  ← React фронтенд
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/      ← Sidebar + Layout
│   │   │   ├── Auth/        ← Login + Register
│   │   │   ├── Dashboard/   ← Главная + Статистика
│   │   │   ├── Tests/       ← Список тестов + Прохождение
│   │   │   ├── Profile/     ← Профиль пользователя
│   │   │   ├── Admin/       ← Админ панель
│   │   │   └── AI/          ← ИИ-чат виджет
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
├── server/                  ← Express.js бэкенд
│   ├── db/
│   │   ├── index.js         ← Подключение к PostgreSQL
│   │   └── schema.sql       ← SQL для создания БД
│   ├── middleware/
│   │   └── auth.js          ← JWT проверка
│   ├── routes/
│   │   ├── auth.js          ← Регистрация / Вход
│   │   ├── users.js         ← Профиль пользователя
│   │   ├── tests.js         ← Тесты
│   │   ├── diary.js         ← Дневник
│   │   └── categories.js    ← Категории
│   ├── uploads/             ← Папка для аватаров (создаётся автоматически)
│   ├── index.js             ← Точка входа сервера
│   ├── .env.example         ← Пример переменных окружения
│   └── package.json
│
├── package.json             ← Корневой (для запуска обоих сразу)
└── README.md
```

---

## ШАГ 1 — Установка PostgreSQL

1. Скачайте и установите PostgreSQL: https://www.postgresql.org/download/
2. Запомните пароль, который задаёте при установке — он понадобится
3. После установки откройте **pgAdmin** или **psql** в терминале

---

## ШАГ 2 — Создание базы данных

Откройте терминал (cmd / PowerShell / Terminal) и выполните:

```bash
# Войти в PostgreSQL
psql -U postgres

# Создать базу данных
CREATE DATABASE burnout_db;

# Выйти
\q
```

Затем применить схему:

```bash
psql -U postgres -d burnout_db -f server/db/schema.sql
```

Или откройте файл `server/db/schema.sql` в pgAdmin и выполните весь SQL.

---

## ШАГ 3 — Настройка переменных окружения

В папке `server/` создайте файл `.env` (скопируйте из `.env.example`):

```
PORT=5000
DATABASE_URL=postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/burnout_db
JWT_SECRET=придумайте_любую_длинную_строку_123456
```

**Замените `ВАШ_ПАРОЛЬ`** на пароль от PostgreSQL, который задали при установке.

---

## ШАГ 4 — Установка зависимостей

Откройте терминал в папке `burnout-app/` и выполните:

```bash
# Установить зависимости сервера
cd server
npm install

# Установить зависимости клиента
cd ../client
npm install
```

---

## ШАГ 5 — Запуск

### Способ 1 — Два терминала (рекомендуется для разработки)

**Терминал 1 — Сервер:**
```bash
cd burnout-app/server
npm run dev
```
Вы увидите:
```
🚀 Server running at http://localhost:5000
✅ Connected to PostgreSQL database
```

**Терминал 2 — Клиент:**
```bash
cd burnout-app/client
npm start
```
Браузер откроется автоматически на `http://localhost:3000`

### Способ 2 — Один терминал (нужен concurrently)

```bash
cd burnout-app
npm install
npm run dev
```

---

## ШАГ 6 — Первый вход

После запуска зайдите на `http://localhost:3000`

**Аккаунт администратора (уже создан в seed data):**
- Email: `admin@burnout.kz`
- Пароль: `admin123`

**Создайте аккаунт студента или преподавателя** через `/register`

---

## ШАГ 7 — Настройка ИИ-чата (опционально)

ИИ-чат использует Anthropic API. Чтобы он работал:

1. Зарегистрируйтесь на https://console.anthropic.com/
2. Создайте API ключ
3. Откройте файл `client/src/components/AI/AIChat.jsx`
4. Добавьте заголовок с ключом в fetch-запрос:

```javascript
headers: {
  'Content-Type': 'application/json',
  'x-api-key': 'ВАШ_ANTHROPIC_API_КЛЮЧ',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
},
```

> ⚠️ Для продакшена ключ нужно перенести на сервер (создать отдельный эндпоинт `/api/ai/chat`), чтобы не светить его в браузере.

---

## Возможные ошибки и решения

### ❌ "Cannot connect to database"
- Убедитесь что PostgreSQL запущен (в Windows — Services, в Mac — `brew services list`)
- Проверьте пароль в `.env` файле
- Убедитесь что база `burnout_db` создана

### ❌ "Port 5000 already in use"
- Измените PORT в `.env` на другой, например `5001`
- Обновите proxy в `client/package.json`: `"proxy": "http://localhost:5001"`

### ❌ "npm command not found"
- Установите Node.js: https://nodejs.org/ (версия 18+)

### ❌ Аватары не отображаются
- Убедитесь что папка `server/uploads/` существует (создаётся автоматически)
- Проверьте что в `client` запросы к `http://localhost:5000/uploads/` проходят

### ❌ Клиент не соединяется с сервером
- Убедитесь что сервер запущен на порту 5000
- В `client/package.json` строка `"proxy": "http://localhost:5000"` должна быть

---

## API Endpoints (краткая справка)

| Метод | URL | Описание |
|-------|-----|----------|
| POST | /api/auth/register | Регистрация |
| POST | /api/auth/login | Вход |
| GET | /api/users/me | Мой профиль |
| PUT | /api/users/me | Обновить профиль |
| GET | /api/tests | Список тестов |
| GET | /api/tests/:id | Тест с вопросами |
| POST | /api/tests/:id/submit | Сдать тест |
| GET | /api/tests/results/my | Мои результаты |
| GET | /api/diary | Мой дневник |
| POST | /api/diary | Новая запись |
| GET | /api/diary/mood-stats | Статистика настроения |
| GET | /api/categories | Категории тестов |
| GET | /api/users/all | Все пользователи (admin) |

---

## Технологии

| Слой | Технология |
|------|-----------|
| Фронтенд | React 18, React Router v6, Recharts |
| Стили | CSS Variables, Google Fonts (Nunito) |
| Бэкенд | Node.js, Express.js |
| База данных | PostgreSQL + pg (node-postgres) |
| Аутентификация | JWT (jsonwebtoken) + bcrypt |
| Файлы | Multer (загрузка аватаров) |
| ИИ | Anthropic Claude API |
