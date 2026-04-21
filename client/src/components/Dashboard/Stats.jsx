import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Heart,
  Activity,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Check,
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  stressFromCatalogLevel,
  compositeStressPct,
  compositeMoodPct,
  compositeEnergyPct,
  compositeAnxietyPct,
  moodPercentFromOnboardingBurnout,
} from '../../utils/wellnessComposite';
import './Stats.css';

const PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
];

const DAYS_PERIOD = { week: 7, month: 30, year: 365 };

function moodScoreToPercent(avg) {
  if (avg == null || Number.isNaN(avg)) return 0;
  return Math.round(Math.min(100, Math.max(0, (Number(avg) / 5) * 100)));
}

function stressFromTestResults(resultsInPeriod) {
  if (!resultsInPeriod.length) return null;
  const scores = resultsInPeriod.map((r) => Number(r.score) || 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(100, Math.round(avg));
}

function anxietyFromResults(resultsInPeriod) {
  const anxietyish = resultsInPeriod.filter((r) =>
    /тревог|беспокой|паник/i.test(`${r.title} ${r.category_name || ''}`)
  );
  if (anxietyish.length) return stressFromTestResults(anxietyish);
  const base = stressFromTestResults(resultsInPeriod);
  if (base == null) return null;
  return Math.round(base * 0.85);
}

function formatTrend(prev, cur) {
  if (prev == null || cur == null || Number.isNaN(prev) || Number.isNaN(cur)) return { text: '—', up: null };
  const diff = Math.round(cur - prev);
  if (diff === 0) return { text: '0%', up: null };
  const up = diff > 0;
  return { text: `${up ? '+' : ''}${diff}%`, up };
}

function diaryStreak(dateKeys) {
  if (!dateKeys.length) return 0;
  const set = new Set(dateKeys);
  let streak = 0;
  let d = startOfDay(new Date());
  for (let i = 0; i < 400; i++) {
    const key = format(d, 'yyyy-MM-dd');
    if (set.has(key)) {
      streak += 1;
      d = subDays(d, 1);
    } else {
      break;
    }
  }
  return streak;
}

function DonutStat({ current, max, label, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="analytics-donut">
      <div className="analytics-donut-svg-wrap">
        <svg className="analytics-donut-svg" viewBox="0 0 100 100" aria-hidden>
          <circle className="analytics-donut-track" cx="50" cy="50" r={r} />
          <circle
            className="analytics-donut-fill"
            cx="50"
            cy="50"
            r={r}
            stroke={color}
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="analytics-donut-center">
          <span className="analytics-donut-ratio">
            {current}/{max}
          </span>
          <span className="analytics-donut-pct">{pct}%</span>
        </div>
      </div>
      <span className="analytics-donut-label">{label}</span>
    </div>
  );
}

function deltaToneClass(trend, goodWhenUp) {
  if (trend.up == null || trend.text === '—') return '';
  const feelsGood = goodWhenUp ? trend.up : !trend.up;
  return feelsGood ? 'pos' : 'neg';
}

const Stats = () => {
  const { user } = useAuth();
  const onboardingPct = user?.onboarding_burnout_percent ?? null;
  const [period, setPeriod] = useState('week');
  const [results, setResults] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [moodStats, setMoodStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/tests/results/my'),
      api.get('/diary'),
      api.get('/diary/mood-stats'),
    ])
      .then(([r, d, m]) => {
        if (!cancelled) {
          setResults(r.data || []);
          setDiaryEntries(d.data || []);
          setMoodStats(m.data || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setDiaryEntries([]);
          setMoodStats([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const range = useMemo(() => {
    const end = new Date();
    const start = subDays(end, DAYS_PERIOD[period] - 1);
    return { start: startOfDay(start), end: startOfDay(end) };
  }, [period]);

  const resultsInPeriod = useMemo(() => {
    return results.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      return isWithinInterval(d, { start: range.start, end: range.end });
    });
  }, [results, range]);

  const diaryInPeriod = useMemo(() => {
    return diaryEntries.filter((e) => {
      if (!e.created_at) return false;
      const d = new Date(e.created_at);
      return isWithinInterval(d, { start: range.start, end: range.end });
    });
  }, [diaryEntries, range]);

  const moodByDate = useMemo(() => {
    const map = new Map();
    moodStats.forEach((row) => {
      let key;
      if (typeof row.date === 'string') {
        key = row.date.slice(0, 10);
      } else if (row.date instanceof Date) {
        key = format(row.date, 'yyyy-MM-dd');
      } else {
        key = format(new Date(row.date), 'yyyy-MM-dd');
      }
      map.set(key, moodScoreToPercent(row.avg_mood));
    });
    diaryInPeriod.forEach((e) => {
      const key = format(new Date(e.created_at), 'yyyy-MM-dd');
      if (!map.has(key) && e.mood_score != null) {
        map.set(key, moodScoreToPercent(e.mood_score));
      }
    });
    if (onboardingPct != null && user?.onboarding_burnout_completed_at) {
      const key = format(new Date(user.onboarding_burnout_completed_at), 'yyyy-MM-dd');
      const seed = moodPercentFromOnboardingBurnout(onboardingPct);
      if (seed != null && !map.has(key)) map.set(key, seed);
    }
    return map;
  }, [moodStats, diaryInPeriod, onboardingPct, user?.onboarding_burnout_completed_at]);

  const chartDays = useMemo(() => {
    const end = range.end;
    if (period === 'year') {
      return eachMonthOfInterval({
        start: startOfMonth(subMonths(end, 11)),
        end: startOfMonth(end),
      });
    }
    const n = period === 'week' ? 7 : 30;
    const start = subDays(end, n - 1);
    return eachDayOfInterval({ start, end });
  }, [period, range.end]);

  const areaData = useMemo(() => {
    if (period === 'year') {
      return chartDays.map((monthStart) => {
        const mStart = startOfMonth(monthStart);
        const mEnd = endOfMonth(monthStart);
        const uniq = [];
        const seen = new Set();
        eachDayOfInterval({ start: mStart, end: mEnd }).forEach((x) => {
          const key = format(x, 'yyyy-MM-dd');
          const v = moodByDate.get(key);
          if (v != null && !seen.has(key)) {
            seen.add(key);
            uniq.push(v);
          }
        });
        const moodVal =
          uniq.length > 0
            ? Math.round(uniq.reduce((a, b) => a + b, 0) / uniq.length)
            : null;
        const stressVal =
          moodVal != null ? Math.min(100, Math.round(100 - moodVal * 0.75 + 12)) : null;
        return {
          label: format(monthStart, 'LLL', { locale: ru }),
          mood: moodVal,
          stress: stressVal,
        };
      });
    }
    return chartDays.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const mood = moodByDate.get(key);
      const moodVal = mood != null ? mood : null;
      const stressVal =
        moodVal != null ? Math.min(100, Math.round(100 - moodVal * 0.75 + 12)) : null;
      let label;
      if (period === 'week') {
        label = format(day, 'EEE', { locale: ru });
      } else {
        label = format(day, 'd');
      }
      return {
        label,
        mood: moodVal,
        stress: stressVal,
      };
    });
  }, [chartDays, moodByDate, period]);

  const avgMoodPctRaw = useMemo(() => {
    const vals = diaryInPeriod
      .map((e) => e.mood_score)
      .filter((v) => v != null)
      .map((v) => moodScoreToPercent(v));
    if (vals.length) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const fromStats = moodStats
      .filter((row) => {
        const d = new Date(row.date);
        return isWithinInterval(d, { start: range.start, end: range.end });
      })
      .map((row) => moodScoreToPercent(row.avg_mood));
    if (fromStats.length) return Math.round(fromStats.reduce((a, b) => a + b, 0) / fromStats.length);
    return 0;
  }, [diaryInPeriod, moodStats, range]);

  const lastTestStress = useMemo(
    () => (results.length ? stressFromCatalogLevel(results[0]?.level) : null),
    [results]
  );

  const stressPctValue = useMemo(
    () =>
      compositeStressPct({
        onboardingPercent: onboardingPct,
        lastTestStress,
        periodTestStress: stressFromTestResults(resultsInPeriod),
      }),
    [onboardingPct, lastTestStress, resultsInPeriod]
  );

  const stressPct = stressPctValue ?? 40;

  const avgMoodPct = useMemo(
    () =>
      compositeMoodPct({
        diaryAvgMoodPct: avgMoodPctRaw,
        stressPct: stressPctValue ?? 40,
        fallbackWhenNoDiary: 0,
      }),
    [avgMoodPctRaw, stressPctValue]
  );

  const anxietyFromTests = anxietyFromResults(resultsInPeriod);
  const anxietyPctValue = useMemo(
    () => compositeAnxietyPct({ onboardingPercent: onboardingPct, periodAnxietyFromTests: anxietyFromTests }),
    [onboardingPct, anxietyFromTests]
  );
  const anxietyPct = anxietyPctValue ?? Math.round(stressPct * 0.88);

  const energyPct = useMemo(() => compositeEnergyPct(avgMoodPct, stressPct), [avgMoodPct, stressPct]);

  const prevRange = useMemo(() => {
    const len = DAYS_PERIOD[period];
    const end = subDays(range.start, 1);
    const start = subDays(end, len - 1);
    return { start: startOfDay(start), end: startOfDay(end) };
  }, [period, range.start]);

  const prevDiary = useMemo(() => {
    return diaryEntries.filter((e) => {
      if (!e.created_at) return false;
      const d = new Date(e.created_at);
      return isWithinInterval(d, { start: prevRange.start, end: prevRange.end });
    });
  }, [diaryEntries, prevRange]);

  const prevResults = useMemo(() => {
    return results.filter((r) => {
      if (!r.created_at) return false;
      const d = new Date(r.created_at);
      return isWithinInterval(d, { start: prevRange.start, end: prevRange.end });
    });
  }, [results, prevRange]);

  const prevMoodPctRaw = useMemo(() => {
    const vals = prevDiary
      .map((e) => e.mood_score)
      .filter((v) => v != null)
      .map((v) => moodScoreToPercent(v));
    if (vals.length) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const fromStats = moodStats
      .filter((row) => {
        const d = new Date(row.date);
        return isWithinInterval(d, { start: prevRange.start, end: prevRange.end });
      })
      .map((row) => moodScoreToPercent(row.avg_mood));
    if (fromStats.length) return Math.round(fromStats.reduce((a, b) => a + b, 0) / fromStats.length);
    return 0;
  }, [prevDiary, moodStats, prevRange]);

  const prevLatest = useMemo(() => {
    const sorted = [...prevResults].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sorted[0] ?? null;
  }, [prevResults]);

  const prevStressPctValue = useMemo(
    () =>
      compositeStressPct({
        onboardingPercent: onboardingPct,
        lastTestStress: prevLatest ? stressFromCatalogLevel(prevLatest.level) : null,
        periodTestStress: stressFromTestResults(prevResults),
      }),
    [onboardingPct, prevLatest, prevResults]
  );

  const prevMood = useMemo(
    () =>
      compositeMoodPct({
        diaryAvgMoodPct: prevMoodPctRaw,
        stressPct: prevStressPctValue ?? 40,
        fallbackWhenNoDiary: 0,
      }),
    [prevMoodPctRaw, prevStressPctValue]
  );

  const prevAnxietyFromTests = anxietyFromResults(prevResults);
  const prevAnxietyValue = useMemo(
    () =>
      compositeAnxietyPct({
        onboardingPercent: onboardingPct,
        periodAnxietyFromTests: prevAnxietyFromTests,
      }),
    [onboardingPct, prevAnxietyFromTests]
  );

  const prevEnergy = useMemo(
    () => compositeEnergyPct(prevMood, prevStressPctValue ?? 40),
    [prevMood, prevStressPctValue]
  );

  const moodTrend = formatTrend(prevMood, avgMoodPct);
  const stressTrend = formatTrend(prevStressPctValue, stressPctValue);
  const anxietyTrend = formatTrend(prevAnxietyValue, anxietyPctValue);
  const energyTrend = formatTrend(prevEnergy, energyPct);

  const radarData = [
    { subject: 'Настроение', value: avgMoodPct, fullMark: 100 },
    { subject: 'Стресс', value: stressPct, fullMark: 100 },
    { subject: 'Тревога', value: anxietyPct, fullMark: 100 },
    { subject: 'Энергия', value: energyPct, fullMark: 100 },
    {
      subject: 'Сон',
      value: Math.min(100, Math.round(avgMoodPct * 0.9 + (diaryInPeriod.length > 0 ? 8 : 0))),
      fullMark: 100,
    },
  ];

  const diaryDateKeys = useMemo(
    () => diaryEntries.map((e) => format(new Date(e.created_at), 'yyyy-MM-dd')),
    [diaryEntries]
  );

  const streak = diaryStreak(diaryDateKeys);
  const entriesCount = diaryInPeriod.length;
  const testsCount = resultsInPeriod.length;
  const practicesDone = Math.min(30, entriesCount + testsCount);
  const diaryNotesCount = useMemo(
    () => diaryInPeriod.filter((e) => e.note && String(e.note).trim().length > 0).length,
    [diaryInPeriod]
  );

  const insights = useMemo(() => {
    const sourceParts = [
      testsCount > 0 ? `тесты (${testsCount})` : null,
      entriesCount > 0
        ? `дневник (${entriesCount}${diaryNotesCount ? `, из них ${diaryNotesCount} с заметкой` : ''})`
        : null,
      onboardingPct != null ? 'первичный скрининг выгорания' : null,
    ].filter(Boolean);
    const sourceLead =
      sourceParts.length > 0
        ? `Сводка строится по: ${sourceParts.join(', ')}. Она обновляется после каждого теста и активности. `
        : '';

    const out = [];
    if (avgMoodPct >= 55 && moodTrend.up !== false) {
      out.push({
        kind: 'good',
        title: 'Отличный прогресс!',
        text:
          sourceLead +
          (moodTrend.text && moodTrend.text !== '—'
            ? `Настроение в динамике: ${moodTrend.text} к прошлому периоду. Продолжайте в том же духе.`
            : 'Вы регулярно отмечаете состояние в дневнике — это основа осознанности.'),
        icon: Sparkles,
      });
    } else if (avgMoodPct > 0) {
      out.push({
        kind: 'good',
        title: 'Есть опора',
        text:
          sourceLead +
          'Записи в дневнике помогают замечать закономерности. Даже небольшие шаги — это вклад в благополучие.',
        icon: Sparkles,
      });
    } else {
      out.push({
        kind: 'good',
        title: 'С чистого листа',
        text:
          sourceLead +
          'Добавьте пару записей в ИИ-дневнике и пройдите тест из каталога — графики и обобщение станут точнее.',
        icon: Sparkles,
      });
    }

    if (anxietyPct >= 65 || (anxietyTrend.up === true && anxietyPct >= 45)) {
      out.push({
        kind: 'warn',
        title: 'Обратите внимание',
        text:
          'По совокупности тестов, скрининга и дневника заметна повышенная нагрузка. Попробуйте короткие паузы и дыхание; при необходимости обсудите это со специалистом.',
        icon: AlertCircle,
      });
    } else {
      out.push({
        kind: 'warn',
        title: 'Наблюдение',
        text:
          stressPct >= 60
            ? 'Уровень стресса выше комфортного. Полезны прогулки, сон и делегирование задач.'
            : 'Следите за балансом нагрузки и отдыха — это снижает риск накопительной усталости.',
        icon: AlertCircle,
      });
    }

    out.push({
      kind: 'tip',
      title: 'Рекомендация',
      text:
        'Попробуйте дыхательную практику 4–6 перед важными делами или раздел «Практики». Ответы и заметки в ИИ-дневнике тоже учитываются в общей картине активности.',
      icon: Lightbulb,
    });
    return out;
  }, [
    avgMoodPct,
    moodTrend,
    anxietyPct,
    anxietyTrend,
    stressPct,
    testsCount,
    entriesCount,
    diaryNotesCount,
    onboardingPct,
  ]);

  const weekGood = useMemo(() => {
    const lines = [];
    if (entriesCount >= 3) lines.push('Регулярные записи в дневнике');
    if (diaryNotesCount >= 2) lines.push('Заметки в дневнике — материал для осмысленной поддержки ИИ');
    if (avgMoodPct >= 50) lines.push('Стабильное или улучшающееся настроение (с учётом тестов и дневника)');
    if (testsCount > 0) lines.push(`Пройдено тестов за период: ${testsCount}`);
    if (onboardingPct != null && user?.onboarding_burnout_completed) {
      lines.push('В аналитике учтён первичный скрининг выгорания');
    }
    if (moodTrend.up === false && moodTrend.text !== '—') {
      lines.push(`Настроение: ${moodTrend.text} к прошлому отрезку`);
    }
    if (!lines.length) {
      lines.push('Начните с одной короткой записи в дневнике');
      lines.push('Пройдите тест из каталога — появится персональная динамика');
    }
    return lines;
  }, [
    entriesCount,
    diaryNotesCount,
    avgMoodPct,
    testsCount,
    moodTrend,
    onboardingPct,
    user?.onboarding_burnout_completed,
  ]);

  const weekGoals = [
    'Увеличить число прогулок до 5 в неделю',
    'Перед важными встречами — 1 минута спокойного дыхания',
    'Пить воду регулярно в течение дня',
  ];

  if (loading) {
    return (
      <div className="analytics-page analytics-page--loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  const chartSubtitle =
    period === 'week'
      ? 'Последние 7 дней'
      : period === 'month'
        ? 'Последние 30 дней'
        : 'По месяцам (год)';

  return (
    <div className="analytics-page fade-in">
      <header className="analytics-header">
        <div>
          <h1 className="analytics-title">Аналитика</h1>
          <p className="analytics-subtitle">Ваш путь к благополучию в цифрах</p>
        </div>
        <div className="analytics-segment" role="tablist" aria-label="Период">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`analytics-segment-btn ${period === p.id ? 'active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <section className="analytics-kpi-grid">
        <article className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-icon analytics-kpi-icon--mood">
              <Heart size={20} strokeWidth={2.2} />
            </span>
            {moodTrend.text !== '—' && moodTrend.up != null && (
              <span className={`analytics-kpi-delta ${deltaToneClass(moodTrend, true)}`}>
                {moodTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {moodTrend.text}
              </span>
            )}
          </div>
          <p className="analytics-kpi-label">Среднее настроение</p>
          <p className="analytics-kpi-value">{avgMoodPct}%</p>
        </article>
        <article className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-icon analytics-kpi-icon--stress">
              <Activity size={20} strokeWidth={2.2} />
            </span>
            {stressTrend.text !== '—' && stressTrend.up != null && (
              <span className={`analytics-kpi-delta ${deltaToneClass(stressTrend, false)}`}>
                {stressTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stressTrend.text}
              </span>
            )}
          </div>
          <p className="analytics-kpi-label">Уровень стресса</p>
          <p className="analytics-kpi-value">{stressPct}%</p>
        </article>
        <article className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-icon analytics-kpi-icon--anxiety">
              <Clock size={20} strokeWidth={2.2} />
            </span>
            {anxietyTrend.text !== '—' && anxietyTrend.up != null && (
              <span className={`analytics-kpi-delta ${deltaToneClass(anxietyTrend, false)}`}>
                {anxietyTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {anxietyTrend.text}
              </span>
            )}
          </div>
          <p className="analytics-kpi-label">Тревожность</p>
          <p className="analytics-kpi-value">{anxietyPct}%</p>
        </article>
        <article className="analytics-kpi-card">
          <div className="analytics-kpi-top">
            <span className="analytics-kpi-icon analytics-kpi-icon--energy">
              <Zap size={20} strokeWidth={2.2} />
            </span>
            {energyTrend.text !== '—' && energyTrend.up != null && (
              <span className={`analytics-kpi-delta ${deltaToneClass(energyTrend, true)}`}>
                {energyTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {energyTrend.text}
              </span>
            )}
          </div>
          <p className="analytics-kpi-label">Энергия</p>
          <p className="analytics-kpi-value">{energyPct}%</p>
        </article>
      </section>

      <section className="analytics-charts-row">
        <div className="analytics-card analytics-card--chart-wide">
          <div className="analytics-card-head">
            <h2 className="analytics-card-title">Динамика настроения</h2>
            <span className="analytics-card-meta">{chartSubtitle}</span>
          </div>
          <div className="analytics-chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={areaData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsMoodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9dc87a" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#9dc87a" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="analyticsStressFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8a87c" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#e8a87c" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 8" stroke="#e8ebe4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#7a8a7c' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7a8a7c' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: 'none',
                    boxShadow: '0 8px 28px rgba(46,62,48,0.12)',
                  }}
                  formatter={(v) => (v == null ? '—' : `${Math.round(v)}%`)}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  name="Настроение"
                  stroke="#7db05a"
                  strokeWidth={2.5}
                  fill="url(#analyticsMoodFill)"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="stress"
                  name="Напряжение"
                  stroke="#d4a574"
                  strokeWidth={2.5}
                  fill="url(#analyticsStressFill)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="analytics-card analytics-card--radar">
          <div className="analytics-card-head">
            <h2 className="analytics-card-title">Баланс</h2>
            <span className="analytics-card-meta">Общее состояние</span>
          </div>
          <div className="analytics-radar-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#e0e8df" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#5a6b5c', fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Показатели"
                  dataKey="value"
                  stroke="#9CAF88"
                  fill="#9CAF88"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="analytics-insights">
        <h2 className="analytics-section-title">Персональные инсайты</h2>
        <div className="analytics-insights-grid">
          {insights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className={`analytics-insight analytics-insight--${item.kind}`}>
                <div className="analytics-insight-icon">
                  <Icon size={22} strokeWidth={2} />
                </div>
                <h3 className="analytics-insight-title">{item.title}</h3>
                <p className="analytics-insight-text">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="analytics-activity">
        <h2 className="analytics-section-title">Прогресс активности</h2>
        <div className="analytics-card analytics-donuts-card">
          <div className="analytics-donuts-row">
            <DonutStat current={entriesCount} max={50} label="Записей создано" color="#9dc87a" />
            <DonutStat
              current={practicesDone}
              max={30}
              label="Практик завершено"
              color="#c4a5e8"
            />
            <DonutStat current={Math.min(streak, 14)} max={14} label="Дней подряд" color="#7eb8da" />
            <DonutStat current={testsCount} max={10} label="Тестов пройдено" color="#e8a87c" />
          </div>
        </div>
      </section>

      <section className="analytics-week-summary">
        <h2 className="analytics-section-title">Итоги недели</h2>
        <div className="analytics-summary-card">
          <div className="analytics-summary-col analytics-summary-col--good">
            <h3 className="analytics-summary-heading">Что получилось хорошо</h3>
            <ul className="analytics-summary-list">
              {weekGood.map((line) => (
                <li key={line}>
                  <Check size={18} className="analytics-summary-check" strokeWidth={2.5} />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="analytics-summary-col analytics-summary-col--goals">
            <h3 className="analytics-summary-heading">Цели на следующую неделю</h3>
            <ul className="analytics-summary-list analytics-summary-list--dots">
              {weekGoals.map((line) => (
                <li key={line}>
                  <span className="analytics-summary-dot" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Stats;
