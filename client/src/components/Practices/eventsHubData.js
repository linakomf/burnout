/** Демо-карточки для страницы «События» (подборки одиночные / в компании) */

import { natureAt, natureGallery } from './spaceNatureImagery';

const IMG = {
  flowers: natureAt(2),
  gallery: natureAt(3),
  cinema: natureAt(4),
  pottery: natureAt(5),
  hike: natureAt(6),
  yoga: natureAt(7),
  boardgame: natureAt(8),
  city: natureAt(9),
};

/** Поля tf - значения для панели фильтров (локация, дата, время, настроение); цена считается по priceKey */
export const EVENTS_SOLO_ROW = [
  {
    id: 'ev-solo-1',
    filterCat: 'concerts',
    tf: { loc: 'almaty', date: 'this_month', time: 'evening', mood: 'energy' },
    image: IMG.flowers,
    categoryKey: 'eventsEvCatConcert',
    titleKey: 'eventsEvSolo1Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'building', key: 'eventsEvTagOffline' },
      { kind: 'clock', key: 'eventsEvSolo1When' },
    ],
    priceKey: 'eventsEvPriceFrom3000',
  },
  {
    id: 'ev-solo-2',
    filterCat: 'exhibitions',
    tf: { loc: 'almaty', date: 'this_month', time: 'evening', mood: 'calm' },
    image: IMG.gallery,
    categoryKey: 'eventsEvCatExhibition',
    titleKey: 'eventsEvSolo2Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvSolo2Until' },
      { kind: 'building', key: 'eventsEvTagOffline' },
    ],
    priceKey: 'eventsEvPriceFrom1500',
  },
  {
    id: 'ev-solo-3',
    filterCat: 'cinema',
    tf: { loc: 'almaty', date: 'today', time: 'evening', mood: 'calm' },
    image: IMG.cinema,
    categoryKey: 'eventsEvCatCinema',
    titleKey: 'eventsEvSolo3Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvSolo3When' },
      { kind: 'building', key: 'eventsEvTagOffline' },
    ],
    priceKey: 'eventsEvPriceFrom2000',
  },
  {
    id: 'ev-solo-4',
    filterCat: 'workshops',
    tf: { loc: 'almaty', date: 'this_month', time: 'afternoon', mood: 'creative' },
    image: IMG.pottery,
    categoryKey: 'eventsEvCatWorkshop',
    titleKey: 'eventsEvSolo4Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvSolo4When' },
      { kind: 'building', key: 'eventsEvTagOffline' },
    ],
    priceKey: 'eventsEvPriceFrom4000',
  },
];

export const EVENTS_GROUP_ROW = [
  {
    id: 'ev-group-1',
    filterCat: 'other',
    tf: { loc: 'almaty', date: 'this_month', time: 'morning', mood: 'active' },
    image: IMG.hike,
    categoryKey: 'eventsEvCatHike',
    titleKey: 'eventsEvGroup1Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvGroup1When' },
      { kind: 'building', key: 'eventsEvTagOffline' },
      { kind: 'users', key: 'eventsEvTagInCompany' },
    ],
    priceKey: 'eventsEvPriceFrom5000',
  },
  {
    id: 'ev-group-2',
    filterCat: 'other',
    tf: { loc: 'almaty', date: 'weekend', time: 'morning', mood: 'calm' },
    image: IMG.yoga,
    categoryKey: 'eventsEvCatYoga',
    titleKey: 'eventsEvGroup2Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvGroup2When' },
      { kind: 'building', key: 'eventsEvTagOffline' },
      { kind: 'users', key: 'eventsEvTagInCompany' },
    ],
    priceKey: 'eventsEvPriceFree',
  },
  {
    id: 'ev-group-3',
    filterCat: 'lectures',
    tf: { loc: 'almaty', date: 'this_month', time: 'evening', mood: 'social' },
    image: IMG.boardgame,
    categoryKey: 'eventsEvCatGames',
    titleKey: 'eventsEvGroup3Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvGroup3When' },
      { kind: 'building', key: 'eventsEvTagOffline' },
      { kind: 'users', key: 'eventsEvTagInCompany' },
    ],
    priceKey: 'eventsEvPriceFrom1000',
  },
  {
    id: 'ev-group-4',
    filterCat: 'theater',
    tf: { loc: 'almaty', date: 'this_month', time: 'afternoon', mood: 'curious' },
    image: IMG.city,
    categoryKey: 'eventsEvCatTour',
    titleKey: 'eventsEvGroup4Title',
    tags: [
      { kind: 'map', key: 'eventsEvTagAlmaty' },
      { kind: 'clock', key: 'eventsEvGroup4When' },
      { kind: 'building', key: 'eventsEvTagOffline' },
      { kind: 'users', key: 'eventsEvTagInCompany' },
    ],
    priceKey: 'eventsEvPriceFrom2000',
  },
];

