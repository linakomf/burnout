# Burnout / MindTrack

## Деплой на Vercel (важно)

**Текущий прод:** https://burnout-1.vercel.app  

Пошаговая настройка нового проекта: [docs/VERCEL-NEW-PROJECT.md](docs/VERCEL-NEW-PROJECT.md)

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

После `git push` в `main` Vercel обычно деплоит автоматически (1–3 мин).

### Репозиторий обновился, а Vercel — нет

Чаще всего **проект не привязан к GitHub** (деплой был только вручную) или привязан **другой репозиторий/ветка**.

**Проверка:** откройте `/api/health` на сайте. Если в ответе `"database":"configured"` — это **старый** деплой. После актуального деплоя будет `"database":"connected"`.

**Исправление (по порядку):**

1. **Vercel → Project `burnout-1` → Settings → Git**
   - Repository: `linakomf/burnout`
   - Production Branch: **`main`**
   - Если Git не подключён — **Connect Git Repository**.

2. **Settings → General → Root Directory** — **пусто** (корень репо), не `client`.

3. **Deployments** — последний деплой:
   - **Failed** → откройте лог Build и исправьте ошибку.
   - Нет новых деплоев после push → шаг 1 или Deploy Hook ниже.

4. **Ручной деплой:** Deployments → ⋮ у последнего → **Redeploy** → включите **Use existing Build Cache: Off**.

5. **Deploy Hook (автоматически после каждого push):**
   - Vercel → Settings → **Deploy Hooks** → Create → branch `main` → скопируйте URL.
   - GitHub → repo **Settings → Secrets → Actions** → `VERCEL_DEPLOY_HOOK` = этот URL.
   - Workflow `.github/workflows/vercel-deploy.yml` вызовет hook после каждого push в `main`.

## Локальная разработка

```bash
npm run install:all
# server/.env: DATABASE_URL, JWT_SECRET
npm run dev
```

Фронт: http://localhost:3000 · API: http://127.0.0.1:5000
