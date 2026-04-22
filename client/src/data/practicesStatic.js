export const PRACTICES_STATIC = [
{
  key: 'breath_478',
  title: 'Дыхание 4-7-8',
  description: 'Успокаивает нервную систему за 1–2 минуты.',
  category: 'breathing',
  durationMin: 2,
  gradient: 'linear-gradient(135deg, #e8c4b8 0%, #f0e6d8 50%, #d4e8d4 100%)'
},
{
  key: 'box_breathing',
  title: 'Квадратное дыхание',
  description: 'Равные фазы вдоха и выдоха — концентрация и ровный пульс.',
  category: 'breathing',
  durationMin: 3,
  gradient: 'linear-gradient(145deg, #c5d4b8 0%, #fdf6ee 100%)'
},
{
  key: 'meditation_body',
  title: 'Сканирование тела',
  description: 'Короткая медитация осознанности — 5 минут.',
  category: 'meditation',
  durationMin: 5,
  gradient: 'linear-gradient(160deg, #b8c5e8 0%, #f5f0ff 100%)'
},
{
  key: 'quick_reset',
  title: 'Быстрое восстановление',
  description: '90 секунд: плечи, взгляд, три медленных вдоха.',
  category: 'quick',
  durationMin: 2,
  gradient: 'linear-gradient(135deg, #f5d4a8 0%, #fff8f0 100%)'
},
{
  key: 'grounding_54321',
  title: 'Заземление 5-4-3-2-1',
  description: 'Снижает остроту тревоги через органы чувств.',
  category: 'quick',
  durationMin: 3,
  gradient: 'linear-gradient(135deg, #d4c4e8 0%, #faf5ff 100%)'
},
{
  key: 'affirm_calm',
  title: 'Аффирмации спокойствия',
  description: 'Короткие фразы поддержки — читайте вслух или про себя.',
  category: 'affirmations',
  durationMin: 2,
  gradient: 'linear-gradient(135deg, #fce8ec 0%, #fff 100%)'
},
{
  key: 'micro_break',
  title: 'Микропауза от экрана',
  description: '1 минута без устройств — взгляд вдаль и моргание.',
  category: 'quick',
  durationMin: 1,
  gradient: 'linear-gradient(135deg, #e0ebe4 0%, #fafcf8 100%)'
},
{
  key: 'calm_sound',
  title: 'Фоновая тишина + ритм',
  description: 'Таймер под спокойный ритм дыхания (без аудиофайла).',
  category: 'music',
  durationMin: 5,
  gradient: 'linear-gradient(135deg, #cfd8e8 0%, #f8fafc 100%)'
}];


export const CATEGORY_LABELS_STATIC = {
  all: 'Все',
  breathing: 'Дыхание',
  meditation: 'Медитация',
  affirmations: 'Аффирмации',
  music: 'Музыка',
  quick: 'Быстрое восстановление'
};

export function buildDefaultPracticesPayload() {
  return {
    practices: PRACTICES_STATIC.map((p) => ({ ...p, isFavorite: false })),
    categories: CATEGORY_LABELS_STATIC,
    stats: {
      available: PRACTICES_STATIC.length,
      favorites: 0,
      minutesTotal: 0
    },
    personalizedHint: null
  };
}

export function buildOfflinePracticesPayload() {
  return {
    ...buildDefaultPracticesPayload(),
    personalizedHint:
    'Не удалось загрузить данные с сервера. Показан локальный каталог — практики работают, статистика может не сохраняться.'
  };
}