export const ALL_EVENTS = [...EVENTS_SOLO_ROW, ...EVENTS_GROUP_ROW];

/** Тип подборки на странице «События» */
export const EVENT_KIND_OPTIONS = [
  { id: 'solo', label: 'Один' },
  { id: 'group', label: 'В компании' },
];

/** Категории чипов (filter_cat) — как в EventsPracticeHub, без nature */
export const EVENT_FILTER_CAT_OPTIONS = [
  { id: 'concerts', labelKey: 'eventsCatConcerts' },
  { id: 'cinema', labelKey: 'eventsCatCinema' },
  { id: 'exhibitions', labelKey: 'eventsCatExhibitions' },
  { id: 'theater', labelKey: 'eventsCatTheater' },
  { id: 'workshops', labelKey: 'eventsCatWorkshops' },
  { id: 'lectures', labelKey: 'eventsCatLectures' },
  { id: 'other', labelKey: 'eventsCatOther' },
];

export const EVENT_PRICE_OPTIONS = [
  { id: 'eventsEvPriceFree', labelKey: 'eventsEvPriceFree' },
  { id: 'eventsEvPriceFrom1000', labelKey: 'eventsEvPriceFrom1000' },
  { id: 'eventsEvPriceFrom1500', labelKey: 'eventsEvPriceFrom1500' },
  { id: 'eventsEvPriceFrom2000', labelKey: 'eventsEvPriceFrom2000' },
  { id: 'eventsEvPriceFrom3000', labelKey: 'eventsEvPriceFrom3000' },
  { id: 'eventsEvPriceFrom4000', labelKey: 'eventsEvPriceFrom4000' },
  { id: 'eventsEvPriceFrom5000', labelKey: 'eventsEvPriceFrom5000' },
];

export const EVENT_TF_LOC_OPTIONS = [{ id: 'almaty', labelKey: 'eventsEvTagAlmaty' }];
export const EVENT_TF_DATE_OPTIONS = [
  { id: 'today', labelKey: 'eventsTbOptDateToday' },
  { id: 'weekend', labelKey: 'eventsTbOptDateWeekend' },
  { id: 'this_month', labelKey: 'eventsTbOptDateMonth' },
];
export const EVENT_TF_TIME_OPTIONS = [
  { id: 'morning', labelKey: 'eventsTbOptTimeMorning' },
  { id: 'afternoon', labelKey: 'eventsTbOptTimeAfternoon' },
  { id: 'evening', labelKey: 'eventsTbOptTimeEvening' },
];
export const EVENT_TF_MOOD_OPTIONS = [
  { id: 'calm', labelKey: 'eventsTbOptMoodCalm' },
  { id: 'energy', labelKey: 'eventsTbOptMoodEnergy' },
  { id: 'social', labelKey: 'eventsTbOptMoodSocial' },
  { id: 'creative', labelKey: 'eventsTbOptMoodCreative' },
  { id: 'active', labelKey: 'eventsTbOptMoodActive' },
  { id: 'curious', labelKey: 'eventsTbOptMoodCurious' },
];

export function isRemoteEventId(id) {
  return /^event-\d+$/.test(String(id || ''));
}

