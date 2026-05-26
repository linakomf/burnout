import { backendPublicUrl } from '../../utils/assetUrl';
import {
  MUSIC_FILTER_GENRE_OPTIONS,
  MUSIC_FILTER_MOOD_OPTIONS,
} from './musicHubFilters';
import { natureAt, spaceNature } from './spaceNatureImagery';

export {
  MUSIC_FILTER_MOOD_OPTIONS,
  MUSIC_FILTER_GENRE_OPTIONS,
} from './musicHubFilters';

export const MUSIC_MOOD_OPTIONS = MUSIC_FILTER_MOOD_OPTIONS.filter((o) => o.id != null);
export const MUSIC_GENRE_OPTIONS = MUSIC_FILTER_GENRE_OPTIONS.filter((o) => o.id != null);

export const MUSIC_KIND_OPTIONS = [
  { id: 'track', label: 'Трек (рекомендации)' },
  { id: 'quick', label: 'Быстрый звук' },
];

export const MUSIC_QUICK_ICON_OPTIONS = [
  { id: 'CloudRain', label: 'Дождь' },
  { id: 'Waves', label: 'Море' },
  { id: 'Trees', label: 'Лес' },
  { id: 'Wind', label: 'Ветер' },
  { id: 'Radio', label: 'Шум' },
  { id: 'Music', label: 'Музыка' },
  { id: 'Flame', label: 'Огонь' },
  { id: 'Bird', label: 'Птицы' },
];

export { MEDITATION_AUDIO_SOURCE_OPTIONS as MUSIC_AUDIO_SOURCE_OPTIONS } from './meditationHubData';

export function isRemoteMusicId(id) {
  return /^music-(?:quick-)?\d+$/.test(String(id || ''));
}

export function mapRemoteMusicTrack(row, toUrl) {
  const urlFn = toUrl || backendPublicUrl;
  const poster = urlFn(row.poster || row.coverImage);
  const audioUrl =
    row.audioSource === 'file' ? urlFn(row.audioUrl) : row.audioUrl || '';
  return {
    id: row.id,
    kind: row.kind || 'track',
    title: row.title || '',
    artist: row.artist || '',
    mood: row.mood || 'calm_down',
    genre: row.genre_label || row.genreLabel || '',
    genreLabel: row.genre_label || row.genreLabel || '',
    titleKey: null,
    artistKey: null,
    genreKey: null,
    durationShort: row.durationShort || '3:00',
    durationMin: row.durationMin || 3,
    poster,
    audioSource: row.audioSource || (row.embedUrl ? 'youtube' : 'url'),
    audioUrl,
    embedUrl: row.embedUrl || '',
    watchUrl: row.watchUrl || '',
    descriptionShort: row.descriptionShort || '',
    hasAudio: Boolean(row.hasAudio),
    isRemoteMusic: true,
    isFeaturedPick: Boolean(row.isFeaturedPick),
  };
}

export function mapRemoteQuickSound(row, toUrl) {
  const base = mapRemoteMusicTrack(row, toUrl);
  return {
    ...base,
    kind: 'quick',
    icon: row.icon || 'Music2',
    labelKey: null,
    titleKey: null,
  };
}

export function musicTitle(item, t) {
  if (item.title) return item.title;
  if (item.titleKey) return t(`pages.${item.titleKey}`);
  if (item.labelKey) return t(`pages.${item.labelKey}`);
  return '';
}

export function musicArtist(item, t) {
  if (item.artist) return item.artist;
  if (item.artistKey) return t(`pages.${item.artistKey}`);
  if (item.kind === 'quick') return t('pages.musicQuickSoundArtist');
  return '';
}

export function musicGenre(item, t) {
  const slug = item.genre || item.genreLabel;
  const genreOpt = MUSIC_FILTER_GENRE_OPTIONS.find((o) => o.id === slug);
  if (genreOpt) return t(`pages.${genreOpt.labelKey}`);
  if (item.genreLabel) return item.genreLabel;
  if (item.genreKey) return t(`pages.${item.genreKey}`);
  if (item.kind === 'quick') return t('pages.musicQuickSoundGenre');
  return '';
}

