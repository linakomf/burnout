import { natureAt, SPACE_NATURE_HERO_REF } from './spaceNatureImagery';

const PRICE_LOW = new Set(['eventsEvPriceFrom1000', 'eventsEvPriceFrom1500']);
const PRICE_MID = new Set(['eventsEvPriceFrom2000', 'eventsEvPriceFrom3000']);
const PRICE_HIGH = new Set(['eventsEvPriceFrom4000', 'eventsEvPriceFrom5000']);

export const TB_LOC = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'almaty', labelKey: 'eventsEvTagAlmaty' },
];

export const TB_DATE = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'today', labelKey: 'eventsTbOptDateToday' },
  { id: 'weekend', labelKey: 'eventsTbOptDateWeekend' },
  { id: 'this_month', labelKey: 'eventsTbOptDateMonth' },
];

export const TB_TIME = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'morning', labelKey: 'eventsTbOptTimeMorning' },
  { id: 'afternoon', labelKey: 'eventsTbOptTimeAfternoon' },
  { id: 'evening', labelKey: 'eventsTbOptTimeEvening' },
];

export const TB_PRICE = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'free', labelKey: 'eventsTbOptPriceFree' },
  { id: 'low', labelKey: 'eventsTbOptPriceLow' },
  { id: 'mid', labelKey: 'eventsTbOptPriceMid' },
  { id: 'high', labelKey: 'eventsTbOptPriceHigh' },
];

export const TB_MOOD = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'calm', labelKey: 'eventsTbOptMoodCalm' },
  { id: 'energy', labelKey: 'eventsTbOptMoodEnergy' },
  { id: 'social', labelKey: 'eventsTbOptMoodSocial' },
  { id: 'creative', labelKey: 'eventsTbOptMoodCreative' },
  { id: 'active', labelKey: 'eventsTbOptMoodActive' },
  { id: 'curious', labelKey: 'eventsTbOptMoodCurious' },
];

export const HERO_SOLO_BG = SPACE_NATURE_HERO_REF;
export const HERO_GROUP_BG = natureAt(62);

export function priceTier(priceKey) {
  if (priceKey === 'eventsEvPriceFree') return 'free';
  if (PRICE_LOW.has(priceKey)) return 'low';
  if (PRICE_MID.has(priceKey)) return 'mid';
  if (PRICE_HIGH.has(priceKey)) return 'high';
  return 'high';
}

export function matchesToolbarFilters(item, tfLoc, tfDate, tfTime, tfPrice, tfMood) {
  if (tfLoc && item.tf.loc !== tfLoc) return false;
  if (tfDate && item.tf.date !== tfDate) return false;
  if (tfTime && item.tf.time !== tfTime) return false;
  if (tfPrice && priceTier(item.priceKey) !== tfPrice) return false;
  if (tfMood && item.tf.mood !== tfMood) return false;
  return true;
}

export function tbPillLabel(selectedId, options, placeholderKey, t) {
  if (selectedId == null) return t(`pages.${placeholderKey}`);
  const opt = options.find((o) => o.id === selectedId);
  return opt ? t(`pages.${opt.labelKey}`) : t(`pages.${placeholderKey}`);
}