export function mapRemoteEventPayload(row, backendUrl) {
  const toUrl = backendUrl || ((p) => p);
  const d = row.detail || {};
  const gallery = Array.isArray(d.gallery) ? d.gallery.map(toUrl).filter(Boolean) : [];
  return {
    id: row.id,
    kind: row.kind || 'solo',
    filterCat: row.filterCat || 'other',
    tf: row.tf || { loc: 'almaty', date: 'this_month', time: 'evening', mood: 'calm' },
    image: toUrl(row.image),
    categoryLabel: row.categoryLabel || '',
    title: row.title || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    priceKey: row.priceKey || 'eventsEvPriceFrom2000',
    isRemoteEvent: true,
    detail: {
      ticketUrl: d.ticketUrl || '',
      heroImage: toUrl(d.heroImage || row.image),
      venueLine: d.venueLine || '',
      teaser: d.teaser || '',
      aboutText: d.aboutText || '',
      durationLabel: d.durationLabel || '',
      ageLabel: d.ageLabel || '',
      genreLabel: d.genreLabel || '',
      refundLabel: d.refundLabel || '',
      venueImage: toUrl(d.venueImage),
      venuePinText: d.venuePinText || '',
      organizerName: d.organizerName || '',
      organizerDesc: d.organizerDesc || '',
      suitTags: Array.isArray(d.suitTags) ? d.suitTags : [],
      importantNotes: Array.isArray(d.importantNotes) ? d.importantNotes : [],
      gallery,
    },
  };
}

export function eventCardTitle(item, t) {
  if (item.title) return item.title;
  if (item.titleKey) return t(`pages.${item.titleKey}`);
  return '';
}

export function eventCardCategory(item, t) {
  if (item.categoryLabel) return item.categoryLabel;
  if (item.categoryKey) return t(`pages.${item.categoryKey}`);
  const opt = EVENT_FILTER_CAT_OPTIONS.find((o) => o.id === item.filterCat);
  return opt ? t(`pages.${opt.labelKey}`) : '';
}

export function eventTagLabel(tag, t) {
  if (tag.text) return tag.text;
  if (tag.key) return t(`pages.${tag.key}`);
  return '';
}

export function eventDateLine(event, t) {
  if (!event?.tags) return '';
  const clockTag = event.tags.find((tag) => tag.kind === 'clock');
  return clockTag ? eventTagLabel(clockTag, t) : '';
}

export function eventIsGroup(event) {
  if (event?.kind === 'group') return true;
  return Boolean(event?.tags?.some((tag) => tag.key === 'eventsEvTagInCompany'));
}

/** Единый вид полей детальной страницы (строки для рендера) */
export function resolveEventDetailView(event, staticDetail, t) {
  if (!event) return null;
  if (event.isRemoteEvent && event.detail) {
    const d = event.detail;
    return {
      ticketUrl: d.ticketUrl,
      heroImage: d.heroImage || event.image,
      venueLine: d.venueLine,
      teaser: d.teaser,
      aboutText: d.aboutText,
      durationLabel: d.durationLabel,
      ageLabel: d.ageLabel,
      genreLabel: d.genreLabel,
      refundLabel: d.refundLabel,
      venueImage: d.venueImage,
      venuePinText: d.venuePinText,
      organizerName: d.organizerName,
      organizerDesc: d.organizerDesc,
      suitTags: d.suitTags || [],
      importantNotes: d.importantNotes || [],
      gallery: d.gallery || [],
    };
  }
  if (!staticDetail) return null;
  return {
    ticketUrl: staticDetail.ticketUrl,
    heroImage: staticDetail.heroImage || event.image,
    venueLine: staticDetail.venueLineKey ? t(`pages.${staticDetail.venueLineKey}`) : '',
    teaser: staticDetail.teaserKey ? t(`pages.${staticDetail.teaserKey}`) : '',
    aboutText: staticDetail.aboutKey ? t(`pages.${staticDetail.aboutKey}`) : '',
    durationLabel: staticDetail.durationKey ? t(`pages.${staticDetail.durationKey}`) : '',
    ageLabel: staticDetail.ageKey ? t(`pages.${staticDetail.ageKey}`) : '',
    genreLabel: staticDetail.genreKey ? t(`pages.${staticDetail.genreKey}`) : '',
    refundLabel: staticDetail.refundKey ? t(`pages.${staticDetail.refundKey}`) : '',
    venueImage: staticDetail.venueImage,
    venuePinText: staticDetail.venuePinKey ? t(`pages.${staticDetail.venuePinKey}`) : '',
    organizerName: staticDetail.organizerNameKey ? t(`pages.${staticDetail.organizerNameKey}`) : '',
    organizerDesc: staticDetail.organizerDescKey ? t(`pages.${staticDetail.organizerDescKey}`) : '',
    suitTags: (staticDetail.suitTagKeys || []).map((k) => t(`pages.${k}`)),
    importantNotes: (staticDetail.importantKeys || []).map((k) => t(`pages.${k}`)),
    gallery: staticDetail.gallery || [],
  };
}

