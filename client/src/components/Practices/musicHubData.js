import { natureAt, spaceNature } from './spaceNatureImagery';

export const MUSIC_HERO_IMG = spaceNature.musicHero;
/** Та же иллюстрация, что в герое — обложка «подборки дня» в плеере */
export const MUSIC_FEATURED_POSTER = MUSIC_HERO_IMG;

/** Основные треки / подборки */
export const MUSIC_TRACKS = [
  {
    id: 'm1',
    titleKey: 'musicTrack1Title',
    artistKey: 'musicTrack1Artist',
    genreKey: 'musicTrackGenreAmbient',
    mood: 'focus',
    durationShort: '3:00',
    poster: natureAt(200),
    embedUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk',
    watchUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  },
  {
    id: 'm2',
    titleKey: 'musicTrack2Title',
    artistKey: 'musicTrack2Artist',
    genreKey: 'musicTrackGenreInstrumental',
    mood: 'calm',
    durationShort: '3:45',
    poster: MUSIC_FEATURED_POSTER,
    embedUrl: 'https://www.youtube-nocookie.com/embed/lTRiuFIWV54',
    watchUrl: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
  },
  {
    id: 'm3',
    titleKey: 'musicTrack3Title',
    artistKey: 'musicTrack3Artist',
    genreKey: 'musicTrackGenreNature',
    mood: 'sleep',
    durationShort: '4:12',
    poster: natureAt(202),
    embedUrl: 'https://www.youtube-nocookie.com/embed/nDq6TstdEi8',
    watchUrl: 'https://www.youtube.com/watch?v=nDq6TstdEi8',
  },
  {
    id: 'm4',
    titleKey: 'musicTrack4Title',
    artistKey: 'musicTrack4Artist',
    genreKey: 'musicTrackGenreAcoustic',
    mood: 'mood',
    durationShort: '3:28',
    poster: natureAt(203),
    embedUrl: 'https://www.youtube-nocookie.com/embed/Dx5qFachd3A',
    watchUrl: 'https://www.youtube.com/watch?v=Dx5qFachd3A',
  },
  {
    id: 'm5',
    titleKey: 'musicTrack5Title',
    artistKey: 'musicTrack5Artist',
    genreKey: 'musicTrackGenreAmbient',
    mood: 'calm',
    durationShort: '2:55',
    poster: natureAt(204),
    embedUrl: 'https://www.youtube-nocookie.com/embed/1ZYbU82GVz4',
    watchUrl: 'https://www.youtube.com/watch?v=1ZYbU82GVz4',
  },
  {
    id: 'm6',
    titleKey: 'musicTrack6Title',
    artistKey: 'musicTrack6Artist',
    genreKey: 'musicTrackGenrePiano',
    mood: 'focus',
    durationShort: '4:01',
    poster: natureAt(205),
    embedUrl: 'https://www.youtube-nocookie.com/embed/LlvU9GiZlgM',
    watchUrl: 'https://www.youtube.com/watch?v=LlvU9GiZlgM',
  },
];

/** Подборка дня — тот же контент, что в макете (спокойствие) */
export const FEATURED_TRACK_ID = 'm2';

/** Карточки «под настроение» */
export const MOOD_PLAYLISTS = [
  {
    id: 'mp-calm',
    mood: 'calm',
    labelKey: 'musicMoodCalm',
    tracksCount: 12,
    image: MUSIC_HERO_IMG,
  },
  {
    id: 'mp-focus',
    mood: 'focus',
    labelKey: 'musicMoodFocus',
    tracksCount: 8,
    image: natureAt(206),
  },
  {
    id: 'mp-morning',
    mood: 'mood',
    labelKey: 'musicMoodMorning',
    tracksCount: 10,
    image: natureAt(207),
  },
  {
    id: 'mp-sleep',
    mood: 'sleep',
    labelKey: 'musicMoodSleep',
    tracksCount: 9,
    image: natureAt(208),
  },
  {
    id: 'mp-energy',
    mood: 'mood',
    labelKey: 'musicMoodEnergy',
    tracksCount: 7,
    image: natureAt(209),
  },
  {
    id: 'mp-nature',
    mood: 'calm',
    labelKey: 'musicMoodNature',
    tracksCount: 15,
    image: natureAt(210),
  },
];

