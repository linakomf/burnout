function dbErrorToMessage(err) {
  if (!err) return null;
  const code = String(err.code || '').toUpperCase();
  const raw = String(err.message || '');

  if (code === '28P01') {
    return 'Ошибка подключения к PostgreSQL: неверный пароль в DATABASE_URL (server/.env). Замените yourpassword на реальный пароль пользователя postgres.';
  }
  if (code === '3D000') {
    return 'База данных burnout_db не найдена. Создайте её в PostgreSQL и повторите запуск сервера.';
  }
  if (code === '3F000' || /no schema has been selected to create in/i.test(raw)) {
    return 'PostgreSQL не видит схему public. Проверьте DATABASE_URL в Vercel (роль-владелец БД в Neon) и перезапустите деплой.';
  }
  if (code === '42501' && /schema public/i.test(raw)) {
    return 'У роли из DATABASE_URL нет прав CREATE на схему public. В Neon SQL Editor выполните: GRANT USAGE, CREATE ON SCHEMA public TO ваш_пользователь;';
  }
  if (code === 'ECONNREFUSED' || /ECONNREFUSED/i.test(raw)) {
    return 'PostgreSQL недоступен. Убедитесь, что служба PostgreSQL запущена и DATABASE_URL в server/.env указывает на правильный хост/порт.';
  }
  if (code === 'ENOTFOUND' || /ENOTFOUND/i.test(raw)) {
    return 'Не удалось найти хост PostgreSQL из DATABASE_URL. Проверьте host в server/.env.';
  }
  return null;
}

module.exports = { dbErrorToMessage };