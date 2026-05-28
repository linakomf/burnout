# Переменные для Vercel (burnout-1) — вставить вручную

Vercel → **burnout-1** → **Settings** → **Environment Variables** → **Add**

Скопируйте из `server/.env` (файл не в git) или из Neon Console.

| Key | Environments |
|-----|----------------|
| `DATABASE_URL` | Production, Preview, Development |
| `JWT_SECRET` | Production, Preview, Development |
| `PUBLIC_APP_URL` | Production → `https://burnout-1.vercel.app` |

После сохранения: **Deployments → Redeploy**.

Проверка: https://burnout-1.vercel.app/api/health → `"database":"connected"`

**Безопасность:** не коммитьте `DATABASE_URL` в GitHub. Если строка попала в чат — смените пароль в Neon.
