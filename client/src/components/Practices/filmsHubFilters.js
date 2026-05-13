/** Опции выпадающих фильтров на странице «Фильмы» (ключи локалей pages.*). */

export const FILMS_FILTER_MOOD_OPTIONS = [
  { id: null, labelKey: 'filmsFilterAny' },
  { id: 'relax', labelKey: 'filmsFilterMoodRelax' },
  { id: 'lift', labelKey: 'filmsFilterMoodLift' },
  { id: 'distract', labelKey: 'filmsFilterMoodDistract' },
  { id: 'cozy', labelKey: 'filmsFilterMoodCozy' },
  { id: 'anxiety', labelKey: 'filmsFilterMoodAnxiety' },
  { id: 'inspire', labelKey: 'filmsFilterMoodInspire' },
  { id: 'tired', labelKey: 'filmsFilterMoodTired' },
];

export const FILMS_FILTER_GENRE_OPTIONS = [
  { id: null, labelKey: 'filmsFilterAny' },
  { id: 'comedy', labelKey: 'filmsFilterGenreComedy' },
  { id: 'romance_romcom', labelKey: 'filmsFilterGenreRomanceRomcom' },
  { id: 'drama', labelKey: 'filmsFilterGenreDrama' },
  { id: 'family', labelKey: 'filmsFilterGenreFamily' },
  { id: 'fantasy', labelKey: 'filmsFilterGenreFantasy' },
  { id: 'animation', labelKey: 'filmsFilterGenreAnimation' },
  { id: 'slice', labelKey: 'filmsFilterGenreSlice' },
];

export const FILMS_FILTER_TYPE_OPTIONS = [
  { id: null, labelKey: 'filmsFilterAny' },
  { id: 'feature', labelKey: 'filmsFilterTypeFeature' },
  { id: 'cartoon', labelKey: 'filmsFilterTypeCartoon' },
  { id: 'anime', labelKey: 'filmsFilterTypeAnime' },
  { id: 'doc', labelKey: 'filmsFilterTypeDoc' },
];

export const FILMS_FILTER_ATMOS_OPTIONS = [
  { id: null, labelKey: 'filmsFilterAny' },
  { id: 'cozy_a', labelKey: 'filmsFilterAtmosCozy' },
  { id: 'calm', labelKey: 'filmsFilterAtmosCalm' },
  { id: 'light', labelKey: 'filmsFilterAtmosLight' },
  { id: 'warm', labelKey: 'filmsFilterAtmosWarm' },
  { id: 'nostalgia', labelKey: 'filmsFilterAtmosNostalgia' },
  { id: 'inspiring', labelKey: 'filmsFilterAtmosInspiring' },
  { id: 'aesthetic', labelKey: 'filmsFilterAtmosAesthetic' },
];

/** @param {string[] | null | undefined} selected */
function tagDimensionPasses(tags, selected, tagKey) {
  if (!selected || selected.length === 0) return true;
  const arr = tags[tagKey];
  if (!arr || !Array.isArray(arr)) return false;
  return selected.some((id) => {
    if (tagKey === 'genre' && id === 'romance_romcom') {
      return arr.includes('romance') || arr.includes('romcom');
    }
    return arr.includes(id);
  });
}

/**
 * @param {{ moods?: string[], genres?: string[], types?: string[], atmospheres?: string[] }} filters
 * Несколько значений в одной оси: фильм подходит, если совпадает хотя бы одно (ИЛИ внутри оси, И между осями).
 */
export function filmPassesHubFilters(film, { moods, genres, types, atmospheres }) {
  const tags = film.tags;
  if (!tags) return true;
  if (!tagDimensionPasses(tags, moods, 'mood')) return false;
  if (!tagDimensionPasses(tags, genres, 'genre')) return false;
  if (!tagDimensionPasses(tags, types, 'type')) return false;
  if (!tagDimensionPasses(tags, atmospheres, 'atmosphere')) return false;
  return true;
}
