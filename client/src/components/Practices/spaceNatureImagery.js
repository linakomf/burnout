/**
 * Спокойная природная эстетика для раздела «Пространство»:
 * поля, холмы, лес, небо — + локальный референс в public/space.
 */
const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

const u = (id, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

/** Герой с референсом пользователя (скопирован в public при сборке) */
export const SPACE_NATURE_HERO_REF = `${publicBase}/space/nature-hero-ref.png`;

const UNSPLASH_CALM = [
  u('photo-1501854140801-50d01698950b', 2000),
  u('photo-1500382017468-9049fed747ef', 2000),
  u('photo-1490750967868-88aa4486c946', 1800),
  u('photo-1472214103451-9374bd1c798e', 1800),
  u('photo-1464822759023-fed622ff2c3b', 1800),
  u('photo-1441974231531-c6227db76b66', 1800),
  u('photo-1506905925346-21bda4d32df4', 1800),
  u('photo-1519681393024-ddf20733a98b', 1800),
  u('photo-1465147726402-ce311856c8f6', 1800),
  u('photo-1499002238440-d264b2597d5b', 1800),
  u('photo-1432406961969-65f9feb15efd', 1800),
  u('photo-1518495973542-4542c06a5843', 1800),
  u('photo-1500534314209-a25ddb2bd429', 1600),
  u('photo-1518173946681-a1f78495b490', 1800),
  u('photo-1551632811-561732d1e306', 1800),
];

/** Все доступные кадры (референс первым — как на макете) */
export const naturePool = [SPACE_NATURE_HERO_REF, ...UNSPLASH_CALM];

export function natureAt(index) {
  return naturePool[Math.abs(index) % naturePool.length];
}

/** Несколько кадров подряд (галереи, сетки) */
export function natureGallery(startIndex, count = 4) {
  return Array.from({ length: count }, (_, i) => natureAt(startIndex + i));
}

export const spaceNature = {
  landingHero: SPACE_NATURE_HERO_REF,
  meditationHero: natureAt(5),
  musicHero: natureAt(6),
  filmCatalogHero: natureAt(2),
  filmBannerEvening: natureAt(3),
  filmBannerRestore: natureAt(4),
  articlesHero: natureAt(1),
};
