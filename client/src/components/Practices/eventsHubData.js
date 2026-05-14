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
