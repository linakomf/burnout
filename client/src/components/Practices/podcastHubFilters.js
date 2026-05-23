/** Опции фильтров на странице «Подкасты» (ключи локалей pages.*). */

export const PODCAST_FILTER_THEME_OPTIONS = [
  { id: null, labelKey: 'podcastsFilterAny' },
  { id: 'psychology', labelKey: 'podcastsFilterThemePsychology' },
  { id: 'self_growth', labelKey: 'podcastsFilterThemeSelfGrowth' },
  { id: 'burnout', labelKey: 'podcastsFilterThemeBurnout' },
  { id: 'anxiety_stress', labelKey: 'podcastsFilterThemeAnxietyStress' },
  { id: 'mindfulness', labelKey: 'podcastsFilterThemeMindfulness' },
  { id: 'motivation', labelKey: 'podcastsFilterThemeMotivation' },
  { id: 'life_balance', labelKey: 'podcastsFilterThemeLifeBalance' },
  { id: 'support', labelKey: 'podcastsFilterThemeSupport' },
];

export const PODCAST_FILTER_SITUATION_OPTIONS = [
  { id: null, labelKey: 'podcastsFilterAny' },
  { id: 'anxious', labelKey: 'podcastsFilterSituationAnxious' },
  { id: 'tired', labelKey: 'podcastsFilterSituationTired' },
  { id: 'no_motiv', labelKey: 'podcastsFilterSituationNoMotiv' },
  { id: 'distract', labelKey: 'podcastsFilterSituationDistract' },
  { id: 'calm', labelKey: 'podcastsFilterSituationCalm' },
  { id: 'burnout_feel', labelKey: 'podcastsFilterSituationBurnoutFeel' },
  { id: 'need_support', labelKey: 'podcastsFilterSituationNeedSupport' },
];

export const PODCAST_FILTER_FORMAT_OPTIONS = [
  { id: null, labelKey: 'podcastsFilterFormatAll' },
  { id: 'short', labelKey: 'podcastsFilterFormatShort' },
  { id: 'medium', labelKey: 'podcastsFilterFormatMedium' },
  { id: 'long', labelKey: 'podcastsFilterFormatLong' },
];

const LEGACY_TOPIC_TO_THEMES = {
  psych: ['psychology'],
  mind: ['mindfulness'],
  relations: ['support'],
  growth: ['self_growth'],
  mental: ['anxiety_stress'],
  motiv: ['motivation'],
};

/** @param {number} durationMin */
export function inferFormatFromDuration(durationMin) {
  const min = Number(durationMin) || 0;
  if (min > 0 && min < 20) return 'short';
  if (min <= 30) return 'medium';
  return 'long';
}

/** @param {{ tags?: { theme?: string[], situation?: string[], format?: string[] }, topic?: string, durationMin?: number }} ep */
export function getEpisodeFilterTags(ep) {
  const raw = ep.tags;
  if (raw && (raw.theme?.length || raw.situation?.length || raw.format?.length)) {
    return {
      theme: Array.isArray(raw.theme) ? raw.theme : [],
      situation: Array.isArray(raw.situation) ? raw.situation : [],
      format: Array.isArray(raw.format) ? raw.format : [],
    };
  }
  const legacyThemes = LEGACY_TOPIC_TO_THEMES[ep.topic] || [];
  return {
    theme: legacyThemes,
    situation: [],
    format: [inferFormatFromDuration(ep.durationMin)],
  };
}

/** @param {string[] | null | undefined} selected */
function tagDimensionPasses(tags, selected, tagKey) {
  if (!selected || selected.length === 0) return true;
  const arr = tags[tagKey];
  if (!arr || !Array.isArray(arr) || arr.length === 0) return false;
  return selected.some((id) => arr.includes(id));
}

/**
 * @param {{ tags?: object, topic?: string, durationMin?: number }} episode
 * @param {{ themes?: string[], situations?: string[], formats?: string[] }} filters
 */
export function episodePassesHubFilters(episode, { themes, situations, formats }) {
  const tags = getEpisodeFilterTags(episode);
  if (!tagDimensionPasses(tags, themes, 'theme')) return false;
  if (!tagDimensionPasses(tags, situations, 'situation')) return false;
  if (!tagDimensionPasses(tags, formats, 'format')) return false;
  return true;
}
