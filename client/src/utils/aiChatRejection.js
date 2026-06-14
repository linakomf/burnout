export const CHAT_CARD_TYPE_PRIORITY = [
  'podcast',
  'article',
  'book',
  'film',
  'music',
  'meditation',
  'event',
];

const REJECTION_SIGNAL_RE =
  /не хочу|не буду|не надо|не интерес|не подход|не сейчас|не мо[её]|не нрав|не помог|бесполез|отказыва|не могу слушать|не буду слушать|не хочу слушать|не хочу смотреть|не хочу читать|не хочу медит|не буду медит|не хочу заним/i;

const ALTERNATIVE_SIGNAL_RE =
  /другое|другой|другую|другие|иначе|ещё|еще|что.?нибудь|предлож|вариант|альтернатив/i;

const GENERAL_NO_RE = /^(нет|не|неа|no)[!.?\s🌿]*$|^не хочу[!.?\s🌿]*$/i;

function explicitRejectedTypes(text) {
  const t = String(text || '').toLowerCase();
  const rejected = [];
  if (/музык|плейлист|песн|слушать/i.test(t)) rejected.push('music');
  if (/медитац|практик|дыхат|йог/i.test(t)) rejected.push('meditation');
  if (/книг|чтени|читать/i.test(t)) rejected.push('book');
  if (/стать/i.test(t)) rejected.push('article');
  if (/фильм|кино|сериал|смотрет/i.test(t)) rejected.push('film');
  if (/подкаст/i.test(t)) rejected.push('podcast');
  if (/событи|мероприят/i.test(t)) rejected.push('event');
  return [...new Set(rejected)];
}

export function getPreviousRecommendationContext(messages) {
  const reversed = [...(messages || [])].reverse();
  const lastWithCards = reversed.find((m) => m.role === 'assistant' && m.cards?.length);
  if (!lastWithCards) {
    return { previousCardTypes: [], previousCardPaths: [] };
  }
  return {
    previousCardTypes: [...new Set(lastWithCards.cards.map((c) => c.type).filter(Boolean))],
    previousCardPaths: lastWithCards.cards.map((c) => c.path).filter(Boolean),
  };
}

export function detectRecommendationRejection(userText, previousCardTypes = []) {
  const text = String(userText || '').trim();
  const lower = text.toLowerCase();
  const explicit = explicitRejectedTypes(lower);
  const hasRejectionSignal = REJECTION_SIGNAL_RE.test(lower);
  const wantsAlternative = ALTERNATIVE_SIGNAL_RE.test(lower);
  const isGeneralNo = GENERAL_NO_RE.test(lower);
  const prevTypes = [...new Set(previousCardTypes || [])];

  if (explicit.length) {
    return {
      isRejection: true,
      rejectedTypes: explicit,
      wantsAlternative: true,
    };
  }

  if (prevTypes.length && (hasRejectionSignal || wantsAlternative || isGeneralNo)) {
    return {
      isRejection: true,
      rejectedTypes: prevTypes,
      wantsAlternative: true,
    };
  }

  if (wantsAlternative && prevTypes.length) {
    return {
      isRejection: true,
      rejectedTypes: prevTypes,
      wantsAlternative: true,
    };
  }

  return { isRejection: false, rejectedTypes: [], wantsAlternative: false };
}

export function preferTypesAfterRejection(rejectedTypes = []) {
  const rejected = new Set(rejectedTypes);
  return CHAT_CARD_TYPE_PRIORITY.filter((type) => !rejected.has(type));
}

export function buildLocalAlternativeReply(rejectedTypes = [], preferTypes = []) {
  const rejected = new Set(rejectedTypes);
  const nextType = preferTypes[0] || CHAT_CARD_TYPE_PRIORITY.find((t) => !rejected.has(t));

  if (rejected.has('music') && nextType === 'podcast') {
    return 'Понимаю, музыка сейчас не подходит. Тогда попробуйте короткий подкаст — иногда легче переключиться через спокойный разговор.';
  }
  if (rejected.has('music') && (nextType === 'article' || nextType === 'book')) {
    return 'Хорошо, без музыки. Может, поможет короткая статья или книга — можно просто пролистать пару страниц в своём темпе.';
  }
  if (rejected.has('meditation') && nextType === 'film') {
    return 'Без медитации — это нормально. Для мягкого отдыха можно выбрать спокойный фильм и просто переключить внимание.';
  }
  if (rejected.has('meditation') && nextType === 'music') {
    return 'Хорошо, без практики. Иногда помогает просто спокойная музыка — без усилий и без «упражнений».';
  }
  if (rejected.has('meditation') && (nextType === 'article' || nextType === 'podcast')) {
    return 'Понимаю, медитация сейчас не ваш формат. Попробуйте что-то более лёгкое — подкаст или короткую статью.';
  }
  if ((rejected.has('film') || rejected.has('article') || rejected.has('book')) && nextType === 'music') {
    return 'Хорошо, давайте другой вариант. Может, сейчас больше подойдёт спокойная музыкальная подборка.';
  }
  if (rejected.has('film') && nextType === 'podcast') {
    return 'Фильм не хочется — понимаю. Попробуйте подкаст: можно слушать фоном и не держать внимание на экране.';
  }

  return 'Понимаю, этот вариант не подошёл. Давайте попробуем что-то другое из подборки — иногда лучше заходит другой формат отдыха.';
}
