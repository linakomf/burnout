function bucketFromPercent(p, completed) {
  if (!completed || p == null || Number.isNaN(Number(p))) return 'unknown';
  const n = Number(p);
  if (n < 40) return 'low';
  if (n < 70) return 'medium';
  return 'high';
}

function normalizeRiskLevel(levelStr, scoringType) {
  const s = String(levelStr || '').trim();
  if (!s) return null;
  const st = scoringType || 'likert_sum';
  const maps = {
    mbi_student: {
      'Нет признаков выгорания': 'low',
      'Риск выгорания': 'medium',
      'Выраженное выгорание': 'high'
    },
    daily5: {
      'Состояние стабильное': 'low',
      'Повышенная нагрузка': 'medium',
      'Нужен отдых и поддержка': 'high'
    },
    gad7: {
      'Низкая тревожность': 'low',
      'Средняя тревожность': 'medium',
      'Высокая тревожность': 'high'
    }
  };
  if (maps[st]?.[s]) return maps[st][s];
  if (s === 'Низкий') return 'low';
  if (s === 'Средний') return 'medium';
  if (s === 'Высокий') return 'high';
  return null;
}

module.exports = { bucketFromPercent, normalizeRiskLevel };
