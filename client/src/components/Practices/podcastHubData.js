/** Подкасты - подборка, список выпусков, темы (ключи i18n pages.*) */

import { backendPublicUrl } from '../../utils/assetUrl';
import { natureAt } from './spaceNatureImagery';

export { MEDITATION_AUDIO_SOURCE_OPTIONS as PODCAST_AUDIO_SOURCE_OPTIONS } from './meditationHubData';

export const PODCAST_TOPIC_OPTIONS = [
  { id: 'psych', labelKey: 'podcastsTopicPsych' },
  { id: 'mind', labelKey: 'podcastsTopicMind' },
  { id: 'relations', labelKey: 'podcastsTopicRelations' },
  { id: 'growth', labelKey: 'podcastsTopicGrowth' },
  { id: 'mental', labelKey: 'podcastsTopicMental' },
  { id: 'motiv', labelKey: 'podcastsTopicMotiv' },
];

export function isRemotePodcastId(id) {
  return /^podcast-\d+$/.test(String(id || ''));
}

export function mapRemotePodcastPayload(row, toUrl) {
  const urlFn = toUrl || backendPublicUrl;
  const poster = urlFn(row.poster || row.coverImage);
  const audioUrl =
    row.audioSource === 'file' ? urlFn(row.audioUrl) : row.audioUrl || '';
  const durationDisplay = row.duration || row.totalDisplay || '24:00';

  return {
    id: row.id,
    title: row.title || '',
    showName: row.showName || '',
    descriptionShort: row.descriptionShort || '',
    metaLine: row.metaLine || '',
    topic: row.topic || 'psych',
    episodeNum: row.episodeNum || 1,
    durationMin: row.durationMin || 24,
    duration: durationDisplay,
    totalDisplay: durationDisplay,
    progressDisplay: row.progressDisplay || '0:00',
    isFeaturedPick: Boolean(row.isFeaturedPick),
    poster,
    titleKey: null,
    showKey: null,
    descKey: null,
    metaKey: null,
    audioSource: row.audioSource || (row.embedUrl ? 'youtube' : 'url'),
    audioUrl,
    embedUrl: row.embedUrl || '',
    watchUrl: row.watchUrl || '',
    hasAudio: Boolean(row.hasAudio),
    isRemotePodcast: true,
  };
}

export function podcastTitle(ep, t) {
  if (ep.title) return ep.title;
  if (ep.titleKey) return t(`pages.${ep.titleKey}`);
  return '';
}

export function podcastShow(ep, t) {
  if (ep.showName) return ep.showName;
  if (ep.showKey) return t(`pages.${ep.showKey}`);
  return '';
}

export function podcastDesc(ep, t) {
  if (ep.descriptionShort) return ep.descriptionShort;
  if (ep.descKey) return t(`pages.${ep.descKey}`);
  return '';
}

export function podcastMeta(ep, t) {
  if (ep.metaLine) return ep.metaLine;
  if (ep.metaKey) return t(`pages.${ep.metaKey}`);
  return '';
}

export function findEpisodeInPool(id, pool) {
  return pool.find((e) => e.id === id) || null;
}

export const PODCAST_EPISODES = [
  {
    id: 'pc1',
    titleKey: 'podcastsEp1Title',
    showKey: 'podcastsEp1Show',
    descKey: 'podcastsEp1Desc',
    metaKey: 'podcastsEp1Meta',
    episodeNum: 12,
    duration: '24:00',
    progressDisplay: '10:36',
    totalDisplay: '24:00',
    poster: natureAt(300),
    embedUrl: 'https://www.youtube-nocookie.com/embed/O-6f5wQXSu8',
    watchUrl: 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
  },
  {
    id: 'pc2',
    titleKey: 'podcastsEp2Title',
    showKey: 'podcastsEp2Show',
    descKey: 'podcastsEp2Desc',
    metaKey: 'podcastsEp2Meta',
    episodeNum: 8,
    duration: '18:20',
    progressDisplay: '6:12',
    totalDisplay: '18:20',
    poster: natureAt(301),
    embedUrl: 'https://www.youtube-nocookie.com/embed/4cYuWLZI5kw',
    watchUrl: 'https://www.youtube.com/watch?v=4cYuWLZI5kw',
  },
  {
    id: 'pc3',
    titleKey: 'podcastsEp3Title',
    showKey: 'podcastsEp3Show',
    descKey: 'podcastsEp3Desc',
    metaKey: 'podcastsEp3Meta',
    episodeNum: 21,
    duration: '32:08',
    progressDisplay: '14:02',
    totalDisplay: '32:08',
    poster: natureAt(302),
    embedUrl: 'https://www.youtube-nocookie.com/embed/syjEN3peCJw',
    watchUrl: 'https://www.youtube.com/watch?v=syjEN3peCJw',
  },
  {
    id: 'pc4',
    titleKey: 'podcastsEp4Title',
    showKey: 'podcastsEp4Show',
    descKey: 'podcastsEp4Desc',
    metaKey: 'podcastsEp4Meta',
    episodeNum: 4,
    duration: '15:44',
    progressDisplay: '3:10',
    totalDisplay: '15:44',
    poster: natureAt(303),
    embedUrl: 'https://www.youtube-nocookie.com/embed/8jPQjjsBbIc',
    watchUrl: 'https://www.youtube.com/watch?v=8jPQjjsBbIc',
  },
  {
    id: 'pc5',
    titleKey: 'podcastsEp5Title',
    showKey: 'podcastsEp5Show',
    descKey: 'podcastsEp5Desc',
    metaKey: 'podcastsEp5Meta',
    episodeNum: 9,
    duration: '28:16',
    progressDisplay: '9:05',
    totalDisplay: '28:16',
    poster: natureAt(304),
    embedUrl: 'https://www.youtube-nocookie.com/embed/WuUy7xKIsTA',
    watchUrl: 'https://www.youtube.com/watch?v=WuUy7xKIsTA',
  },
];

export const PODCAST_PICK_IDS = ['pc1', 'pc2', 'pc3', 'pc4'];

export const PODCAST_TOPICS = [
  { id: 'psych', labelKey: 'podcastsTopicPsych', style: 'purple' },
  { id: 'mind', labelKey: 'podcastsTopicMind', style: 'green' },
  { id: 'relations', labelKey: 'podcastsTopicRelations', style: 'pink' },
  { id: 'growth', labelKey: 'podcastsTopicGrowth', style: 'orange' },
  { id: 'mental', labelKey: 'podcastsTopicMental', style: 'blue' },
  { id: 'motiv', labelKey: 'podcastsTopicMotiv', style: 'lavender' },
];

export function findEpisodeById(id, pool = PODCAST_EPISODES) {
  return findEpisodeInPool(id, pool);
}
