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
    description: '9 вопросов по шкале от «Никогда» до «Всегда» — ориентир, не диагноз.'
  },
  6: {
    title: 'GAD-7: скрининг тревожности',
    description:
    'Семь вопросов за последние 2 недели. Логика GAD-7; не заменяет консультацию врача.'
  },
  7: {
    title: 'Ежедневный чек-ин (9 вопросов)',
    description: 'Те же варианты ответа, что в основном опросе — для сопоставимой динамики в аналитике.'
  }
};

const META_FOR_ENSURE = [
{ id: 2, scoring_type: 'mbi_student' },
{ id: 3, scoring_type: 'likert_sum' },
{ id: 4, scoring_type: 'likert_sum' },
{ id: 5, scoring_type: 'likert_sum' },
{ id: 6, scoring_type: 'gad7' },
{ id: 7, scoring_type: 'daily5' }];


function applyCanonicalToTestRow(row) {
  if (!row || row.test_id == null) return row;
  const id = Number(row.test_id);
  if (!Number.isFinite(id)) return row;
  const fix = BY_ID[id];
  if (!fix) return row;
  return {
    ...row,
    title: fix.title,
    description: fix.description
  };
}

function applyCanonicalToTestRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(applyCanonicalToTestRow);
}

function titleForTestId(testId) {
  const id = Number(testId);
  const fix = Number.isFinite(id) ? BY_ID[id] : null;
  return fix ? fix.title : null;
}

module.exports = {
  BY_ID,
  META_FOR_ENSURE,
  applyCanonicalToTestRow,
  applyCanonicalToTestRows,
  titleForTestId
};