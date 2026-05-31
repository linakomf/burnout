import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { getCheckinForDate } from './dailyCheckinStorage';
import { stressFromCatalogLevel } from './wellnessComposite';

function clamp(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

export function burnoutRiskFromIndex(index) {
  const v = clamp(index);
  if (v <= 34) return { level: 'low', label: 'Низкий риск', index: v };
  if (v <= 64) return { level: 'medium', label: 'Средний риск', index: v };
  return { level: 'high', label: 'Высокий риск', index: v };
}

function testStressOnDate(results, dateKey) {
  const dayTests = results.filter((r) => {
    if (!r.created_at) return false;
    return format(new Date(r.created_at), 'yyyy-MM-dd') === dateKey;
  });
  if (!dayTests.length) return null;
  const scores = dayTests.map((r) => Number(r.score) || 0);
  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Индекс выгорания 0–100 (выше = больше риск).
 */
export function dailyBurnoutIndex({
  dateKey,
  moodPct,
  checkin,
  testStress,
  hasDiary,
  hasPractice,
  onboardingPct,
}) {
  const parts = [];
  const weights = [];

  if (checkin) {
    parts.push(clamp(checkin.stress));
    weights.push(0.32);
    parts.push(clamp(100 - checkin.energy));
    weights.push(0.28);
    const moodFromCheckin = checkin.mood != null ? clamp(checkin.mood) : moodPct;
    if (moodFromCheckin != null) {
      parts.push(clamp(100 - moodFromCheckin));
      weights.push(0.18);
    }
  } else if (moodPct != null) {
    parts.push(clamp(100 - moodPct));
    weights.push(0.22);
  }

  if (testStress != null) {
    parts.push(clamp(testStress));
    weights.push(0.2);
  }

  if (!parts.length) {
    if (onboardingPct != null) return clamp(onboardingPct);
    return null;
  }

  const wSum = weights.reduce((a, b) => a + b, 0);
  let index = parts.reduce((sum, val, i) => sum + val * weights[i], 0) / wSum;
  if (hasDiary) index -= 5;
  if (hasPractice) index -= 8;
  return clamp(index);
}

export function buildBurnoutTimeline({
  chartDays,
  period,
  moodByDate,
  diaryDateKeys,
  practiceDateKeys,
  results,
  onboardingPct,
  onboardingDateKey,
}) {
  const diarySet = new Set(diaryDateKeys);
  const practiceSet = practiceDateKeys instanceof Set ? practiceDateKeys : new Set(practiceDateKeys);

  if (period === 'year') {
    return chartDays.map((monthStart) => {
      const mStart = startOfMonth(monthStart);
      const mEnd = endOfMonth(monthStart);
      const indices = [];
      eachDayOfInterval({ start: mStart, end: mEnd }).forEach((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const idx = dailyBurnoutIndex({
          dateKey: key,
          moodPct: moodByDate.get(key),
          checkin: getCheckinForDate(key),
          testStress: testStressOnDate(results, key),
          hasDiary: diarySet.has(key),
          hasPractice: practiceSet.has(key),
          onboardingPct: key === onboardingDateKey ? onboardingPct : null,
        });
        if (idx != null) indices.push(idx);
      });
      const burnout =
        indices.length > 0 ?
          Math.round(indices.reduce((a, b) => a + b, 0) / indices.length) :
          null;
      return {
        label: format(monthStart, 'LLL'),
        burnout,
        burnoutRaw: burnout,
        risk: burnout != null ? burnoutRiskFromIndex(burnout) : null,
      };
    });
  }

  return chartDays.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const burnout = dailyBurnoutIndex({
      dateKey: key,
      moodPct: moodByDate.get(key),
      checkin: getCheckinForDate(key),
      testStress: testStressOnDate(results, key),
      hasDiary: diarySet.has(key),
      hasPractice: practiceSet.has(key),
      onboardingPct: key === onboardingDateKey ? onboardingPct : null,
    });
    let label;
    if (period === 'week') {
      label = format(day, 'EEE');
    } else {
      label = format(day, 'd');
    }
    const cap = (s) => (s ? `${s.charAt(0).toUpperCase()}${s.slice(1)}` : s);
    return {
      label: cap(label),
      burnout,
      burnoutRaw: burnout,
      risk: burnout != null ? burnoutRiskFromIndex(burnout) : null,
    };
  });
}

