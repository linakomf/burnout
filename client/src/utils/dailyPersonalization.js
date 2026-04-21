import {
  Wind,
  Brain,
  Sparkles,
  Activity,
  Music,
  Palette,
  Users,
  Trees,
  ListChecks,
} from 'lucide-react';

/** Варианты мини-теста на странице персонализации */
export const PERSONALIZATION_OPTIONS = [
  { id: 'breathing', label: 'Дыхание и телесные практики', hint: 'медленный вдох, расслабление плеч', Icon: Wind },
  { id: 'movement', label: 'Движение и прогулки', hint: 'лёгкая нагрузка без перегруза', Icon: Activity },
  { id: 'quiet', label: 'Тишина и медитация', hint: 'без экрана, мягкое присутствие', Icon: Brain },
  { id: 'music', label: 'Музыка и звук', hint: 'плейлист, ритм, голос', Icon: Music },
  { id: 'creative', label: 'Творчество', hint: 'рисунок, текст, руками', Icon: Palette },
  { id: 'social', label: 'Тёплое общение', hint: 'близкий человек, не переписка', Icon: Users },
  { id: 'nature', label: 'Природа и воздух', hint: 'окно, двор, парк', Icon: Trees },
  { id: 'structure', label: 'Порядок и малые шаги', hint: 'список из 2–3 пунктов', Icon: ListChecks },
];

const ACTIVITY_BY_LIKE = {
  breathing: [{ icon: '🌬️', label: 'Дыхательная пауза', time: '5 мин' }],
  movement: [{ icon: '🚶', label: 'Короткая прогулка', time: '20 мин' }],
  quiet: [{ icon: '🧘', label: 'Тишина без экрана', time: '10 мин' }],
  music: [{ icon: '🎵', label: 'Спокойный плейлист', time: '15 мин' }],
  creative: [{ icon: '🎨', label: 'Творчество без цели', time: '20 мин' }],
  social: [{ icon: '💬', label: 'Тёплый контакт', time: '15 мин' }],
  nature: [{ icon: '🌿', label: 'Свежий воздух', time: '15 мин' }],
  structure: [{ icon: '✓', label: 'Микро-план дня', time: '10 мин' }],
};

const DEFAULT_ACTIVITIES_HIGH = [
  { icon: '🧘', label: 'Медитация', time: '15 мин' },
  { icon: '🚶', label: 'Прогулка', time: '30 мин' },
  { icon: '😴', label: 'Отдых', time: '20 мин' },
];
const DEFAULT_ACTIVITIES_MID = [
  { icon: '🏃', label: 'Лёгкая активность', time: '20 мин' },
  { icon: '🎨', label: 'Хобби', time: '25 мин' },
  { icon: '🎵', label: 'Музыка', time: '20 мин' },
];
const DEFAULT_ACTIVITIES_LOW = [
  { icon: '🏋️', label: 'Движение', time: '30 мин' },
  { icon: '📚', label: 'Чтение', time: '25 мин' },
  { icon: '🎵', label: 'Музыка', time: '20 мин' },
];

function defaultActivitiesForStress(stressVal) {
  if (stressVal >= 70) return DEFAULT_ACTIVITIES_HIGH;
  if (stressVal >= 40) return DEFAULT_ACTIVITIES_MID;
  return DEFAULT_ACTIVITIES_LOW;
}

function pickActivitiesFromLikes(likes, stressVal) {
  const picked = [];
  const seen = new Set();
  for (const id of likes) {
    const pool = ACTIVITY_BY_LIKE[id];
    const first = pool?.[0];
    if (first && !seen.has(first.label)) {
      picked.push(first);
      seen.add(first.label);
    }
    if (picked.length >= 3) return picked;
  }
  for (const a of defaultActivitiesForStress(stressVal)) {
    if (picked.length >= 3) break;
    if (!seen.has(a.label)) {
      picked.push(a);
      seen.add(a.label);
    }
  }
  return picked.slice(0, 3);
}

/** Совет дня: текст по стрессу + активности из предпочтений или по умолчанию */
export function buildDailyTip(stressVal, likes) {
  let title;
  let text;
  if (stressVal >= 70) {
    title = 'Совет дня: позаботьтесь о себе';
    text =
      'Уровень стресса повышен. Сделайте паузу, выйдите на свежий воздух и уделите время дыхательным упражнениям.';
  } else if (stressVal >= 40) {
    title = 'Совет дня: поддержите баланс';
    text =
      'Включите любимую музыку и уделите несколько минут себе. Это поможет переключиться и немного расслабиться.';
  } else {
    title = 'Совет дня: отличное состояние!';
    text =
      'Вы в хорошей форме! Поддерживайте режим дня и не забывайте про регулярную физическую активность.';
  }

  const activities =
    likes && likes.length > 0 ? pickActivitiesFromLikes(likes, stressVal) : defaultActivitiesForStress(stressVal);

  return { title, text, activities };
}