export function findPlayableInPools(id, tracks, quickSounds) {
  const t = tracks.find((x) => x.id === id);
  if (t) return { kind: 'track', ...t };
  const q = quickSounds.find((x) => x.id === id);
  if (q) {
    return {
      kind: 'quick',
      id: q.id,
      titleKey: q.labelKey,
      labelKey: q.labelKey,
      title: q.title,
      artistKey: 'musicQuickSoundArtist',
      genreKey: 'musicQuickSoundGenre',
      durationShort: q.durationShort || '∞',
      poster: q.poster,
      icon: q.icon,
      audioSource: q.audioSource || (q.embedUrl ? 'youtube' : 'url'),
      audioUrl: q.audioUrl,
      embedUrl: q.embedUrl,
      watchUrl: q.watchUrl,
      durationMin: q.durationMin || 3,
      hasAudio: q.hasAudio !== false,
    };
  }
  return null;
}

export const MUSIC_HERO_IMG = spaceNature.musicHero;
/** Та же иллюстрация, что в герое - обложка «подборки дня» в плеере */
export const MUSIC_FEATURED_POSTER = MUSIC_HERO_IMG;

/** Основные треки / подборки */
export const MUSIC_TRACKS = [
  {
    id: 'm1',
    titleKey: 'musicTrack1Title',
    artistKey: 'musicTrack1Artist',
    genreKey: 'musicTrackGenreAmbient',
    mood: 'concentration',
    genre: 'lofi',
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
    mood: 'calm_down',
    genre: 'piano',
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
    mood: 'rest',
    genre: 'nature_sounds',
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
    mood: 'motivation',
    genre: 'acoustic',
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
    mood: 'recovery',
    genre: 'ambient',
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
    mood: 'concentration',
    genre: 'piano',
    durationShort: '4:01',
    poster: natureAt(205),
    embedUrl: 'https://www.youtube-nocookie.com/embed/LlvU9GiZlgM',
    watchUrl: 'https://www.youtube.com/watch?v=LlvU9GiZlgM',
  },
];

/** Подборка дня - тот же контент, что в макете (спокойствие) */
export const FEATURED_TRACK_ID = 'm2';

/** Карточки «под настроение» */
export const MOOD_PLAYLISTS = [
  {
    id: 'mp-calm',
    mood: 'calm_down',
    labelKey: 'musicMoodCalm',
    tracksCount: 12,
    image: MUSIC_HERO_IMG,
  },
  {
    id: 'mp-focus',
    mood: 'concentration',
    labelKey: 'musicMoodFocus',
    tracksCount: 8,
    image: natureAt(206),
  },
  {
    id: 'mp-morning',
    mood: 'morning',
    labelKey: 'musicMoodMorning',
    tracksCount: 10,
    image: natureAt(207),
  },
  {
    id: 'mp-sleep',
    mood: 'rest',
    labelKey: 'musicMoodSleep',
    tracksCount: 9,
    image: natureAt(208),
  },
  {
    id: 'mp-energy',
    mood: 'motivation',
    labelKey: 'musicMoodEnergy',
    tracksCount: 7,
    image: natureAt(209),
  },
];

/** Подборки с API → карточки на странице */
export function mapHubCollection(row) {
  if (!row) return null;
  const trackIds = Array.isArray(row.trackIds) ? row.trackIds : [];
  return {
    id: row.id || row.slug,
    slug: row.slug || row.id,
    title: row.title || '',
    mood: row.mood,
    labelKey: row.labelKey,
    trackIds,
    tracksCount: row.tracksCount ?? trackIds.length ?? 0,
    image: row.image ? backendPublicUrl(row.image) : MUSIC_HERO_IMG,
  };
}

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

export function findPlayableById(id, tracks = MUSIC_TRACKS, quickSounds = QUICK_SOUNDS) {
  return findPlayableInPools(id, tracks, quickSounds);
}
