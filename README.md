# Burnout / MindTrack

## Деплой на Vercel (важно)

**Root Directory в настройках проекта Vercel должен быть пустым (корень репозитория), НЕ `client`.**

Иначе `/api/*` отдаёт HTML вместо JSON и появляется ошибка «API не отвечает».

### Переменные окружения (Production)

| Переменная | Обязательно |
|------------|-------------|
| `DATABASE_URL` | Да — Neon/Supabase (`postgresql://...?sslmode=require`) |
| `JWT_SECRET` | Да — длинная случайная строка |

**Не задавайте** `REACT_APP_API_ORIGIN` на Vercel, если фронт и API на одном домене.

После изменения переменных: **Deployments → Redeploy** (полный).

### Проверка

Откройте: `https://ВАШ-ПРОЕКТ.vercel.app/api/health`

Ожидается: `"database":"connected"`, `"jwt":"configured"`.

## Локальная разработка

```bash
npm run install:all
# server/.env: DATABASE_URL, JWT_SECRET
npm run dev
```

Фронт: http://localhost:3000 · API: http://127.0.0.1:5000
