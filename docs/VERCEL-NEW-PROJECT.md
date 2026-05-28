# Настройка нового проекта Vercel (burnout-1)

Продакшен: **https://burnout-1.vercel.app**

Preview-URL (`burnout-1-….vercel.app`) может требовать вход в Vercel — для проверки API используйте **продакшен-домен** выше.

---

## 1. Подключение репозитория

| Настройка | Значение |
|-----------|----------|
| **Git Repository** | `linakomf/burnout` |
| **Production Branch** | `main` |
| **Root Directory** | *(пусто — корень репо)* |
| **Framework Preset** | Other (или Create React App) |

`vercel.json` в корне уже задаёт build и API.

---

## 2. Environment Variables (обязательно)

**Vercel → Project burnout-1 → Settings → Environment Variables**

Добавьте для **Production** (и при желании Preview / Development):

### `DATABASE_URL` (обязательно)

Строка подключения **облачного** PostgreSQL (Neon, Supabase).  
Локальный `localhost` на Vercel **не работает**.

**Neon:**

1. [console.neon.tech](https://console.neon.tech) → ваш проект → **Connect**
2. Скопируйте **Connection string** (режим *Pooled* или *Direct*)
3. Пример вида:  
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`

Вставьте в Vercel как `DATABASE_URL` **без пробелов** в начале/конце.

### `JWT_SECRET` (обязательно)

Любая длинная случайная строка, например сгенерированная:

```text
openssl rand -base64 32
```

У вас уже может быть задан — health показывает `"jwt":"configured"`.

### Рекомендуется

| Переменная | Пример | Зачем |
|------------|--------|--------|
| `PUBLIC_APP_URL` | `https://burnout-1.vercel.app` | Ссылки в письмах психологам |
| `NODE_ENV` | `production` | Обычно Vercel ставит сам |

### Не добавляйте на Vercel

- `REACT_APP_API_ORIGIN` — не нужен, API на том же домене (`/api/...`)

---

## 3. Redeploy

После сохранения переменных:

**Deployments → последний деплой → ⋮ → Redeploy**  
(лучше **без** кэша: *Use existing Build Cache: Off*).

---

## 4. Проверка

Откройте в браузере:

```
https://burnout-1.vercel.app/api/health
```

Ожидается:

```json
{
  "status": "OK",
  "database": "connected",
  "jwt": "configured"
}
```

Если `"database":"missing"` — `DATABASE_URL` не задан или не применён Redeploy.  
Если `"database":"error"` — неверный URL или БД недоступна (проверьте Neon, `sslmode=require`).

---

## 5. Данные с прошлого деплоя

Если раньше использовали Neon для `burnout-lswd` — подставьте **ту же** `DATABASE_URL`, чтобы сохранить фильмы, пользователей и т.д.

Если новая пустая БД — после первого деплоя зайдите в приложение как админ или добавьте контент через админку (схема создаётся при первом запросе к API).

---

## 6. Deployment Protection (preview)

Если preview-ссылки просят «Vercel Authentication»:

**Settings → Deployment Protection** → для Production оставьте как нужно; для тестов API используйте **burnout-1.vercel.app**, не preview-URL.

---

## 7. Автодеплой после git push

**Settings → Git** — репозиторий подключён.

Опционально: **Deploy Hooks** + секрет `VERCEL_DEPLOY_HOOK` в GitHub (см. README).
