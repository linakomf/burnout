/** Разделы «Пространство» — отдельные маршруты /practices/:section */

export const SPACE_SECTIONS = [
  { id: 'films', path: 'films', labelKey: 'practicesPocketFilmsTitle', pocketLabel: 'Films' },
  { id: 'meditation', path: 'meditation', labelKey: 'practicesPocketMeditationTitle', pocketLabel: 'Meditation' },
  { id: 'events', path: 'events', labelKey: 'practicesPocketEventsTitle', pocketLabel: 'Events' },
  { id: 'articles', path: 'articles', labelKey: 'practicesPocketArticlesTitle', pocketLabel: 'Articles' },
  { id: 'music', path: 'music', labelKey: 'practicesPocketMusicTitle', pocketLabel: 'Music' },
  { id: 'podcasts', path: 'podcasts', labelKey: 'practicesPocketPodcastsTitle', pocketLabel: 'Podcasts' },
];

const SECTION_IDS = new Set(SPACE_SECTIONS.map((s) => s.id));

export function isValidSpaceSection(id) {
  return SECTION_IDS.has(String(id || '').trim());
}

export function spaceHubHref() {
  return '/practices';
}

export function spaceSectionHref(section) {
  const id = String(section || '').trim();
  if (!id || !isValidSpaceSection(id)) return spaceHubHref();
  const row = SPACE_SECTIONS.find((s) => s.id === id);
  return `/practices/${row?.path || id}`;
}
