/**
 * Психометрический подсчёт баллов тестов.
 * answers: { [questionId]: number } — индекс выбранного варианта (0..n-1).
 */

function sumAnswerPoints(questions, answers, pointsPerOption) {
  let raw = 0;
  for (const q of questions) {
    const idx = answers[q.question_id];
    if (idx === undefined || idx === null) continue;
    const row = pointsPerOption[q.question_id];
    if (!row) continue;
    raw += Number(row[idx]) || 0;
  }
  return raw;
}

/** GAD-7: 7 вопросов, 0–3, сумма 0–21 */
function scoreGad7(questions, answers) {
  const pts = {};
  for (const q of questions) {
    pts[q.question_id] = [0, 1, 2, 3];
  }
  const sum = sumAnswerPoints(questions, answers, pts);
  const max = 21;
  const percentage = Math.round((sum / max) * 100);
  let level;
  if (sum <= 4) level = 'Низкая тревожность';
  else if (sum <= 9) level = 'Средняя тревожность';
  else level = 'Высокая тревожность';

  let interpretation;
  if (sum <= 4) {
    interpretation = {
      title: 'Низкий уровень симптомов',
      text: 'Суммарный балл GAD-7 в пределах минимального диапазона. Это не диагноз, а ориентир для самонаблюдения.',
      recommendation:
        'Поддерживайте режим сна, движение и контакт с близкими. Раздел «Практики» — дыхание и короткие паузы для профилактики.',
    };
  } else if (sum <= 9) {
    interpretation = {
      title: 'Умеренные симптомы тревоги',
      text: 'Результат указывает на выраженную, но умеренную тревожность за последние две недели.',
      recommendation:
        'Попробуйте регулярные дыхательные практики, ограничение кофеина и структурирование дня. При сохранении симптомов полезна консультация специалиста.',
    };
  } else {
    interpretation = {
      title: 'Выраженные симптомы тревоги',
      text: 'Балл соответствует зоне, в которой рекомендуется обсудить состояние с врачом или психотерапевтом.',
      recommendation:
        'Обратитесь к специалисту очно или онлайн. Параллельно используйте успокаивающие практики из раздела «Практики» и избегайте самодиагностики в интернете.',
    };
  }

  return {
    score: sum,
    maxScore: max,
    percentage,
    level,
    scale: 'gad7',
    interpretation,
  };
}

/** MBI-студент: 5 вариантов 0–4, сумма по 9 вопросам, max 36 */
function scoreMbiStudent(questions, answers) {
  const pts = {};
  for (const q of questions) {
    pts[q.question_id] = [0, 1, 2, 3, 4];
  }
  const sum = sumAnswerPoints(questions, answers, pts);
  const max = questions.length * 4;
  const percentage = max ? Math.round((sum / max) * 100) : 0;
  let level;
  if (percentage < 40) level = 'Нет признаков выгорания';
  else if (percentage < 68) level = 'Риск выгорания';
  else level = 'Выраженное выгорание';

  let interpretation;
  if (percentage < 40) {
    interpretation = {
      title: 'Ресурс в норме',
      text: 'По ответам заметна способность восстанавливаться и сохранять вовлечённость.',
      recommendation: 'Сохраняйте баланс нагрузки и отдыха; микропаузы в течение дня снижают накопление стресса.',
    };
  } else if (percentage < 68) {
    interpretation = {
      title: 'Зона риска',
      text: 'Есть признаки истощения и снижения мотивации, характерные для начальной стадии выгорания.',
      recommendation:
        'Сократите необязательные задачи, добавьте восстановление (сон, прогулки) и откройте раздел «Практики» — медитация и быстрый отдых.',
    };
  } else {
    interpretation = {
      title: 'Сильное напряжение',
      text: 'Ответы указывают на выраженное истощение. Это сигнал обратиться за поддержкой.',
      recommendation:
        'Рекомендуем поговорить с психологом или врачом. В приложении используйте практики восстановления и не ожидайте от себя прежней продуктивности до восстановления.',
    };
  }

  return { score: sum, maxScore: max, percentage, level, scale: 'mbi_student', interpretation };
}

