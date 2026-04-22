import { format } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';

/**
 * Две строки для кнопки недели: дата + день.
 * kz: t(`cal.months.n`), t(`cal.weekdayLong.n`) Monday=0
 */
export function weekPillLines(day, lang, t) {
  if (lang === 'en') {
    return {
      dateLine: format(day, 'd MMMM', { locale: enUS }),
      wdayLine: format(day, 'EEEE', { locale: enUS }),
    };
  }
  if (lang === 'ru') {
    return {
      dateLine: format(day, 'd MMMM', { locale: ru }),
      wdayLine: format(day, 'EEEE', { locale: ru }),
    };
  }
  const d = day.getDate();
  const m = day.getMonth();
  const mon0 = (day.getDay() + 6) % 7;
  return {
    dateLine: `${d} ${t(`cal.months.${m}`)}`,
    wdayLine: t(`cal.weekdayLong.${mon0}`),
  };
}