const LIKE_TO_PRACTICE_KEYS = {
  breathing: ['breath_478', 'box_breathing'],
  movement: ['quick_reset', 'micro_break'],
  quiet: ['meditation_body', 'calm_sound'],
  music: ['calm_sound', 'affirm_calm'],
  creative: ['affirm_calm', 'grounding_54321'],
  social: ['affirm_calm', 'grounding_54321'],
  nature: ['quick_reset', 'micro_break'],
  structure: ['box_breathing', 'breath_478'],
};

const STRESS_DEFAULT_HIGH = ['breath_478', 'grounding_54321', 'quick_reset'];
const STRESS_DEFAULT_LOW = ['meditation_body', 'affirm_calm', 'calm_sound'];

const PRACTICE_META = {
  breath_478: {
    key: 'breath_478',
    icon: Wind,
    title: 'Дыхание 4-7-8',
    category: 'Дыхание',
    time: '2 мин',
    desc: 'Короткая практика, чтобы успокоить нервную систему.',
    detail:
      'Дышите медленно: вдох 4 счёта, задержка 7, выдох 8. Повторите несколько циклов — так активируется парасимпатическая система и снижается возбуждение.',
    hasPlay: true,
  },
  box_breathing: {
    key: 'box_breathing',
    icon: Wind,
    title: 'Квадратное дыхание',
    category: 'Дыхание',
    time: '3 мин',
    desc: 'Ровные фазы вдоха и выдоха — концентрация и ясность.',
    detail:
      'Вдох 4 счёта, задержка 4, выдох 4, пауза 4 — «квадрат». Подходит перед сном или между задачами.',
    hasPlay: true,
  },
  meditation_body: {
    key: 'meditation_body',
    icon: Sparkles,
    title: 'Сканирование тела',
    category: 'Медитация',
    time: '5 мин',
    desc: 'Короткая практика осознанности.',
    detail:
      'Закройте глаза и мягко проведите внимание от макушки к стопам. Замечайте ощущения без оценки — это снижает напряжение.',
    hasPlay: true,
  },
  quick_reset: {
    key: 'quick_reset',
    icon: Activity,
    title: 'Быстрое восстановление',
    category: 'Пауза',
    time: '2 мин',
    desc: '90 секунд: плечи, взгляд вдаль, три медленных вдоха.',
    detail:
      'Подходит между парами или после экрана: снимает зажим в теле и возвращает в контакт с окружением.',
    hasPlay: true,
  },
  grounding_54321: {
    key: 'grounding_54321',
    icon: Brain,
    title: 'Заземление 5-4-3-2-1',
    category: 'Тревога',
    time: '3 мин',
    desc: 'Снижает остроту тревоги через органы чувств.',
    detail:
      'Назовите 5 предметов вокруг, 4 звука, 3 ощущения кожи, 2 запаха, 1 вкус — внимание возвращается в «здесь и сейчас».',
    hasPlay: false,
  },
  affirm_calm: {
    key: 'affirm_calm',
    icon: Sparkles,
    title: 'Аффирмации спокойствия',
    category: 'Поддержка',
    time: '2 мин',
    desc: 'Короткие фразы — вслух или про себя.',
    detail:
      'Выберите одну фразу и повторите её 5–7 раз. Это не «магия», а мягкое переключение внимания с катастрофы на опору.',
    hasPlay: false,
  },
  micro_break: {
    key: 'micro_break',
    icon: Trees,
    title: 'Микропауза от экрана',
    category: 'Пауза',
    time: '1 мин',
    desc: 'Взгляд вдаль и моргание — разгрузка для глаз и нервной системы.',
    detail:
      'Отойдите на шаг от монитора, смотрите в окно 60 секунд, моргайте чаще. Микродвижение снижает залипание.',
    hasPlay: true,
  },
  calm_sound: {
    key: 'calm_sound',
    icon: Music,
    title: 'Тишина + ритм',
    category: 'Музыка',
    time: '5 мин',
    desc: 'Таймер под спокойный ритм дыхания.',
    detail:
      'Сядьте, задайте ровный темп вдоха и выдоха. Можно без музыки — только ритм и внимание к звуку выдоха.',
    hasPlay: true,
  },
};

/** Три рекомендации дня*/
export function buildDailyRecommendations(stressVal, likes) {
  const keys = [];
  const seen = new Set();

  const pushKey = (k) => {
    if (!k || seen.has(k)) return;
    seen.add(k);
    keys.push(k);
  };

  if (likes && likes.length) {
    for (const like of likes) {
      const arr = LIKE_TO_PRACTICE_KEYS[like] || [];
      arr.forEach(pushKey);
      if (keys.length >= 6) break;
    }
  }

  const fallback = stressVal >= 55 ? STRESS_DEFAULT_HIGH : STRESS_DEFAULT_LOW;
  for (const k of fallback) {
    pushKey(k);
    if (keys.length >= 8) break;
  }

  const out = [];
  for (const k of keys) {
    const meta = PRACTICE_META[k];
    if (meta) out.push(meta);
    if (out.length >= 3) break;
  }
  return out;
}
