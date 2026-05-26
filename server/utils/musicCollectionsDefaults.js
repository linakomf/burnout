/** Пять подборок на витрине «Музыка» (slug совпадает с id карточек на клиенте). */

const DEFAULT_MUSIC_COLLECTIONS = [
  {
    slug: 'mp-calm',
    label_key: 'musicMoodCalm',
    mood: 'calm_down',
    sort_order: 0,
  },
  {
    slug: 'mp-focus',
    label_key: 'musicMoodFocus',
    mood: 'concentration',
    sort_order: 1,
  },
  {
    slug: 'mp-morning',
    label_key: 'musicMoodMorning',
    mood: 'morning',
    sort_order: 2,
  },
  {
    slug: 'mp-sleep',
    label_key: 'musicMoodSleep',
    mood: 'rest',
    sort_order: 3,
  },
  {
    slug: 'mp-energy',
    label_key: 'musicMoodEnergy',
    mood: 'motivation',
    sort_order: 4,
  },
];

module.exports = { DEFAULT_MUSIC_COLLECTIONS };
