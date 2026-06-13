

export const MUSIC_FILTER_MOOD_OPTIONS = [
  { id: null, labelKey: 'musicFilterAny' },
  { id: 'tired', labelKey: 'musicFilterMoodTired' },
  { id: 'calm_down', labelKey: 'musicFilterMoodCalmDown' },
  { id: 'distract', labelKey: 'musicFilterMoodDistract' },
  { id: 'concentration', labelKey: 'musicFilterMoodConcentration' },
  { id: 'rest', labelKey: 'musicFilterMoodRest' },
  { id: 'anxious', labelKey: 'musicFilterMoodAnxious' },
  { id: 'recovery', labelKey: 'musicFilterMoodRecovery' },
  { id: 'motivation', labelKey: 'musicFilterMoodMotivation' },
  { id: 'evening', labelKey: 'musicFilterMoodEvening' },
  { id: 'morning', labelKey: 'musicFilterMoodMorning' },
];

export const MUSIC_FILTER_GENRE_OPTIONS = [
  { id: null, labelKey: 'musicFilterAny' },
  { id: 'lofi', labelKey: 'musicFilterGenreLofi' },
  { id: 'piano', labelKey: 'musicFilterGenrePiano' },
  { id: 'ambient', labelKey: 'musicFilterGenreAmbient' },
  { id: 'nature_sounds', labelKey: 'musicFilterGenreNatureSounds' },
  { id: 'classical', labelKey: 'musicFilterGenreClassical' },
  { id: 'instrumental', labelKey: 'musicFilterGenreInstrumental' },
  { id: 'jazz', labelKey: 'musicFilterGenreJazz' },
  { id: 'acoustic', labelKey: 'musicFilterGenreAcoustic' },
  { id: 'chill_electronic', labelKey: 'musicFilterGenreChillElectronic' },
  { id: 'soft_vocals', labelKey: 'musicFilterGenreSoftVocals' },
];

const MOOD_IDS = new Set(MUSIC_FILTER_MOOD_OPTIONS.filter((o) => o.id).map((o) => o.id));
const GENRE_IDS = new Set(MUSIC_FILTER_GENRE_OPTIONS.filter((o) => o.id).map((o) => o.id));


const LEGACY_MOOD_TO_TAGS = {
  calm: ['calm_down', 'recovery', 'evening'],
  focus: ['concentration'],
  sleep: ['rest', 'evening', 'tired'],
  mood: ['motivation', 'morning'],
};

const GENRE_KEY_TO_ID = {
  musicTrackGenreAmbient: 'ambient',
  musicTrackGenreInstrumental: 'instrumental',
  musicTrackGenreNature: 'nature_sounds',
  musicTrackGenreAcoustic: 'acoustic',
  musicTrackGenrePiano: 'piano',
};

const GENRE_LABEL_ALIASES = {
  lofi: ['lo-fi', 'lofi', 'лоу-фай', 'лоу фай'],
  piano: ['piano', 'пиано', 'фортепиано'],
  ambient: ['ambient', 'эмбиент', 'эмибиент'],
  nature_sounds: ['nature', 'природа', 'nature sounds', 'звуки природы'],
  classical: ['classical', 'классика', 'классическая'],
  instrumental: ['instrumental', 'инструменталь'],
  jazz: ['jazz', 'джаз'],
  acoustic: ['acoustic', 'акустик'],
  chill_electronic: ['chill electronic', 'chill', 'чилл'],
  soft_vocals: ['soft vocals', 'vocals', 'вокал'],
};


export function getTrackMoodTags(track) {
  const m = String(track?.mood || '').trim();
  if (MOOD_IDS.has(m)) return [m];
  return LEGACY_MOOD_TO_TAGS[m] || (m ? [m] : []);
}

export function getTrackGenreTags(track) {
  const rawGenre = String(track?.genre || '').trim();
  if (GENRE_IDS.has(rawGenre)) return [rawGenre];

  if (track?.genreKey && GENRE_KEY_TO_ID[track.genreKey]) {
    return [GENRE_KEY_TO_ID[track.genreKey]];
  }

  const slugLabel = String(track?.genreLabel || '').trim();
  if (GENRE_IDS.has(slugLabel)) return [slugLabel];

  const label = slugLabel.toLowerCase();
  if (!label) return [];

  for (const [id, aliases] of Object.entries(GENRE_LABEL_ALIASES)) {
    if (aliases.some((a) => label.includes(a))) return [id];
  }
  return [];
}

function dimensionPasses(tags, selected) {
  if (!selected || selected.length === 0) return true;
  if (!tags.length) return false;
  return selected.some((id) => tags.includes(id));
}

export function trackPassesMusicFilters(track, { moods, genres }) {
  if (track?.kind === 'quick') return true;
  const moodTags = getTrackMoodTags(track);
  const genreTags = getTrackGenreTags(track);
  if (!dimensionPasses(moodTags, moods)) return false;
  if (!dimensionPasses(genreTags, genres)) return false;
  return true;
}

export { MOOD_IDS as MUSIC_MOOD_IDS, GENRE_IDS as MUSIC_GENRE_IDS };
