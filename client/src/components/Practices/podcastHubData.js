/** Подкасты - подборка, список выпусков, темы (ключи i18n pages.*) */

import { natureAt } from './spaceNatureImagery';

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

export function findEpisodeById(id) {
  return PODCAST_EPISODES.find((e) => e.id === id) || null;
}
