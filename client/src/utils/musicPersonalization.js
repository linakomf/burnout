

const LIKE_TO_MUSIC_MOODS = {
  music: ['calm_down', 'rest', 'evening', 'motivation'],
  breathing: ['calm_down', 'rest', 'recovery'],
  quiet: ['calm_down', 'concentration', 'morning'],
  movement: ['motivation', 'morning', 'tired'],
  creative: ['motivation', 'distract', 'morning'],
  social: ['calm_down', 'evening', 'recovery'],
  nature: ['recovery', 'rest', 'calm_down'],
  structure: ['concentration', 'morning'],
};

export function moodsForPersonalizationLikes(likes) {
  const out = [];
  const seen = new Set();
  for (const like of likes || []) {
    const moods = LIKE_TO_MUSIC_MOODS[String(like || '').trim()];
    if (!moods) continue;
    for (const m of moods) {
      if (!seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
  }
  return out;
}

export function pickPersonalizedTracks(tracks, likes, limit = 8) {
  const moods = moodsForPersonalizationLikes(likes);
  if (!moods.length) return [];
  return tracks
    .filter((tr) => tr.kind !== 'quick' && moods.includes(String(tr.mood || '').trim()))
    .slice(0, limit);
}