export function findEventById(id) {
  if (!id) return null;
  return ALL_EVENTS.find((e) => e.id === id) ?? null;
}

/** Детальная страница: герой, площадка и галереи - спокойная природа */
const DET = {
  hallNight: natureAt(11),
  museumBldg: natureAt(12),
  cinemaVenue: natureAt(13),
  studioVenue: natureAt(14),
  trailMeet: natureAt(15),
  parkVenue: natureAt(16),
  cafeVenue: natureAt(17),
  cityVenue: natureAt(18),
  heroConcert: natureAt(19),
  heroExpo: natureAt(20),
  gConcert: natureGallery(21, 4),
  gGallery: natureGallery(25, 4),
  gCinema: natureGallery(29, 4),
};

const gClayFixed = natureGallery(33, 4);

const gHike = natureGallery(37, 4);

const gYoga = natureGallery(41, 4);

const gBoard = natureGallery(45, 4);

const gCity = natureGallery(49, 4);

/**
 * Ссылки на продажу билетов / регистрацию (реальные площадки КЗ).
 * Параметр ref - для ориентира в аналитике; при необходимости замените на URL конкретного мероприятия.
 */
const TICKETS = {
  ticketonAlmaty: 'https://ticketon.kz/kz/cities/almaty',
  kassir: 'https://kassir.kz/kz',
};

