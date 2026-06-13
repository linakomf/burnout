

export const ADMIN_SPACE_SECTIONS = [
  { id: 'films', labelKey: 'adminFilms' },
  { id: 'meditation', labelKey: 'adminMeditations' },
  { id: 'events', labelKey: 'adminEvents' },
  { id: 'reading', labelKey: 'adminReading' },
  { id: 'music', labelKey: 'adminMusic' },
  { id: 'podcasts', labelKey: 'adminPodcasts' },
];

const SECTION_IDS = new Set(ADMIN_SPACE_SECTIONS.map((s) => s.id));

export function isValidAdminSpaceSection(id) {
  return SECTION_IDS.has(String(id || '').trim());
}

export const DEFAULT_ADMIN_SPACE_SECTION = 'films';
