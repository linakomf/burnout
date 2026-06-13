export const SPACE_ONBOARDING_QUESTIONS = [
  {
    id: 'contentPreferences',
    title: 'Что обычно помогает вам немного выдохнуть?',
    options: [
      { label: 'Музыка', tag: 'music' },
      { label: 'Фильмы или сериалы', tag: 'movies' },
      { label: 'Медитации и тишина', tag: 'meditation' },
      { label: 'Книги и статьи', tag: 'reading' },
      { label: 'Подкасты', tag: 'podcasts' },
      { label: 'События и прогулки', tag: 'events' },
    ],
  },
  {
    id: 'formatPreferences',
    title: 'Какой формат вам сейчас ближе?',
    options: [
      { label: 'Что-то короткое и лёгкое', tag: 'short' },
      { label: 'Спокойное и медленное', tag: 'calm' },
      { label: 'Что-то вдохновляющее', tag: 'inspiration' },
      { label: 'Хочу полностью отвлечься', tag: 'distraction' },
      { label: 'Что-то уютное', tag: 'cozy' },
    ],
  },
  {
    id: 'emotionalNeeds',
    title: 'Что вам сейчас нужно больше всего?',
    options: [
      { label: 'Отдых', tag: 'rest' },
      { label: 'Спокойствие', tag: 'peace' },
      { label: 'Поддержка', tag: 'support' },
      { label: 'Концентрация', tag: 'focus' },
      { label: 'Мотивация', tag: 'motivation' },
      { label: 'Эмоциональная разгрузка', tag: 'emotional-release' },
    ],
  },
  {
    id: 'difficulties',
    title: 'Что вам обычно сложнее всего?',
    options: [
      { label: 'Перестать тревожиться', tag: 'anxiety' },
      { label: 'Найти силы', tag: 'low-energy' },
      { label: 'Сконцентрироваться', tag: 'focus-problems' },
      { label: 'Отдохнуть без чувства вины', tag: 'rest-guilt' },
      { label: 'Переключиться от мыслей', tag: 'overthinking' },
    ],
  },
  {
    id: 'atmospherePreferences',
    title: 'Какая атмосфера вам ближе?',
    options: [
      { label: 'Тёплая и уютная', tag: 'warm' },
      { label: 'Спокойная и минималистичная', tag: 'minimal' },
      { label: 'Вдохновляющая', tag: 'inspiring' },
      { label: 'Лёгкая и весёлая', tag: 'light' },
      { label: 'Эстетичная и красивая', tag: 'aesthetic' },
    ],
  },
];

const TAG_LABELS = new Map();
SPACE_ONBOARDING_QUESTIONS.forEach((q) => {
  q.options.forEach((opt) => TAG_LABELS.set(opt.tag, opt.label));
});

export function spaceOnboardingTagLabel(tag) {
  return TAG_LABELS.get(tag) || tag;
}

export function normalizeAnswerList(raw) {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === 'string' && t);
  if (raw && typeof raw === 'string') return [raw];
  return [];
}


export function spacePreferencesToAnswers(prefs) {
  if (!prefs || typeof prefs !== 'object') return {};
  const out = {};
  SPACE_ONBOARDING_QUESTIONS.forEach((q) => {
    out[q.id] = normalizeAnswerList(prefs[q.id]);
  });
  return out;
}


export function buildSpacePreferencesPayload(answers) {
  const out = {
    contentPreferences: [],
    formatPreferences: [],
    emotionalNeeds: [],
    difficulties: [],
    atmospherePreferences: [],
    completedAt: new Date().toISOString(),
  };
  SPACE_ONBOARDING_QUESTIONS.forEach((q) => {
    out[q.id] = normalizeAnswerList(answers[q.id]);
  });
  return out;
}

export function hasAnySpacePreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') return false;
  return SPACE_ONBOARDING_QUESTIONS.some((q) => normalizeAnswerList(prefs[q.id]).length > 0);
}
