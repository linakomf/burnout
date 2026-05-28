/**
 * Рекомендации главной: только карточки из админских API + скоринг по состоянию,
 * онбордингу «пространства» и последним результатам тестов (без изменения логики тестов).
 */
import { getTrackGenreTags, getTrackMoodTags } from '../components/Practices/musicHubFilters';
import { mapRemoteMusicTrack } from '../components/Practices/musicHubData';
import { mapRemoteArticlePayload, mapRemoteBookPayload } from '../components/Practices/articlesHubData';
import { mapRemoteMeditationPayload } from '../components/Practices/meditationHubData';
import { mapRemotePodcastPayload } from '../components/Practices/podcastHubData';
import { backendPublicUrl } from './assetUrl';
import { spaceSectionHref } from '../components/Practices/practiceSpaceConfig';
import { compositeAnxietyPct } from './wellnessComposite';

function clipCardText(s, max = 220) {
  const t = String(s || '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function bandFromPct(pct) {
  const p = Math.min(100, Math.max(0, Math.round(Number(pct) || 0)));
  if (p <= 25) return 1;
  if (p <= 50) return 2;
  if (p <= 75) return 3;
  return 4;
}

function addW(m, key, w) {
  if (!w) return;
  m.set(key, (m.get(key) || 0) + w);
}

/** Ключи: fm:* film mood, fg:* genre, fa:* atmosphere, mm:/mg: music, pt:/ps: podcast, md: meditation topic, ar: article cat, bk: book cat, ev: event tf.mood */
function moodWeightsByBand(b) {
  const m = new Map();
  const R = {
    1: () => {
      ['cozy', 'anxiety', 'relax', 'tired'].forEach((t) => addW(m, `fm:${t}`, 2.5));
      addW(m, 'mm:calm_down', 2.5);
      addW(m, 'mm:recovery', 2.5);
      addW(m, 'mm:anxious', 2.5);
      addW(m, 'mm:evening', 2.5);
      addW(m, 'ps:need_support', 2.5);
      addW(m, 'ps:calm', 2.5);
      addW(m, 'ps:tired', 2.5);
      ['anxiety', 'recovery', 'sounds'].forEach((t) => addW(m, `md:${t}`, 2.5));
      ['emotions', 'rest', 'anxiety'].forEach((t) => addW(m, `ar:${t}`, 2.5));
      ['lightread', 'restreads', 'fiction'].forEach((t) => addW(m, `bk:${t}`, 2.5));
    },
    2: () => {
      ['cozy', 'relax', 'distract'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:rest', 2);
      addW(m, 'mm:distract', 2);
      addW(m, 'mm:evening', 2);
      addW(m, 'pt:support', 2);
      addW(m, 'pt:life_balance', 2);
      addW(m, 'pt:mindfulness', 2);
      ['recovery', 'sleep'].forEach((t) => addW(m, `md:${t}`, 2));
      ['balance', 'rest', 'emotions'].forEach((t) => addW(m, `ar:${t}`, 2));
      ['restreads', 'lightread'].forEach((t) => addW(m, `bk:${t}`, 2));
    },
    3: () => {
      ['inspire', 'lift', 'distract'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:motivation', 2);
      addW(m, 'mm:morning', 2);
      addW(m, 'mm:concentration', 2);
      addW(m, 'pt:motivation', 2);
      addW(m, 'pt:self_growth', 2);
      addW(m, 'pt:life_balance', 2);
      ['focus', 'recovery'].forEach((t) => addW(m, `md:${t}`, 2));
      ['motivation', 'balance'].forEach((t) => addW(m, `ar:${t}`, 2));
      ['selfgrowth', 'motivation', 'inspire'].forEach((t) => addW(m, `bk:${t}`, 2));
    },
    4: () => {
      ['inspire', 'lift'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:motivation', 2);
      addW(m, 'mm:morning', 2);
      addW(m, 'pt:self_growth', 2);
      addW(m, 'pt:motivation', 2);
      ['creative', 'curious', 'social'].forEach((t) => addW(m, `ev:${t}`, 2.5));
      ['motivation', 'balance'].forEach((t) => addW(m, `ar:${t}`, 2));
      ['inspire', 'biography', 'selfgrowth'].forEach((t) => addW(m, `bk:${t}`, 2));
    }
  };
  (R[b] || R[2])();
  return m;
}

function stressWeightsByBand(b) {
  const m = new Map();
  const R = {
    1: () => {
      addW(m, 'pt:self_growth', 1.5);
      addW(m, 'pt:motivation', 1.5);
      addW(m, 'pt:life_balance', 1.5);
      addW(m, 'bk:selfgrowth', 1.5);
      addW(m, 'bk:inspire', 1.5);
      ['curious', 'creative'].forEach((t) => addW(m, `ev:${t}`, 1.5));
      addW(m, 'mm:concentration', 1.5);
      addW(m, 'mm:morning', 1.5);
    },
    2: () => {
      ['relax', 'cozy', 'distract'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:rest', 2);
      addW(m, 'mm:distract', 2);
      addW(m, 'mg:piano', 1.5);
      addW(m, 'mg:lofi', 1.5);
      addW(m, 'mg:acoustic', 1.5);
      ['recovery', 'focus'].forEach((t) => addW(m, `md:${t}`, 2));
      addW(m, 'ar:balance', 2);
      addW(m, 'ar:rest', 2);
      addW(m, 'pt:life_balance', 2);
      addW(m, 'pt:support', 2);
    },
    3: () => {
      ['anxiety', 'relax', 'cozy', 'tired'].forEach((t) => addW(m, `fm:${t}`, 2.5));
      addW(m, 'mm:calm_down', 2.5);
      addW(m, 'mm:recovery', 2.5);
      addW(m, 'mg:ambient', 2.5);
      addW(m, 'mg:nature_sounds', 2.5);
      addW(m, 'mg:piano', 2.5);
      ['anxiety', 'recovery', 'sounds'].forEach((t) => addW(m, `md:${t}`, 2.5));
      addW(m, 'pt:anxiety_stress', 2.5);
      addW(m, 'pt:mindfulness', 2.5);
      addW(m, 'pt:support', 2.5);
      addW(m, 'ar:stress', 2.5);
      addW(m, 'ar:rest', 2.5);
      addW(m, 'ar:balance', 2.5);
      addW(m, 'bk:lightread', 2.5);
      addW(m, 'bk:restreads', 2.5);
    },
    4: () => {
      ['anxiety', 'cozy', 'relax'].forEach((t) => addW(m, `fm:${t}`, 3));
      addW(m, 'mm:anxious', 3);
      addW(m, 'mm:calm_down', 3);
      addW(m, 'mg:nature_sounds', 3);
      addW(m, 'mg:ambient', 3);
      ['anxiety', 'sounds', 'sleep'].forEach((t) => addW(m, `md:${t}`, 3));
      addW(m, 'ps:need_support', 3);
      addW(m, 'ps:calm', 3);
      addW(m, 'ps:tired', 3);
      addW(m, 'ar:stress', 3);
      addW(m, 'ar:anxiety', 3);
      addW(m, 'ar:rest', 3);
      addW(m, 'bk:lightread', 3);
      addW(m, 'bk:restreads', 3);
    }
  };
  (R[b] || R[2])();
  return m;
}

function anxietyWeightsByBand(b) {
  const m = new Map();
  if (b >= 3) {
    ['anxiety', 'cozy', 'relax'].forEach((t) => addW(m, `fm:${t}`, 2.5));
    addW(m, 'mm:anxious', 2.5);
    addW(m, 'mm:calm_down', 2.5);
    addW(m, 'mg:nature_sounds', 2);
    addW(m, 'mg:piano', 2);
    ['anxiety', 'sounds'].forEach((t) => addW(m, `md:${t}`, 2.5));
    addW(m, 'ps:anxious', 2.5);
    addW(m, 'ps:calm', 2.5);
    addW(m, 'pt:support', 2.5);
    addW(m, 'ar:anxiety', 2.5);
    addW(m, 'ar:emotions', 2);
    addW(m, 'bk:lightread', 2);
    addW(m, 'bk:restreads', 2);
  } else if (b === 2) {
    addW(m, 'mm:evening', 1.5);
    addW(m, 'mm:rest', 1.5);
    addW(m, 'fm:cozy', 1.5);
    addW(m, 'fm:relax', 1.5);
    addW(m, 'md:recovery', 1.5);
    addW(m, 'ar:balance', 1.5);
    addW(m, 'ar:emotions', 1.5);
  }
  return m;
}

function energyWeightsByBand(b) {
  const m = new Map();
  const R = {
    1: () => {
      ['tired', 'cozy', 'relax'].forEach((t) => addW(m, `fm:${t}`, 2.5));
      addW(m, 'mm:recovery', 2.5);
      addW(m, 'mm:evening', 2.5);
      addW(m, 'mg:nature_sounds', 2);
      ['sleep', 'recovery', 'sounds'].forEach((t) => addW(m, `md:${t}`, 2.5));
      addW(m, 'ps:tired', 2.5);
      addW(m, 'ps:need_support', 2.5);
      addW(m, 'ar:rest', 2.5);
      addW(m, 'ar:burnout', 2);
      addW(m, 'bk:lightread', 2.5);
      addW(m, 'bk:restreads', 2.5);
    },
    2: () => {
      ['distract', 'cozy', 'relax'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:rest', 2);
      addW(m, 'mm:distract', 2);
      addW(m, 'mg:lofi', 2);
      ['recovery', 'focus'].forEach((t) => addW(m, `md:${t}`, 2));
      addW(m, 'pt:support', 2);
      addW(m, 'pt:life_balance', 2);
      addW(m, 'ar:balance', 2);
      addW(m, 'ar:rest', 2);
    },
    3: () => {
      ['inspire', 'lift'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:concentration', 2);
      addW(m, 'mm:morning', 2);
      addW(m, 'mm:motivation', 2);
      addW(m, 'pt:motivation', 2);
      addW(m, 'pt:self_growth', 2);
      addW(m, 'ar:motivation', 2);
      addW(m, 'ar:balance', 2);
      ['creative', 'curious'].forEach((t) => addW(m, `ev:${t}`, 2));
    },
    4: () => {
      ['active', 'social', 'creative'].forEach((t) => addW(m, `ev:${t}`, 2.5));
      addW(m, 'mm:motivation', 2);
      addW(m, 'pt:self_growth', 2);
      addW(m, 'pt:motivation', 2);
      ['inspire', 'lift'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'bk:biography', 2);
      addW(m, 'bk:inspire', 2);
    }
  };
  (R[b] || R[2])();
  return m;
}

function mergeMaps(into, from, scale = 1) {
  for (const [k, v] of from.entries()) addW(into, k, v * scale);
}

/** Сохраняем порядок выбора, убираем дубликаты. */
function dedupeContentPrefs(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr || []) {
    if (x == null || x === '') continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

/** Теги Q1 → типы карточек в скоринге (reading = одна карточка: статья или книга). */
const CONTENT_PREF_TO_CARD_TYPES = {
  music: ['music'],
  movies: ['film'],
  meditation: ['meditation'],
  reading: ['article', 'book'],
  podcasts: ['podcast'],
  events: ['event']
};

const CARD_TYPE_TO_CONTENT_PREF = {
  film: 'movies',
  music: 'music',
  meditation: 'meditation',
  article: 'reading',
  book: 'reading',
  podcast: 'podcasts',
  event: 'events'
};

function isAllowedByContentPrefs(candidate, prefs) {
  if (!prefs?.length) return true;
  const pref = CARD_TYPE_TO_CONTENT_PREF[candidate.type];
  return Boolean(pref && prefs.includes(pref));
}

function bestCandidateForContentPref(candidates, pref) {
  const types = CONTENT_PREF_TO_CARD_TYPES[pref];
  if (!types?.length) return null;
  let best = null;
  for (const c of candidates) {
    if (!types.includes(c.type)) continue;
    if (!best || c.score > best.score) best = c;
  }
  return best;
}

function cardDedupeKey(c) {
  return `${c.type}:${c.path}:${c.title}`;
}

/** Раздел на главной: не больше одной карточки на bucket (статья и книга — одно «чтение»). */
function sectionBucket(cardType) {
  if (cardType === 'article' || cardType === 'book') return 'reading';
  const m = {
    film: 'films',
    music: 'music',
    meditation: 'meditation',
    podcast: 'podcasts',
    event: 'events'
  };
  return m[cardType] || cardType;
}

/**
 * Не больше одной карточки на раздел (фильмы / музыка / …).
 * Если в Q1 выбраны категории — только они (без добора фильмов/событий по скорингу настроения).
 */
function pickHomeCards(candidates, spacePreferences) {
  const prefs = dedupeContentPrefs(spacePreferences?.contentPreferences);
  const hasContentPrefs = prefs.length > 0;
  const pool = hasContentPrefs
    ? candidates.filter((c) => isAllowedByContentPrefs(c, prefs))
    : candidates;
  const sorted = [...pool].sort((a, b) => b.score - a.score);
  const picked = [];
  const usedKeys = new Set();
  const usedBuckets = new Set();

  const pushIfNewBucket = (c) => {
    if (!c) return false;
    const key = cardDedupeKey(c);
    if (usedKeys.has(key)) return false;
    const buck = sectionBucket(c.type);
    if (usedBuckets.has(buck)) return false;
    usedKeys.add(key);
    usedBuckets.add(buck);
    picked.push(c);
    return true;
  };

  if (hasContentPrefs) {
    for (const pref of prefs) {
      const best = bestCandidateForContentPref(sorted, pref);
      pushIfNewBucket(best);
    }
    return picked.slice(0, 6).map(({ score, ...rest }) => rest);
  }

  for (const c of sorted) {
    if (picked.length >= 6) break;
    if (c.score < 0.5) continue;
    pushIfNewBucket(c);
  }

  if (picked.length < 3) {
    const out = [];
    const ub = new Set();
    const uk = new Set();
    for (const c of [...candidates].sort((a, b) => b.score - a.score)) {
      if (c.score <= 0) continue;
      const key = cardDedupeKey(c);
      const buck = sectionBucket(c.type);
      if (uk.has(key) || ub.has(buck)) continue;
      uk.add(key);
      ub.add(buck);
      out.push(c);
      if (out.length >= 6) break;
    }
    return out.map(({ score, ...rest }) => rest);
  }

  return picked.slice(0, 6).map(({ score, ...rest }) => rest);
}

function latestByTestId(results) {
  const map = new Map();
  const sorted = [...(results || [])].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );
  for (const r of sorted) {
    const id = Number(r.test_id);
    if (!Number.isFinite(id)) continue;
    if (!map.has(id)) map.set(id, r);
  }
  return map;
}

function testWeights(latestMap) {
  const m = new Map();
  const burn = latestMap.get(2) || latestMap.get(4);
  if (burn) {
    const lv = String(burn.level || '');
    if (/Выраженное|выражен/i.test(lv) || (Number(burn.score) >= 68 && /mbi/i.test(String(burn.scoring_type || '')))) {
      ['tired', 'relax', 'cozy'].forEach((t) => addW(m, `fm:${t}`, 2));
      addW(m, 'mm:recovery', 2);
      addW(m, 'mm:tired', 2);
      ['recovery', 'sleep'].forEach((t) => addW(m, `md:${t}`, 2));
      addW(m, 'ar:burnout', 2);
      addW(m, 'ar:rest', 2);
      addW(m, 'ar:balance', 2);
      addW(m, 'pt:burnout', 2);
      addW(m, 'pt:support', 2);
      addW(m, 'bk:restreads', 2);
      addW(m, 'bk:lightread', 2);
    }
  }
  const gad = latestMap.get(6);
  if (gad && /Высокая/i.test(String(gad.level || ''))) {
    ['anxiety', 'sounds'].forEach((t) => addW(m, `md:${t}`, 2.5));
    addW(m, 'mm:anxious', 2.5);
    addW(m, 'mm:calm_down', 2.5);
    ['anxiety', 'cozy'].forEach((t) => addW(m, `fm:${t}`, 2.5));
    addW(m, 'ar:anxiety', 2.5);
    addW(m, 'ps:need_support', 2);
    addW(m, 'ps:calm', 2);
  }
  const stressTest = latestMap.get(5);
  if (stressTest && /Высок|повышен/i.test(String(stressTest.level || ''))) {
    ['anxiety', 'recovery', 'sounds'].forEach((t) => addW(m, `md:${t}`, 2));
    addW(m, 'mm:calm_down', 2);
    addW(m, 'mg:nature_sounds', 2);
    addW(m, 'mg:ambient', 2);
    addW(m, 'ar:stress', 2);
    addW(m, 'ar:rest', 2);
    addW(m, 'pt:anxiety_stress', 2);
    addW(m, 'pt:mindfulness', 2);
  }
  return m;
}

function onboardingWeights(prefs) {
  const m = new Map();
  if (!prefs || typeof prefs !== 'object') return m;
  const mapType = {
    music: 't:music',
    movies: 't:films',
    meditation: 't:meditation',
    reading: 't:reading',
    podcasts: 't:podcasts',
    events: 't:events'
  };
  (prefs.contentPreferences || []).forEach((id) => {
    const k = mapType[id];
    if (k) addW(m, k, 3);
  });
  (prefs.formatPreferences || []).forEach((id) => addW(m, `obf:${id}`, 2));
  (prefs.emotionalNeeds || []).forEach((id) => addW(m, `obe:${id}`, 2));
  (prefs.atmospherePreferences || []).forEach((id) => addW(m, `oba:${id}`, 2));
  return m;
}

function scoreFilm(film, weights) {
  const tags = film.tags || {};
  let s = 0;
  const hit = (arr, prefix) => {
    (arr || []).forEach((id) => {
      const k = `${prefix}:${id}`;
      s += weights.get(k) || 0;
    });
  };
  hit(tags.mood, 'fm');
  hit(tags.genre, 'fg');
  hit(tags.atmosphere, 'fa');
  s += weights.get('t:films') || 0;
  if ((tags.genre || []).includes('drama')) {
    const heavy = (weights.get('fm:anxiety') || 0) + (weights.get('md:anxiety') || 0);
    if (heavy > 4) s -= 3;
  }
  return s;
}

function scoreMusicTrack(track, weights) {
  let s = 0;
  if (track.kind === 'quick') s += 0.5;
  getTrackMoodTags(track).forEach((id) => {
    s += weights.get(`mm:${id}`) || 0;
  });
  getTrackGenreTags(track).forEach((id) => {
    s += weights.get(`mg:${id}`) || 0;
  });
  s += weights.get('t:music') || 0;
  return s;
}

function scorePodcast(ep, weights) {
  const tags = ep.tags || {};
  let s = 0;
  (tags.theme || []).forEach((id) => {
    s += weights.get(`pt:${id}`) || 0;
  });
  (tags.situation || []).forEach((id) => {
    s += weights.get(`ps:${id}`) || 0;
  });
  s += weights.get('t:podcasts') || 0;
  return s;
}

function scoreMeditation(pr, weights) {
  let s = 0;
  (pr.meditationTopics || []).forEach((id) => {
    s += weights.get(`md:${id}`) || 0;
  });
  s += weights.get('t:meditation') || 0;
  return s;
}

function scoreArticle(a, weights) {
  const c = a.category || 'burnout';
  let s = weights.get(`ar:${c}`) || 0;
  s += weights.get('t:reading') || 0;
  return s;
}

function scoreBook(b, weights) {
  const c = b.bookCategory || 'psychology';
  let s = weights.get(`bk:${c}`) || 0;
  s += weights.get('t:reading') || 0;
  return s;
}

function scoreEvent(ev, weights) {
  let s = weights.get(`ev:${ev?.tf?.mood}`) || 0;
  s += weights.get('t:events') || 0;
  const heavyStress = (weights.get('fm:anxiety') || 0) > 3;
  if (heavyStress && ['energy', 'active'].includes(ev?.tf?.mood)) s -= 5;
  return s;
}

function anxietyFromResultsSimple(results) {
  const anxietyish = (results || []).filter((r) =>
    /тревог|GAD|gad|беспокой|паник/i.test(`${r.title || ''} ${r.category_name || ''}`)
  );
  if (!anxietyish.length) return null;
  const scores = anxietyish.map((r) => Number(r.score) || 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(100, Math.round(avg * (21 / 10)));
}

/**
 * @param {object} ctx
 * @returns {Array<{ type: string, score: number, title: string, subtitle: string, description: string, image: string, path: string }>}
 */
export function buildHomeRecommendationCards(ctx) {
  const {
    moodVal,
    stressVal,
    energyVal,
    testResults,
    spacePreferences,
    user,
    films = [],
    podcastEpisodes = [],
    meditations = [],
    readingItems = [],
    musicItems = [],
    events = [],
    favoriteHints = new Set()
  } = ctx;

  const moodBand = bandFromPct(moodVal);
  const stressBand = bandFromPct(stressVal);
  const energyBand = bandFromPct(energyVal);
  const anxietyPct =
    compositeAnxietyPct({
      onboardingPercent: user?.onboarding_burnout_percent ?? null,
      periodAnxietyFromTests: anxietyFromResultsSimple(testResults)
    }) ?? Math.round(Number(stressVal) * 0.88);
  const anxietyBand = bandFromPct(anxietyPct);

  const weights = new Map();
  mergeMaps(weights, moodWeightsByBand(moodBand), 1);
  mergeMaps(weights, stressWeightsByBand(stressBand), 1);
  mergeMaps(weights, energyWeightsByBand(energyBand), 1);
  mergeMaps(weights, anxietyWeightsByBand(anxietyBand), 1);
  mergeMaps(weights, testWeights(latestByTestId(testResults)), 1);
  mergeMaps(weights, onboardingWeights(spacePreferences), 1);

  favoriteHints.forEach((hid) => {
    if (hid) addW(weights, `fav:${hid}`, 1);
  });

  const candidates = [];

  (films || []).slice(0, 80).forEach((film) => {
    const sc = scoreFilm(film, weights);
    if (sc <= -2) return;
    const poster = backendPublicUrl(film.poster || film.poster_url || '');
    const desc = clipCardText(film.description || film.description_short || film.descriptionShort || '');
    const fid = film.id ?? film.film_id;
    candidates.push({
      type: 'film',
      score: sc,
      title: film.title || 'Фильм',
      subtitle: 'Фильмы',
      description: desc,
      image: poster,
      path: fid != null && fid !== '' ? `/practices/films/${encodeURIComponent(fid)}` : spaceSectionHref('films')
    });
  });

  (musicItems || [])
    .filter((it) => it.kind === 'track')
    .slice(0, 120)
    .forEach((raw) => {
      const tr = mapRemoteMusicTrack(raw, backendPublicUrl);
      const sc = scoreMusicTrack(tr, weights);
      const desc = clipCardText(tr.descriptionShort || tr.artist || '');
      candidates.push({
        type: 'music',
        score: sc,
        title: tr.title || 'Трек',
        subtitle: 'Музыка',
        description: desc,
        image: tr.poster || '',
        path:
          tr.id != null && tr.id !== ''
            ? `${spaceSectionHref('music')}?play=${encodeURIComponent(tr.id)}`
            : spaceSectionHref('music')
      });
    });

  (podcastEpisodes || []).slice(0, 80).forEach((row) => {
    const ep = mapRemotePodcastPayload(row, backendPublicUrl);
    const sc = scorePodcast(ep, weights);
    const desc = clipCardText(ep.descriptionShort || ep.metaLine || ep.showName || '');
    candidates.push({
      type: 'podcast',
      score: sc,
      title: ep.title || 'Подкаст',
      subtitle: ep.showName || 'Подкасты',
      description: desc,
      image: ep.poster || '',
      path:
        ep.id != null && ep.id !== ''
          ? `${spaceSectionHref('podcasts')}?episode=${encodeURIComponent(ep.id)}`
          : spaceSectionHref('podcasts')
    });
  });

  (meditations || []).slice(0, 80).forEach((row) => {
    const pr = mapRemoteMeditationPayload(row);
    const topics = pr.meditationTopics || pr.topics || [];
    const sc = scoreMeditation({ ...pr, meditationTopics: topics }, weights);
    const desc = clipCardText(pr.descriptionShort || pr.description || '');
    candidates.push({
      type: 'meditation',
      score: sc,
      title: pr.title || 'Практика',
      subtitle: 'Медитации',
      description: desc,
      image: pr.coverImage || '',
      path:
        pr.id != null && pr.id !== ''
          ? `${spaceSectionHref('meditation')}?open=${encodeURIComponent(pr.id)}`
          : spaceSectionHref('meditation')
    });
  });

  (readingItems || [])
    .filter((r) => r.kind === 'article')
    .slice(0, 60)
    .forEach((row) => {
      const a = mapRemoteArticlePayload(row, backendPublicUrl);
      const sc = scoreArticle(a, weights);
      const desc = clipCardText(a.descriptionShort || '');
      candidates.push({
        type: 'article',
        score: sc,
        title: a.title || 'Статья',
        subtitle: 'Чтение',
        description: desc,
        image: a.image || '',
        path:
          a.id != null && a.id !== ''
            ? `/practices/articles/read/${encodeURIComponent(a.id)}`
            : spaceSectionHref('articles')
      });
    });

  (readingItems || [])
    .filter((r) => r.kind === 'book')
    .slice(0, 40)
    .forEach((row) => {
      const b = mapRemoteBookPayload(row, backendPublicUrl);
      const sc = scoreBook(b, weights);
      const desc = clipCardText(b.descriptionShort || '');
      candidates.push({
        type: 'book',
        score: sc,
        title: b.title || 'Книга',
        subtitle: 'Чтение',
        description: desc,
        image: b.image || '',
        path:
          b.id != null && b.id !== ''
            ? `/practices/articles/book/${encodeURIComponent(b.id)}`
            : spaceSectionHref('articles')
      });
    });

  (events || []).slice(0, 50).forEach((ev) => {
    const sc = scoreEvent(ev, weights);
    if (stressBand >= 4 && anxietyBand >= 4 && ['energy', 'active'].includes(ev?.tf?.mood)) return;
    const eid = ev.id ?? ev.event_id;
    const desc = clipCardText(ev.description || ev.descriptionShort || ev.summary || '');
    candidates.push({
      type: 'event',
      score: sc,
      title: ev.title || 'Событие',
      subtitle: 'События',
      description: desc,
      image: backendPublicUrl(ev.image || ev.coverImage || ev.cover_url || ''),
      path:
        eid != null && eid !== ''
          ? `/practices/events/${encodeURIComponent(eid)}`
          : spaceSectionHref('events')
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  return pickHomeCards(candidates, spacePreferences);
}

export { anxietyFromResultsSimple };