/** Быстрый ежедневный: 5 вопросов, 0–4 */
function scoreDaily5(questions, answers) {
  const pts = {};
  for (const q of questions) {
    pts[q.question_id] = [0, 1, 2, 3, 4];
  }
  const sum = sumAnswerPoints(questions, answers, pts);
  const max = questions.length * 4;
  const percentage = max ? Math.round((sum / max) * 100) : 0;
  let level;
  if (percentage < 35) level = 'Состояние стабильное';
  else if (percentage < 65) level = 'Повышенная нагрузка';
  else level = 'Нужен отдых и поддержка';

  let interpretation;
  if (percentage < 35) {
    interpretation = {
      title: 'Хороший день',
      text: 'Субъективное состояние в комфортной зоне.',
      recommendation: 'Закрепите привычки: короткая прогулка, сон в одно время.',
    };
  } else if (percentage < 65) {
    interpretation = {
      title: 'День с нагрузкой',
      text: 'Заметна усталость или напряжение — это нормальная реакция на стрессоры.',
      recommendation: 'Выделите 10 минут на дыхание или растяжку; снизьте план на вечер.',
    };
  } else {
    interpretation = {
      title: 'Ресурс на исходе',
      text: 'Сегодня лучше не требовать от себя максимума.',
      recommendation: 'Практика «Быстрое восстановление», тёплый душ и ранний отход ко сну. При длительном состоянии — к специалисту.',
    };
  }

  return { score: sum, maxScore: max, percentage, level, scale: 'daily5', interpretation };
}

/** Общий случай: сумма индексов, max = n * (options-1), уровни по процентилям */
function scoreLikertSum(questions, answers) {
  let sum = 0;
  let max = 0;
  for (const q of questions) {
    let opts = q.options;
    if (typeof opts === 'string') {
      try {
        opts = JSON.parse(opts);
      } catch {
        opts = [];
      }
    }
    const n = Array.isArray(opts) ? opts.length : 5;
    const maxIdx = Math.max(0, n - 1);
    max += maxIdx;
    const idx = answers[q.question_id];
    if (idx !== undefined && idx !== null) sum += Number(idx) || 0;
  }
  const percentage = max ? Math.round((sum / max) * 100) : 0;
  let level;
  if (percentage <= 33) level = 'Низкий';
  else if (percentage <= 66) level = 'Средний';
  else level = 'Высокий';

  const interpretation = {
    title: level === 'Низкий' ? 'Нижний диапазон' : level === 'Средний' ? 'Средний диапазон' : 'Высокий диапазон',
    text: 'Результат относится к общей шкале опросника и служит ориентиром, а не диагнозом.',
    recommendation:
      level === 'Высокий'
        ? 'Имеет смысл обсудить результаты со специалистом и добавить практики саморегуляции.'
        : 'Продолжайте отслеживать динамику в разделе «Аналитика».',
  };

  return { score: sum, maxScore: max, percentage, level, scale: 'generic', interpretation };
}

/**
 * @param {{ scoring_type?: string }} testRow
 * @param {object[]} questionRows
 * @param {Record<string, number>} answers
 */
function computeTestResult(testRow, questionRows, answers) {
  const type = testRow.scoring_type || 'likert_sum';
  const sorted = [...questionRows].sort((a, b) => (a.order_num || 0) - (b.order_num || 0));

  switch (type) {
    case 'gad7':
      return scoreGad7(sorted, answers);
    case 'mbi_student':
      return scoreMbiStudent(sorted, answers);
    case 'daily5':
      return scoreDaily5(sorted, answers);
    case 'likert_sum':
    default:
      return scoreLikertSum(sorted, answers);
  }
}

module.exports = { computeTestResult, scoreGad7, scoreMbiStudent, scoreDaily5, scoreLikertSum };
