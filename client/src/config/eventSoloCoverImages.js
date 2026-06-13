
const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

export const EVENT_SOLO_COVER_BY_TITLE = {
  'Мастер-класс по гончарному делу': `${publicBase}/images/events/solo-pottery.png`,
  'Арт-вечер Carpe Diem': `${publicBase}/images/events/solo-art-evening.png`,
  'Лекции в Art Society': `${publicBase}/images/events/solo-art-society.png`,
  'Stand Up концерт': `${publicBase}/images/events/solo-standup.png`,
  'Мастер-класс по живописи': `${publicBase}/images/events/solo-painting.png`,
  'Балет «Лебединое озеро»': `${publicBase}/images/events/solo-ballet.png`,
  'Органная музыка в филармонии': `${publicBase}/images/events/solo-organ.png`,
  'Спектакль в ARTiШОК': `${publicBase}/images/events/solo-artishok.png`,
};

export const EVENT_GROUP_COVER_BY_TITLE = {
  'Игровой вечер Catan Almaty': `${publicBase}/images/events/group-catan.png`,
  'Белые вина нового света': `${publicBase}/images/events/group-white-wine.png`,
  'New Vision Forum 2026': `${publicBase}/images/events/group-forum.png`,
  'Sparkling Wine Evening': `${publicBase}/images/events/group-sparkling.png`,
  'SATISFACTION Festival': `${publicBase}/images/events/group-festival.png`,
};

export function getEventCoverByTitle(title) {
  if (!title) return '';
  const key = title.trim();
  return EVENT_SOLO_COVER_BY_TITLE[key] || EVENT_GROUP_COVER_BY_TITLE[key] || '';
}