/** Быстрые звуки: иконка lucide-имени + embed */
export const QUICK_SOUNDS = [
  {
    id: 'qs-rain',
    icon: 'CloudRain',
    labelKey: 'musicQuickRain',
    poster: natureAt(220),
    embedUrl: 'https://www.youtube-nocookie.com/embed/mPZkdNFkNps',
    watchUrl: 'https://www.youtube.com/watch?v=mPZkdNFkNps',
  },
  {
    id: 'qs-sea',
    icon: 'Waves',
    labelKey: 'musicQuickSea',
    poster: natureAt(221),
    embedUrl: 'https://www.youtube-nocookie.com/embed/WHPEKLQID4U',
    watchUrl: 'https://www.youtube.com/watch?v=WHPEKLQID4U',
  },
  {
    id: 'qs-forest',
    icon: 'Trees',
    labelKey: 'musicQuickForest',
    poster: natureAt(222),
    embedUrl: 'https://www.youtube-nocookie.com/embed/xNN7IJAOC4U',
    watchUrl: 'https://www.youtube.com/watch?v=xNN7IJAOC4U',
  },
  {
    id: 'qs-wind',
    icon: 'Wind',
    labelKey: 'musicQuickWind',
    poster: natureAt(223),
    embedUrl: 'https://www.youtube-nocookie.com/embed/eZjACMUWdBs',
    watchUrl: 'https://www.youtube.com/watch?v=eZjACMUWdBs',
  },
  {
    id: 'qs-white',
    icon: 'Radio',
    labelKey: 'musicQuickWhite',
    poster: natureAt(224),
    embedUrl: 'https://www.youtube-nocookie.com/embed/nMfPqeZjc2c',
    watchUrl: 'https://www.youtube.com/watch?v=nMfPqeZjc2c',
  },
  {
    id: 'qs-piano',
    icon: 'Music',
    labelKey: 'musicQuickPiano',
    poster: natureAt(225),
    embedUrl: 'https://www.youtube-nocookie.com/embed/lTRiuFIWV54',
    watchUrl: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
  },
  {
    id: 'qs-fire',
    icon: 'Flame',
    labelKey: 'musicQuickFire',
    poster: natureAt(226),
    embedUrl: 'https://www.youtube-nocookie.com/embed/UgHKb_7884o',
    watchUrl: 'https://www.youtube.com/watch?v=UgHKb_7884o',
  },
  {
    id: 'qs-birds',
    icon: 'Bird',
    labelKey: 'musicQuickBirds',
    poster: natureAt(227),
    embedUrl: 'https://www.youtube-nocookie.com/embed/mFjUklCiogI',
    watchUrl: 'https://www.youtube.com/watch?v=mFjUklCiogI',
  },
];

/** Выбор по состоянию → подсветка настроения в подборках */
export const STATE_CARDS = [
  {
    id: 'st-anxiety',
    mood: 'calm',
    labelKey: 'musicStateAnxiety',
    descKey: 'musicStateAnxietyDesc',
    tint: 'linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%)',
  },
  {
    id: 'st-fatigue',
    mood: 'sleep',
    labelKey: 'musicStateFatigue',
    descKey: 'musicStateFatigueDesc',
    tint: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
  },
  {
    id: 'st-focus',
    mood: 'focus',
    labelKey: 'musicStateFocus',
    descKey: 'musicStateFocusDesc',
    tint: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
  },
  {
    id: 'st-burnout',
    mood: 'calm',
    labelKey: 'musicStateBurnout',
    descKey: 'musicStateBurnoutDesc',
    tint: 'linear-gradient(135deg, #fce7f3 0%, #fdf2f8 100%)',
  },
  {
    id: 'st-mood',
    mood: 'mood',
    labelKey: 'musicStateMood',
    descKey: 'musicStateMoodDesc',
    tint: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
  },
  {
    id: 'st-over',
    mood: 'focus',
    labelKey: 'musicStateOver',
    descKey: 'musicStateOverDesc',
    tint: 'linear-gradient(135deg, #cffafe 0%, #ecfeff 100%)',
  },
];

export function findPlayableById(id) {
  const t = MUSIC_TRACKS.find((x) => x.id === id);
  if (t) return { kind: 'track', ...t };
  const q = QUICK_SOUNDS.find((x) => x.id === id);
  if (q)
    return {
      kind: 'quick',
      id: q.id,
      titleKey: q.labelKey,
      artistKey: 'musicQuickSoundArtist',
      genreKey: 'musicQuickSoundGenre',
      durationShort: '∞',
      poster: q.poster,
      embedUrl: q.embedUrl,
      watchUrl: q.watchUrl,
    };
  return null;
}
