import { buildHomeRecommendationCards } from './homeSpaceRecommendations';
import { spaceSectionHref } from '../components/Practices/practiceSpaceConfig';
import {
  detectRecommendationRejection,
  preferTypesAfterRejection,
  buildLocalAlternativeReply,
} from './aiChatRejection';

export function detectChatThemes(text) {
  const t = String(text || '').toLowerCase();
  return {
    stress: /стресс|нагруз|не справ|давлен|перегруж/i.test(t),
    anxiety: /тревог|боюсь|страшно|волнуюсь|паник|нерв|беспокой/i.test(t),
    burnout: /выгоран|устал|сил нет|истощ|нет сил|вымот/i.test(t),
    music: /музык|плейлист|песн|слушать/i.test(t),
    books: /книг|чтени|читать|стать/i.test(t),
    practices: /практик|медитац|дыхат|йог|упражнен/i.test(t),
    films: /фильм|кино|сериал|посмотрет/i.test(t),
  };
}

export function themesFromHints(cardHints) {
  const out = detectChatThemes('');
  (cardHints?.themes || []).forEach((key) => {
    if (key in out) out[key] = true;
  });
  (cardHints?.interests || []).forEach((key) => {
    if (key in out) out[key] = true;
  });
  return out;
}

export function shouldShowChatRecommendations(themes, cardHints) {
  if (cardHints?.showCards) return true;
  return Boolean(
    themes.stress ||
      themes.anxiety ||
      themes.burnout ||
      themes.music ||
      themes.books ||
      themes.practices ||
      themes.films
  );
}

function estimateWellnessFromThemes(themes) {
  let moodVal = 50;
  let stressVal = 45;
  let energyVal = 50;
  if (themes.stress) stressVal = 72;
  if (themes.anxiety) stressVal = Math.max(stressVal, 68);
  if (themes.burnout) {
    stressVal = Math.max(stressVal, 75);
    energyVal = 28;
    moodVal = 32;
  }
  return { moodVal, stressVal, energyVal };
}

function mergeThemes(userText, cardHints) {
  const fromText = detectChatThemes(userText);
  const fromHints = themesFromHints(cardHints);
  return {
    stress: fromText.stress || fromHints.stress,
    anxiety: fromText.anxiety || fromHints.anxiety,
    burnout: fromText.burnout || fromHints.burnout,
    music: fromText.music || fromHints.music,
    books: fromText.books || fromHints.books,
    practices: fromText.practices || fromHints.practices,
    films: fromText.films || fromHints.films,
  };
}

function conversationUserText(conversationMessages = []) {
  return (conversationMessages || [])
    .filter((m) => m.role === 'user')
    .slice(-6)
    .map((m) => m.content)
    .join(' ');
}

function pickAlternativeSpaceCard(pool, preferTypes) {
  for (const type of preferTypes) {
    const card = pool.find((c) => c.type === type && c.path);
    if (card) return card;
  }
  return pool.find((c) => c.path) || null;
}

const FALLBACK_SPACE_CARD = {
  podcast: { subtitle: 'Подкасты', title: 'Подкаст из пространства', section: 'podcasts' },
  article: { subtitle: 'Чтение', title: 'Статья из пространства', section: 'articles' },
  book: { subtitle: 'Чтение', title: 'Книга из пространства', section: 'articles' },
  film: { subtitle: 'Фильмы', title: 'Фильм из пространства', section: 'films' },
  music: { subtitle: 'Музыка', title: 'Музыка из пространства', section: 'music' },
  meditation: { subtitle: 'Медитации', title: 'Практика из пространства', section: 'meditation' },
  event: { subtitle: 'События', title: 'Событие из пространства', section: 'events' },
};

function buildFallbackAlternativeCard(preferTypes = []) {
  for (const type of preferTypes) {
    const meta = FALLBACK_SPACE_CARD[type];
    if (!meta) continue;
    return {
      type,
      title: meta.title,
      subtitle: meta.subtitle,
      description: '',
      image: '',
      path: spaceSectionHref(meta.section),
    };
  }
  return null;
}

export function buildAiChatRecommendationCards(ctx) {
  const {
    userText,
    user,
    spaceCatalog,
    spacePreferences,
    testResults = [],
    cardHints,
    previousCardTypes = [],
    previousCardPaths = [],
    conversationMessages = [],
  } = ctx;
  const themes = mergeThemes(`${userText} ${conversationUserText(conversationMessages)}`, cardHints);

  const rejection = detectRecommendationRejection(userText, previousCardTypes);
  const excludeTypes = new Set([
    ...(cardHints?.excludeTypes || []),
    ...(rejection.isRejection ? rejection.rejectedTypes : []),
  ]);
  const preferTypes =
    cardHints?.preferTypes?.length > 0
      ? cardHints.preferTypes
      : rejection.isRejection
        ? preferTypesAfterRejection([...excludeTypes])
        : [];
  const isAlternative = Boolean(cardHints?.isAlternative || rejection.isRejection);

  if (!isAlternative && !shouldShowChatRecommendations(themes, cardHints)) return [];
  if (isAlternative && !preferTypes.length) return [];

  const { moodVal, stressVal, energyVal } = estimateWellnessFromThemes(themes);

  const all = buildHomeRecommendationCards({
    moodVal,
    stressVal,
    energyVal,
    testResults,
    spacePreferences: spacePreferences || user?.space_preferences || null,
    user,
    films: spaceCatalog?.films || [],
    musicItems: spaceCatalog?.musicItems || [],
    podcastEpisodes: spaceCatalog?.podcastEpisodes || [],
    meditations: spaceCatalog?.meditations || [],
    readingItems: spaceCatalog?.readingItems || [],
    events: spaceCatalog?.events || [],
    fullPool: isAlternative,
  });

  if (!all.length) {
    if (isAlternative) {
      const fallback = buildFallbackAlternativeCard(preferTypes);
      return fallback ? [fallback] : [];
    }
    return [];
  }

  const excludePaths = new Set(previousCardPaths || []);
  let pool = all.filter(
    (card) => !excludeTypes.has(card.type) && !excludePaths.has(card.path)
  );

  if (!pool.length && isAlternative) {
    pool = all.filter((card) => !excludeTypes.has(card.type));
  }

  if (!pool.length) return [];

  const picks = [];
  const used = new Set();

  const push = (card) => {
    if (!card || used.has(card.path)) return;
    used.add(card.path);
    picks.push(card);
  };

  if (isAlternative) {
    const alternativeCard =
      pickAlternativeSpaceCard(pool, preferTypes) || buildFallbackAlternativeCard(preferTypes);
    return alternativeCard ? [alternativeCard] : [];
  }

  const needsBreathing = themes.stress || themes.anxiety || themes.burnout || themes.practices;
    if (needsBreathing) {
      push(pool.find((c) => c.type === 'meditation'));
    }

    const typePriority = [];
    if (themes.music) typePriority.push('music');
    if (themes.books) typePriority.push('article', 'book');
    if (themes.films) typePriority.push('film');
    if (themes.practices && !needsBreathing) typePriority.push('meditation');
    if (themes.stress || themes.anxiety) typePriority.push('podcast');

    for (const type of typePriority) {
      push(pool.find((c) => c.type === type));
    }

  for (const card of pool) {
    if (picks.length >= 3) break;
    push(card);
  }

  return picks.slice(0, 3);
}

export { buildLocalAlternativeReply, detectRecommendationRejection, preferTypesAfterRejection };
