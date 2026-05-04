import { format } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';

function capLine(s) {
  if (!s || typeof s !== 'string') return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function weekPillLines(day, lang, t) {
  if (lang === 'en') {
    return {
      dateLine: capLine(format(day, 'd MMMM', { locale: enUS })),
      wdayLine: capLine(format(day, 'EEEE', { locale: enUS }))
    };
  }
  if (lang === 'ru') {
    return {
      dateLine: capLine(format(day, 'd MMMM', { locale: ru })),
      wdayLine: capLine(format(day, 'EEEE', { locale: ru }))
    };
  }
  const d = day.getDate();
  const m = day.getMonth();
  const mon0 = (day.getDay() + 6) % 7;
  return {
    dateLine: capLine(`${d} ${t(`cal.months.${m}`)}`),
    wdayLine: capLine(t(`cal.weekdayLong.${mon0}`))
  };
}