/** Расширенные поля для EventDetailPage (ключи - в locales pages.*) */
export const EVENT_DETAILS = {
  'ev-solo-1': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-solo-1`,
    heroImage: DET.heroConcert,
    venueLineKey: 'eventsDetVenueS1',
    teaserKey: 'eventsDetTeaserS1',
    durationKey: 'eventsDetDur2h',
    ageKey: 'eventsDetAge12',
    genreKey: 'eventsDetGenreAcousticPop',
    refundKey: 'eventsDetRefund48',
    aboutKey: 'eventsDetAboutS1',
    venueImage: DET.hallNight,
    venuePinKey: 'eventsDetPinS1',
    suitTagKeys: ['eventsDetS1Suit1', 'eventsDetS1Suit2', 'eventsDetS1Suit3'],
    gallery: DET.gConcert,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDesc',
    importantKeys: ['eventsDetImp1', 'eventsDetImp2', 'eventsDetImp3'],
  },
  'ev-solo-2': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-solo-2`,
    heroImage: DET.heroExpo,
    venueLineKey: 'eventsDetVenueS2',
    teaserKey: 'eventsDetTeaserS2',
    durationKey: 'eventsDetDur2h30m',
    ageKey: 'eventsDetAge6',
    genreKey: 'eventsDetGenreArt',
    refundKey: 'eventsDetRefund48',
    aboutKey: 'eventsDetAboutS2',
    venueImage: DET.museumBldg,
    venuePinKey: 'eventsDetPinS2',
    suitTagKeys: ['eventsDetS2Suit1', 'eventsDetS2Suit2', 'eventsDetS2Suit3'],
    gallery: DET.gGallery,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDesc',
    importantKeys: ['eventsDetImp1', 'eventsDetImp2', 'eventsDetImp3'],
  },
  'ev-solo-3': {
    ticketUrl: `${TICKETS.kassir}?ref=burnout-ev-solo-3`,
    venueLineKey: 'eventsDetVenueS3',
    teaserKey: 'eventsDetTeaserS3',
    durationKey: 'eventsDetDur2h',
    ageKey: 'eventsDetAge12',
    genreKey: 'eventsDetGenreCinema',
    refundKey: 'eventsDetRefund24',
    aboutKey: 'eventsDetAboutS3',
    venueImage: DET.cinemaVenue,
    venuePinKey: 'eventsDetPinS3',
    suitTagKeys: ['eventsDetS3Suit1', 'eventsDetS3Suit2', 'eventsDetS3Suit3'],
    gallery: DET.gCinema,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDesc',
    importantKeys: ['eventsDetImp1', 'eventsDetImp2', 'eventsDetImp4'],
  },
  'ev-solo-4': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-solo-4`,
    venueLineKey: 'eventsDetVenueS4',
    teaserKey: 'eventsDetTeaserS4',
    durationKey: 'eventsDetDur3h',
    ageKey: 'eventsDetAge12',
    genreKey: 'eventsDetGenreCraft',
    refundKey: 'eventsDetRefund48',
    aboutKey: 'eventsDetAboutS4',
    venueImage: DET.studioVenue,
    venuePinKey: 'eventsDetPinS4',
    suitTagKeys: ['eventsDetS4Suit1', 'eventsDetS4Suit2', 'eventsDetS4Suit3'],
    gallery: gClayFixed,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDescCraft',
    importantKeys: ['eventsDetImp1', 'eventsDetImp5', 'eventsDetImp3'],
  },
  'ev-group-1': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-group-1`,
    venueLineKey: 'eventsDetVenueG1',
    teaserKey: 'eventsDetTeaserG1',
    durationKey: 'eventsDetDur4h',
    ageKey: 'eventsDetAge16',
    genreKey: 'eventsDetGenreHike',
    refundKey: 'eventsDetRefund48',
    aboutKey: 'eventsDetAboutG1',
    venueImage: DET.trailMeet,
    venuePinKey: 'eventsDetPinG1',
    suitTagKeys: ['eventsDetG1Suit1', 'eventsDetG1Suit2', 'eventsDetG1Suit3'],
    gallery: gHike,
    organizerNameKey: 'eventsDetOrgNameHike',
    organizerDescKey: 'eventsDetOrgDescHike',
    importantKeys: ['eventsDetImpG1', 'eventsDetImp2', 'eventsDetImpG2'],
  },
  'ev-group-2': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-group-2`,
    venueLineKey: 'eventsDetVenueG2',
    teaserKey: 'eventsDetTeaserG2',
    durationKey: 'eventsDetDur90m',
    ageKey: 'eventsDetAge12',
    genreKey: 'eventsDetGenreYoga',
    refundKey: 'eventsDetRefundNoRefund',
    aboutKey: 'eventsDetAboutG2',
    venueImage: DET.parkVenue,
    venuePinKey: 'eventsDetPinG2',
    suitTagKeys: ['eventsDetG2Suit1', 'eventsDetG2Suit2', 'eventsDetG2Suit3'],
    gallery: gYoga,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDescYoga',
    importantKeys: ['eventsDetImp1', 'eventsDetImpYoga', 'eventsDetImp3'],
  },
  'ev-group-3': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-group-3`,
    venueLineKey: 'eventsDetVenueG3',
    teaserKey: 'eventsDetTeaserG3',
    durationKey: 'eventsDetDur3h',
    ageKey: 'eventsDetAge12',
    genreKey: 'eventsDetGenreBoard',
    refundKey: 'eventsDetRefund24',
    aboutKey: 'eventsDetAboutG3',
    venueImage: DET.cafeVenue,
    venuePinKey: 'eventsDetPinG3',
    suitTagKeys: ['eventsDetG3Suit1', 'eventsDetG3Suit2', 'eventsDetG3Suit3'],
    gallery: gBoard,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDescGames',
    importantKeys: ['eventsDetImp1', 'eventsDetImp2', 'eventsDetImp6'],
  },
  'ev-group-4': {
    ticketUrl: `${TICKETS.ticketonAlmaty}?ref=burnout-ev-group-4`,
    venueLineKey: 'eventsDetVenueG4',
    teaserKey: 'eventsDetTeaserG4',
    durationKey: 'eventsDetDur2h30m',
    ageKey: 'eventsDetAge0',
    genreKey: 'eventsDetGenreCity',
    refundKey: 'eventsDetRefund48',
    aboutKey: 'eventsDetAboutG4',
    venueImage: DET.cityVenue,
    venuePinKey: 'eventsDetPinG4',
    suitTagKeys: ['eventsDetG4Suit1', 'eventsDetG4Suit2', 'eventsDetG4Suit3'],
    gallery: gCity,
    organizerNameKey: 'eventsDetOrgName',
    organizerDescKey: 'eventsDetOrgDescTour',
    importantKeys: ['eventsDetImp1', 'eventsDetImp2', 'eventsDetImpTour'],
  },
};
