const BY_ID = {
  2: {
    title: 'MBI - Опросник выгорания Маслах (студенты)',
    description:
    'Адаптированная версия для студентов: эмоциональное истощение, деперсонализация, эффективность.'
  },
  3: {
    title: 'Тест на академическую усталость',
    description: 'Оценка усталости от учебы и мотивации.'
  },
  4: {
    title: 'MBI - Профессиональное выгорание (преподаватели)',
    description: 'Классическая версия MBI для педагогов.'
  },
  5: {
    title: 'Тест на рабочую перегрузку',
    description: '10 вопросов о нагрузке, восстановлении и балансе — ориентир, не диагноз.'
  },
  6: {
    title: 'GAD-7: скрининг тревожности',
    description:
    'Семь вопросов за последние 2 недели. Логика GAD-7; не заменяет консультацию врача.'
  },
  7: {
    title: 'Ежедневный чек-ин (5 вопросов)',
    description: 'Быстрая самооценка за сегодня - для регулярной динамики в аналитике.'
  }
};

export function mergeTestRu(test) {
  if (!test || test.test_id == null) return test;
  const id = Number(test.test_id);
  if (!Number.isFinite(id)) return test;
  const fix = BY_ID[id];
  if (!fix) return test;
  return {
    ...test,
    title: fix.title,
    description: fix.description
  };
}