export function averageBurnoutIndex(timeline) {
  const vals = timeline.map((r) => r.burnout).filter((v) => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function buildBurnoutDrivers({ stressPct, anxietyPct, energyPct, moodPct }) {
  const drivers = [
    { key: 'stress', label: 'повышенный стресс', weight: stressPct ?? 0 },
    { key: 'anxiety', label: 'тревожность', weight: anxietyPct ?? 0 },
    { key: 'energy', label: 'снижение энергии', weight: energyPct != null ? 100 - energyPct : 0 },
    { key: 'mood', label: 'нестабильное настроение', weight: moodPct != null ? 100 - moodPct : 0 },
  ];
  drivers.sort((a, b) => b.weight - a.weight);
  const top = drivers.filter((d) => d.weight >= 45).slice(0, 2);
  if (!top.length) {
    return 'Показатели в балансе — продолжайте короткие практики и записи в дневнике.';
  }
  if (top.length === 1) {
    return `Сильнее всего сейчас влияет ${top[0].label}.`;
  }
  return `Сильнее всего влияют ${top[0].label} и ${top[1].label}.`;
}

function changePhrase(trend, metricLabel, goodWhenDown = false) {
  if (!trend || trend.text === '-' || trend.up == null) return null;
  const improved = goodWhenDown ? !trend.up : trend.up;
  if (improved) return `${metricLabel} снизился`;
  if (trend.text === '0%') return `${metricLabel} почти не изменился`;
  return `${metricLabel} вырос`;
}

export function buildPersonalInsights(ctx) {
  const {
    entriesCount,
    diaryNotesCount,
    testsCount,
    practicesCount,
    avgMoodPct,
    moodTrend,
    stressPct,
    anxietyPct,
    energyPct,
    burnoutIndex,
    diaryDaysWithCheckin,
    practiceDaysCount,
  } = ctx;

  const goodPool = [];
  const warnPool = [];
  const tipPool = [];

  if (entriesCount >= 2) {
    goodPool.push({
      kind: 'good',
      title: 'Дневник помогает',
      text: 'В дни, когда вы заполняли дневник, картина состояния становится стабильнее — продолжайте короткие записи.',
    });
  } else if (entriesCount >= 1) {
    goodPool.push({
      kind: 'good',
      title: 'Есть опора',
      text: 'Записи в дневнике помогают замечать закономерности. Даже одна короткая заметка — уже шаг к более точной картине.',
    });
  } else {
    goodPool.push({
      kind: 'good',
      title: 'С чистого листа',
      text: 'Начните с одной короткой записи в ИИ-дневнике — инсайты и графики станут персональнее уже через пару дней.',
    });
  }

  if (practicesCount >= 1 || practiceDaysCount >= 1) {
    goodPool.push({
      kind: 'good',
      title: 'Практики работают',
      text: 'После завершённых практик восстановления уровень напряжения чаще снижается — можно повторить знакомые форматы.',
    });
  }

  if (diaryDaysWithCheckin >= 2 && diaryNotesCount >= 1) {
    goodPool.push({
      kind: 'good',
      title: 'Осознанность',
      text: 'Отметки настроения и заметки в дневнике дают более точную картину — так проще замечать, что помогает именно вам.',
    });
  }

  if (anxietyPct >= 50 && energyPct < 55) {
    warnPool.push({
      kind: 'warn',
      title: 'Связь показателей',
      text: 'Энергия чаще снижается в периоды с более высокой тревожностью — мягкий режим и спокойные активности могут быть особенно уместны.',
    });
  }

  if (stressPct >= 55) {
    warnPool.push({
      kind: 'warn',
      title: 'Баланс нагрузки',
      text: 'Уровень стресса выше комфортного. Полезны короткие паузы, прогулки и бережный темп без лишней нагрузки.',
    });
  }

  if (burnoutIndex >= 65) {
    warnPool.push({
      kind: 'warn',
      title: 'Наблюдение',
      text: 'Индекс выгорания повышен — имеет смысл снизить темп и добавить восстановление в расписание.',
    });
  }

  warnPool.push({
    kind: 'warn',
    title: 'Берегите баланс',
    text: 'Следите за сочетанием нагрузки и отдыха — это снижает риск накопительной усталости без резких выводов.',
  });

  if (avgMoodPct >= 50 && moodTrend.up !== false) {
    tipPool.push({
      kind: 'tip',
      title: 'Спокойные активности',
      text: 'Ваше состояние улучшается, когда появляется больше спокойных активностей — раздел «Пространство» подберёт мягкие форматы.',
    });
  }

  if (testsCount === 0 && entriesCount < 2) {
    tipPool.push({
      kind: 'tip',
      title: 'С чего начать',
      text: 'Одна запись в дневнике и один короткий тест помогут точнее показать динамику выгорания.',
    });
  }

  tipPool.push({
    kind: 'tip',
    title: burnoutIndex >= 65 ? 'Мягкий режим' : 'Рекомендация',
    text:
      burnoutIndex >= 65 ?
        'Сейчас может быть полезен мягкий режим: короткие практики, спокойная музыка и бережный темп в течение дня.' :
        'Попробуйте дыхательную практику перед важными делами или материалы из раздела «Пространство» — ответы в дневнике тоже учитываются в сводке.',
  });

  const pick = (pool, index) => pool[Math.min(index, pool.length - 1)];

  return [pick(goodPool, 0), pick(warnPool, 0), pick(tipPool, 0)];
}

export function buildWeekSummary(ctx) {
  const {
    periodLabel,
    testsCount,
    entriesCount,
    practicesCount,
    moodTrend,
    stressTrend,
    anxietyTrend,
    energyTrend,
    avgMoodPct,
    stressPct,
  } = ctx;

  const parts = [];
  parts.push(
    `За ${periodLabel} вы прошли ${testsCount} ${pluralTests(testsCount)}, сделали ${entriesCount} ${pluralEntries(entriesCount)} в дневнике и завершили ${practicesCount} ${pluralPractices(practicesCount)}.`
  );

  const changes = [];
  const moodCh = changePhrase(moodTrend, 'Настроение', false);
  const stressCh = changePhrase(stressTrend, 'Стресс', true);
  const anxietyCh = changePhrase(anxietyTrend, 'Тревожность', true);
  const energyCh = changePhrase(energyTrend, 'Энергия', false);

  if (moodCh) changes.push(moodCh.toLowerCase());
  if (stressCh) changes.push(stressCh.toLowerCase());
  if (anxietyCh) changes.push(anxietyCh.toLowerCase());
  if (energyCh) changes.push(energyCh.toLowerCase());

  if (changes.length) {
    parts.push(`${capitalize(changes.join(', '))}.`);
  } else if (avgMoodPct > 0) {
    parts.push(
      stressPct >= 55 ?
        'Настроение держится на приемлемом уровне, но стресс остаётся повышенным — имеет смысл добавить восстановление.' :
        'Показатели в целом ровные — продолжайте отмечать состояние, чтобы видеть динамику.'
    );
  } else {
    parts.push('Добавьте записи и тесты — так сводка станет точнее.');
  }

  return parts.join(' ');
}

function pluralTests(n) {
  if (n === 1) return 'тест';
  if (n >= 2 && n <= 4) return 'теста';
  return 'тестов';
}
function pluralEntries(n) {
  if (n === 1) return 'запись';
  if (n >= 2 && n <= 4) return 'записи';
  return 'записей';
}
function pluralPractices(n) {
  if (n === 1) return 'практику';
  if (n >= 2 && n <= 4) return 'практики';
  return 'практик';
}
function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildWeekGoals(ctx) {
  const {
    stressPct,
    anxietyPct,
    energyPct,
    entriesCount,
    testsCount,
    practicesCount,
    favoritesCount,
    burnoutIndex,
  } = ctx;

  const goals = [];

  if (stressPct >= 55 || burnoutIndex >= 60) {
    goals.push('Пройти 3 короткие антистресс-практики из раздела «Пространство»');
    goals.push('Перед важными делами — 1 минута спокойного дыхания');
  }

  if (anxietyPct >= 50) {
    goals.push('Добавить 2 спокойные медитации');
    goals.push('Открыть раздел «Звуки» или «Музыка для успокоения»');
  }

  if (energyPct < 45) {
    goals.push('Выбрать лёгкое чтение или спокойный фильм на вечер');
    goals.push('Пройти одну практику восстановления');
  }

  const lowActivity = entriesCount < 2 && testsCount < 1 && practicesCount < 1;
  if (lowActivity || favoritesCount < 2) {
    goals.push('Сделать 1 запись в ИИ-дневнике');
    goals.push('Пройти 1 короткий тест из каталога');
    if (favoritesCount < 2) goals.push('Сохранить 2 материала в избранное');
  }

  if (!goals.length) {
    goals.push('Продолжать отмечать состояние в дневнике 2–3 раза в неделю');
    goals.push('Чередовать спокойные практики и лёгкий отдых без перегруза');
    goals.push('Раз в неделю — короткий тест для сверки динамики');
  }

  return [...new Set(goals)].slice(0, 4);
}

function balanceResourcePhrase(pct) {
  if (pct >= 58) return 'сейчас в хорошей зоне';
  if (pct >= 42) return 'держится ровно';
  return 'чуть ниже — можно мягко поддержать себя';
}

function balanceLoadPhrase(pct) {
  if (pct <= 40) return 'сейчас спокойнее';
  if (pct <= 55) return 'без резких всплесков';
  return 'заметнее обычного — помогут короткие паузы';
}

export function buildBalanceChartHelp({
  avgMoodPct,
  stressPct,
  anxietyPct,
  energyPct,
  sleepPct,
}) {
  return {
    intro: 'Дальше от центра — выше значение по оси.',
    items: [
      { label: 'Настроение', text: balanceResourcePhrase(avgMoodPct) },
      { label: 'Стресс', text: balanceLoadPhrase(stressPct) },
      { label: 'Тревога', text: balanceLoadPhrase(anxietyPct) },
      { label: 'Энергия', text: balanceResourcePhrase(energyPct) },
      { label: 'Сон', text: balanceResourcePhrase(sleepPct) },
    ],
  };
}

export function buildBalanceInsight({
  avgMoodPct,
  stressPct,
  anxietyPct,
  energyPct,
  burnoutIndex,
}) {
  const burnout = burnoutIndex ?? stressPct ?? 40;

  const loadAxes = [
    { label: 'стресс', value: stressPct },
    { label: 'тревожность', value: anxietyPct },
    { label: 'риск выгорания', value: burnout },
  ].sort((a, b) => b.value - a.value);

  const resourceAxes = [
    { label: 'настроение', value: avgMoodPct },
    { label: 'энергия', value: energyPct },
  ].sort((a, b) => b.value - a.value);

  const topLoad = loadAxes[0];
  const topResource = resourceAxes[0];

  const spread =
    Math.max(stressPct, anxietyPct, energyPct, avgMoodPct, burnout) -
    Math.min(stressPct, anxietyPct, energyPct, avgMoodPct, burnout);

  if (spread < 18) {
    return (
      'Радар показывает, как сочетаются настроение, стресс, тревожность, энергия и индекс выгорания. ' +
      'Сейчас показатели близки друг к другу — форма почти ровная, это признак устойчивого баланса. ' +
      'Продолжайте короткие практики и записи в дневнике, чтобы удерживать этот ритм.'
    );
  }

  return (
    'Радар объединяет пять показателей в одну картину: чем дальше точка от центра, тем выше значение по оси. ' +
    `Сейчас сильнее выделяется ${topLoad.label}; больше опоры дают ${topResource.label} и ${resourceAxes[1]?.label || 'спокойный режим'}. ` +
    'Так проще увидеть, что поддерживает вас и куда направить восстановление в ближайшие дни.'
  );
}

export function stressFromTestResults(resultsInPeriod) {
  if (!resultsInPeriod.length) return null;
  const scores = resultsInPeriod.map((r) => Number(r.score) || 0);
  return clamp(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function lastTestStressFromResults(results) {
  if (!results.length) return null;
  return stressFromCatalogLevel(results[0]?.level);
}
