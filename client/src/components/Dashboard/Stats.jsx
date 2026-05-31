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
  isWithinInterval } from
'date-fns';
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
  ReferenceArea,
} from
'recharts';
import {
  TrendingUp,
  TrendingDown,
  Check,
  Sun,
  AlertTriangle,
  Lightbulb,
  Send } from
'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  stressFromCatalogLevel,
  compositeStressPct,
  compositeMoodPct,
  compositeEnergyPct,
  compositeAnxietyPct,
  moodPercentFromOnboardingBurnout,
} from '../../utils/wellnessComposite';
import {
  buildBurnoutTimeline,
  averageBurnoutIndex,
  burnoutRiskFromIndex,
  buildBurnoutDrivers,
  buildPersonalInsights,
  buildWeekSummary,
  buildWeekGoals,
  buildBalanceChartHelp,
} from '../../utils/burnoutAnalytics';
import { countPracticesInRange, practiceDatesInRange } from '../../utils/practiceCompletionLog';
import { getCheckinLog } from '../../utils/dailyCheckinStorage';
import { loadAllSectionFavoriteSets } from '../Practices/sectionFavorites';
import energyState1 from '../../assets/stats-states/energy-state-1.png';
import energyState2 from '../../assets/stats-states/energy-state-2.png';
import energyState3 from '../../assets/stats-states/energy-state-3.png';
import energyState4 from '../../assets/stats-states/energy-state-4.png';
import moodState1 from '../../assets/stats-states/mood-state-1.png';
import moodState2 from '../../assets/stats-states/mood-state-2.png';
import moodState3 from '../../assets/stats-states/mood-state-3.png';
import moodState4 from '../../assets/stats-states/mood-state-4.png';
import stressState1 from '../../assets/stats-states/stress-state-1.png';
import stressState2 from '../../assets/stats-states/stress-state-2.png';
import stressState3 from '../../assets/stats-states/stress-state-3.png';
import stressState4 from '../../assets/stats-states/stress-state-4.png';
import anxietyState1 from '../../assets/stats-states/anxiety-state-1.png';
import anxietyState2 from '../../assets/stats-states/anxiety-state-2.png';
import anxietyState3 from '../../assets/stats-states/anxiety-state-3.png';
import anxietyState4 from '../../assets/stats-states/anxiety-state-4.png';
import './Stats.css';

const DAYS_PERIOD = { week: 7, month: 30, year: 365 };
const KPI_STATE_IMAGES = {
  mood: [moodState1, moodState2, moodState3, moodState4],
  stress: [stressState1, stressState2, stressState3, stressState4],
  anxiety: [anxietyState1, anxietyState2, anxietyState3, anxietyState4],
  energy: [energyState1, energyState2, energyState3, energyState4]
};

function clampPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function percentBucket(value) {
  const pct = clampPercent(value);
  if (pct <= 25) return 1;
  if (pct <= 50) return 2;
  if (pct <= 75) return 3;
  return 4;
}

function metricStateLevel(value, reverseScale = false) {
  const bucket = percentBucket(value);
  return reverseScale ? 5 - bucket : bucket;
}

function moodScoreToPercent(avg) {
  if (avg == null || Number.isNaN(avg)) return 0;
  return Math.round(Math.min(100, Math.max(0, Number(avg) / 5 * 100)));
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
  if (prev == null || cur == null || Number.isNaN(prev) || Number.isNaN(cur)) return { text: '-', up: null };
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
  const pct = max > 0 ? Math.min(100, Math.round(current / max * 100)) : 0;
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = pct / 100 * c;
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
            transform="rotate(-90 50 50)" />
          
        </svg>
        <div className="analytics-donut-center">
          <span className="analytics-donut-ratio">
            {current}/{max}
          </span>
          <span className="analytics-donut-pct">{pct}%</span>
        </div>
      </div>
      <span className="analytics-donut-label">{label}</span>
    </div>);

}

function deltaToneClass(trend, goodWhenUp) {
  if (trend.up == null || trend.text === '-') return '';
  const feelsGood = goodWhenUp ? trend.up : !trend.up;
  return feelsGood ? 'pos' : 'neg';
}

function MetricStateImage({ metric, percent, reverseScale = false, label }) {
  const level = metricStateLevel(percent, reverseScale);
  const list = KPI_STATE_IMAGES[metric] || [];
  const nextSrc = list[level - 1] || list[0] || '';
  const [activeSrc, setActiveSrc] = useState(nextSrc);
  const [prevSrc, setPrevSrc] = useState('');

  useEffect(() => {
    if (!nextSrc || nextSrc === activeSrc) return undefined;
    setPrevSrc(activeSrc);
    setActiveSrc(nextSrc);
    const timer = setTimeout(() => setPrevSrc(''), 300);
    return () => clearTimeout(timer);
  }, [nextSrc, activeSrc]);

  const pct = clampPercent(percent);
  const alt = `${label}: ${pct}%`;

  return (
    <div className="analytics-kpi-state">
      {prevSrc ? <img src={prevSrc} alt="" className="analytics-kpi-state-img analytics-kpi-state-img--prev" aria-hidden /> : null}
      {activeSrc ? <img src={activeSrc} alt={alt} className="analytics-kpi-state-img analytics-kpi-state-img--active" /> : null}
    </div>);
}

const Stats = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const periods = useMemo(
    () => [
    { id: 'week', label: t('pages.periodWeek') },
    { id: 'month', label: t('pages.periodMonth') },
    { id: 'year', label: t('pages.periodYear') }],

    [t]
  );
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
    api.get('/diary/mood-stats')]
    ).
    then(([r, d, m]) => {
      if (!cancelled) {
        setResults(r.data || []);
        setDiaryEntries(d.data || []);
        setMoodStats(m.data || []);
      }
    }).
    catch(() => {
      if (!cancelled) {
        setResults([]);
        setDiaryEntries([]);
        setMoodStats([]);
      }
    }).
    finally(() => {
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
        end: startOfMonth(end)
      });
    }
    const n = period === 'week' ? 7 : 30;
    const start = subDays(end, n - 1);
    return eachDayOfInterval({ start, end });
  }, [period, range.end]);

  const burnoutChartData = useMemo(() => {
    const onboardingDateKey =
      onboardingPct != null && user?.onboarding_burnout_completed_at ?
        format(new Date(user.onboarding_burnout_completed_at), 'yyyy-MM-dd') :
        null;
    const diaryKeys = diaryEntries.map((e) => format(new Date(e.created_at), 'yyyy-MM-dd'));
    const practiceKeys = practiceDatesInRange(range.start, range.end);
    return buildBurnoutTimeline({
      chartDays,
      period,
      moodByDate,
      diaryDateKeys: diaryKeys,
      practiceDateKeys: practiceKeys,
      results,
      onboardingPct,
      onboardingDateKey,
    });
  }, [
    chartDays,
    period,
    moodByDate,
    diaryEntries,
    results,
    onboardingPct,
    user?.onboarding_burnout_completed_at,
    range.start,
    range.end,
  ]);

  const currentBurnoutIndex = useMemo(() => averageBurnoutIndex(burnoutChartData), [burnoutChartData]);
  const currentBurnoutRisk = useMemo(
    () => (currentBurnoutIndex != null ? burnoutRiskFromIndex(currentBurnoutIndex) : null),
    [currentBurnoutIndex]
  );

  const burnoutChartSubtitle =
    period === 'week' ?
      'Индекс выгорания за последние 7 дней' :
      period === 'month' ?
        'Индекс выгорания за последние 30 дней' :
        'Средний индекс выгорания по месяцам';

  const avgMoodPctRaw = useMemo(() => {
    const vals = diaryInPeriod.
    map((e) => e.mood_score).
    filter((v) => v != null).
    map((v) => moodScoreToPercent(v));
    if (vals.length) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const fromStats = moodStats.
    filter((row) => {
      const d = new Date(row.date);
      return isWithinInterval(d, { start: range.start, end: range.end });
    }).
    map((row) => moodScoreToPercent(row.avg_mood));
    if (fromStats.length) return Math.round(fromStats.reduce((a, b) => a + b, 0) / fromStats.length);
    return 0;
  }, [diaryInPeriod, moodStats, range]);

  const lastTestStress = useMemo(
    () => results.length ? stressFromCatalogLevel(results[0]?.level) : null,
    [results]
  );

  const stressPctValue = useMemo(
    () =>
    compositeStressPct({
      onboardingPercent: onboardingPct,
      lastTestStress,
      periodTestStress: stressFromTestResults(resultsInPeriod)
    }),
    [onboardingPct, lastTestStress, resultsInPeriod]
  );

  const stressPct = stressPctValue ?? 40;

  const avgMoodPct = useMemo(
    () =>
    compositeMoodPct({
      diaryAvgMoodPct: avgMoodPctRaw,
      stressPct: stressPctValue ?? 40,
      fallbackWhenNoDiary: 0
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
    const vals = prevDiary.
    map((e) => e.mood_score).
    filter((v) => v != null).
    map((v) => moodScoreToPercent(v));
    if (vals.length) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const fromStats = moodStats.
    filter((row) => {
      const d = new Date(row.date);
      return isWithinInterval(d, { start: prevRange.start, end: prevRange.end });
    }).
    map((row) => moodScoreToPercent(row.avg_mood));
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
      periodTestStress: stressFromTestResults(prevResults)
    }),
    [onboardingPct, prevLatest, prevResults]
  );

  const prevMood = useMemo(
    () =>
    compositeMoodPct({
      diaryAvgMoodPct: prevMoodPctRaw,
      stressPct: prevStressPctValue ?? 40,
      fallbackWhenNoDiary: 0
    }),
    [prevMoodPctRaw, prevStressPctValue]
  );

  const prevAnxietyFromTests = anxietyFromResults(prevResults);
  const prevAnxietyValue = useMemo(
    () =>
    compositeAnxietyPct({
      onboardingPercent: onboardingPct,
      periodAnxietyFromTests: prevAnxietyFromTests
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

  const burnoutDriversText = useMemo(
    () => buildBurnoutDrivers({ stressPct, anxietyPct, energyPct, moodPct: avgMoodPct }),
    [stressPct, anxietyPct, energyPct, avgMoodPct]
  );

  const sleepPct = useMemo(
    () => Math.min(100, Math.round(avgMoodPct * 0.55 + energyPct * 0.45)),
    [avgMoodPct, energyPct]
  );

  const balanceChartHelp = useMemo(
    () =>
      buildBalanceChartHelp({
        avgMoodPct,
        stressPct,
        anxietyPct,
        energyPct,
        sleepPct,
      }),
    [avgMoodPct, stressPct, anxietyPct, energyPct, sleepPct]
  );

  const radarData = [
  { subject: 'Настроение', value: avgMoodPct, fullMark: 100 },
  { subject: 'Стресс', value: stressPct, fullMark: 100 },
  { subject: 'Тревога', value: anxietyPct, fullMark: 100 },
  { subject: 'Энергия', value: energyPct, fullMark: 100 },
  { subject: 'Сон', value: sleepPct, fullMark: 100 }];


  const diaryDateKeys = useMemo(
    () => diaryEntries.map((e) => format(new Date(e.created_at), 'yyyy-MM-dd')),
    [diaryEntries]
  );

  const streak = diaryStreak(diaryDateKeys);
  const entriesCount = diaryInPeriod.length;
  const testsCount = resultsInPeriod.length;
  const practicesDone = countPracticesInRange(range.start, range.end);
  const practiceDaysInPeriod = practiceDatesInRange(range.start, range.end).size;
  const diaryNotesCount = useMemo(
    () => diaryInPeriod.filter((e) => e.note && String(e.note).trim().length > 0).length,
    [diaryInPeriod]
  );

  const favoritesCount = useMemo(() => {
    const sets = loadAllSectionFavoriteSets();
    return sets.films.size + sets.reading.size + sets.music.size + sets.podcasts.size + sets.events.size;
  }, []);

  const periodLabel = period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год';

  const diaryDaysWithCheckin = useMemo(() => {
    const log = getCheckinLog();
    return Object.keys(log).filter((dateKey) => {
      const d = startOfDay(new Date(`${dateKey}T12:00:00`));
      return isWithinInterval(d, { start: range.start, end: range.end });
    }).length;
  }, [range]);

  const insights = useMemo(
    () =>
      buildPersonalInsights({
        entriesCount,
        diaryNotesCount,
        testsCount,
        practicesCount: practicesDone,
        avgMoodPct,
        moodTrend,
        stressPct,
        stressTrend,
        anxietyPct,
        anxietyTrend,
        energyPct,
        energyTrend,
        burnoutIndex: currentBurnoutIndex ?? stressPct,
        diaryDaysWithCheckin,
        practiceDaysCount: practiceDaysInPeriod,
      }),
    [
      entriesCount,
      diaryNotesCount,
      testsCount,
      practicesDone,
      avgMoodPct,
      moodTrend,
      stressPct,
      stressTrend,
      anxietyPct,
      anxietyTrend,
      energyPct,
      energyTrend,
      currentBurnoutIndex,
      diaryDaysWithCheckin,
      practiceDaysInPeriod,
    ]
  );

  const weekSummaryText = useMemo(
    () =>
      buildWeekSummary({
        periodLabel,
        testsCount,
        entriesCount,
        practicesCount: practicesDone,
        moodTrend,
        stressTrend,
        anxietyTrend,
        energyTrend,
        avgMoodPct,
        stressPct,
      }),
    [
      periodLabel,
      testsCount,
      entriesCount,
      practicesDone,
      moodTrend,
      stressTrend,
      anxietyTrend,
      energyTrend,
      avgMoodPct,
      stressPct,
    ]
  );

  const weekGoals = useMemo(
    () =>
      buildWeekGoals({
        stressPct,
        anxietyPct,
        energyPct,
        entriesCount,
        testsCount,
        practicesCount: practicesDone,
        favoritesCount,
        burnoutIndex: currentBurnoutIndex ?? stressPct,
      }),
    [
      stressPct,
      anxietyPct,
      energyPct,
      entriesCount,
      testsCount,
      practicesDone,
      favoritesCount,
      currentBurnoutIndex,
    ]
  );


  if (loading) {
    return (
      <div className="analytics-page analytics-page--loading">
        <div className="loading-spinner" />
      </div>);

  }

  return (
    <div className="analytics-page fade-in" data-no-scroll-reveal>
      <header className="analytics-header">
        <div>
          <h1 className="analytics-title">{t('pages.statsTitle')}</h1>
          <p className="analytics-subtitle">Индекс выгорания, риски и мягкие шаги на основе вашей активности</p>
        </div>
        <div className="analytics-segment" role="tablist" aria-label={t('pages.statsPeriodAria')}>
          {periods.map((p) =>
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            className={`analytics-segment-btn ${period === p.id ? 'active' : ''}`}
            onClick={() => setPeriod(p.id)}>
            
              {p.label}
            </button>
          )}
        </div>
      </header>

      <section className="analytics-kpi-grid">
        <article className="analytics-kpi-card analytics-kpi-card--mood">
          <div className="analytics-kpi-inner">
            <div className="analytics-kpi-head">
              <p className="analytics-kpi-label">Среднее настроение</p>
              <div className="analytics-kpi-delta-slot">
                {moodTrend.text !== '-' && moodTrend.up != null ? (
                  <span className={`analytics-kpi-delta ${deltaToneClass(moodTrend, true)}`}>
                    {moodTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {moodTrend.text}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="analytics-kpi-value">{avgMoodPct}%</p>
          </div>
          <div className="analytics-kpi-deco">
            <MetricStateImage metric="mood" percent={avgMoodPct} label="Настроение" />
          </div>
        </article>
        <article className="analytics-kpi-card analytics-kpi-card--stress">
          <div className="analytics-kpi-inner">
            <div className="analytics-kpi-head">
              <p className="analytics-kpi-label">Уровень стресса</p>
              <div className="analytics-kpi-delta-slot">
                {stressTrend.text !== '-' && stressTrend.up != null ? (
                  <span className={`analytics-kpi-delta ${deltaToneClass(stressTrend, false)}`}>
                    {stressTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {stressTrend.text}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="analytics-kpi-value">{stressPct}%</p>
          </div>
          <div className="analytics-kpi-deco">
            <MetricStateImage metric="stress" percent={stressPct} reverseScale label="Стресс" />
          </div>
        </article>
        <article className="analytics-kpi-card analytics-kpi-card--anxiety">
          <div className="analytics-kpi-inner">
            <div className="analytics-kpi-head">
              <p className="analytics-kpi-label">Тревожность</p>
              <div className="analytics-kpi-delta-slot">
                {anxietyTrend.text !== '-' && anxietyTrend.up != null ? (
                  <span className={`analytics-kpi-delta ${deltaToneClass(anxietyTrend, false)}`}>
                    {anxietyTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {anxietyTrend.text}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="analytics-kpi-value">{anxietyPct}%</p>
          </div>
          <div className="analytics-kpi-deco">
            <MetricStateImage metric="anxiety" percent={anxietyPct} reverseScale label="Тревожность" />
          </div>
        </article>
        <article className="analytics-kpi-card analytics-kpi-card--energy">
          <div className="analytics-kpi-inner">
            <div className="analytics-kpi-head">
              <p className="analytics-kpi-label">Энергия</p>
              <div className="analytics-kpi-delta-slot">
                {energyTrend.text !== '-' && energyTrend.up != null ? (
                  <span className={`analytics-kpi-delta ${deltaToneClass(energyTrend, true)}`}>
                    {energyTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {energyTrend.text}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="analytics-kpi-value">{energyPct}%</p>
          </div>
          <div className="analytics-kpi-deco">
            <MetricStateImage metric="energy" percent={energyPct} label="Энергия" />
          </div>
        </article>
      </section>

      <section className="analytics-charts-row">
        <div className="analytics-burnout-stack">
          <div className="analytics-card analytics-card--burnout-chart analytics-card--chart-wide">
            <h2 className="analytics-mood-chart-title">Динамика выгорания</h2>
            <p className="analytics-mood-chart-sub">{burnoutChartSubtitle}</p>
            {currentBurnoutRisk ? (
              <p className="analytics-burnout-risk-badge" data-level={currentBurnoutRisk.level}>
                Сейчас: {currentBurnoutRisk.label} ({currentBurnoutRisk.index}%)
              </p>
            ) : null}
            <div className="analytics-mood-chart-area">
            <ResponsiveContainer width="100%" height={268}>
              <AreaChart
                data={burnoutChartData}
                margin={{ top: 12, right: 12, left: 8, bottom: 2 }}>
                <defs>
                  <linearGradient id="analyticsBurnoutArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8a87c" stopOpacity={0.45} />
                    <stop offset="55%" stopColor="#f0c4a8" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#fde8dc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ReferenceArea y1={0} y2={34} fill="#e8f4ec" fillOpacity={0.55} />
                <ReferenceArea y1={34} y2={64} fill="#fff6e0" fillOpacity={0.45} />
                <ReferenceArea y1={64} y2={100} fill="#fdeaea" fillOpacity={0.4} />
                <CartesianGrid
                  strokeDasharray="4 6"
                  stroke="rgba(91, 124, 186, 0.16)"
                  strokeWidth={1}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#5c6b82', fontWeight: 500 }}
                  axisLine={{ stroke: 'rgba(91, 124, 186, 0.25)', strokeWidth: 1 }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[17, 50, 83]}
                  width={78}
                  tick={{ fontSize: 10, fill: '#5c6b82', fontWeight: 600 }}
                  tickFormatter={(v) => {
                    if (v <= 25) return 'Низкий';
                    if (v <= 55) return 'Средний';
                    return 'Высокий';
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(200, 120, 80, 0.35)', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    if (p.burnoutRaw == null) {
                      return <div className="analytics-mood-tooltip">Нет данных</div>;
                    }
                    return (
                      <div className="analytics-mood-tooltip">
                        {p.risk?.label || 'Риск'}: {Math.round(Number(p.burnoutRaw))}%
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="burnout"
                  name="Индекс выгорания"
                  stroke="#d4845c"
                  strokeWidth={2.6}
                  fill="url(#analyticsBurnoutArea)"
                  connectNulls={false}
                  dot={{ r: 3.5, fill: '#fff', stroke: '#d4845c', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#d4845c', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <ul className="analytics-burnout-legend" aria-hidden>
            <li><span className="analytics-burnout-legend-swatch analytics-burnout-legend-swatch--low" /> Низкий риск</li>
            <li><span className="analytics-burnout-legend-swatch analytics-burnout-legend-swatch--mid" /> Средний риск</li>
            <li><span className="analytics-burnout-legend-swatch analytics-burnout-legend-swatch--high" /> Высокий риск</li>
          </ul>
          </div>

          <div className="analytics-burnout-insight-block">
            <h3 className="analytics-burnout-insight-title">Что влияет</h3>
            <p className="analytics-burnout-drivers">{burnoutDriversText}</p>
          </div>
        </div>
        <div className="analytics-balance-stack">
          <div className="analytics-card analytics-card--radar">
            <div className="analytics-card-head">
              <h2 className="analytics-card-title">Баланс</h2>
              <span className="analytics-card-meta">5 показателей</span>
            </div>
            <div className="analytics-radar-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="rgba(91, 124, 186, 0.22)" strokeWidth={1} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: '#3d4d66', fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Показатели"
                    dataKey="value"
                    stroke="#4a82d4"
                    fill="#6a9fe8"
                    fillOpacity={0.42}
                    strokeWidth={2.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="analytics-burnout-insight-block analytics-balance-help-block">
            <h3 className="analytics-burnout-insight-title">Как читать график</h3>
            <p className="analytics-burnout-drivers analytics-balance-help-intro">
              {balanceChartHelp.intro}
            </p>
            <ul className="analytics-balance-help-list">
              {balanceChartHelp.items.map((item) => (
                <li key={item.label}>
                  <span className="analytics-balance-help-label">{item.label}</span>
                  {' — '}
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="analytics-insights">
        <h2 className="analytics-section-title">Персональные инсайты</h2>
        <div className="analytics-insights-grid">
          {insights.map((item) =>
          <article key={item.title} className={`analytics-insight analytics-insight--${item.kind}`}>
              <div
              className={`analytics-insight-icon analytics-insight-icon--${item.kind}`}
              aria-hidden>
              
                {item.kind === 'good' ?
              <Sun size={22} strokeWidth={2.2} /> :
              item.kind === 'warn' ?
              <AlertTriangle size={22} strokeWidth={2.2} /> :
              <Lightbulb size={22} strokeWidth={2.2} />}
              </div>
              <h3 className="analytics-insight-title">{item.title}</h3>
              <p className="analytics-insight-text">{item.text}</p>
            </article>
          )}
        </div>
      </section>

      <section className="analytics-activity">
        <h2 className="analytics-section-title">Прогресс активности</h2>
        <div className="analytics-card analytics-donuts-card">
          <div className="analytics-donuts-track">
            <DonutStat current={entriesCount} max={50} label="Записей создано" color="#5b8fd8" />
            <span className="analytics-donut-bridge" aria-hidden />
            <DonutStat current={practicesDone} max={30} label="Практик завершено" color="#7aa6e3" />
            <span className="analytics-donut-bridge" aria-hidden />
            <DonutStat current={Math.min(streak, 14)} max={14} label="Дней подряд" color="#3d6fb5" />
            <span className="analytics-donut-bridge" aria-hidden />
            <DonutStat current={testsCount} max={10} label="Тестов пройдено" color="#9bbef0" />
            <span className="analytics-donut-bridge analytics-donut-bridge--short" aria-hidden />
            <div className="analytics-progress-plane" aria-hidden>
              <Send size={22} strokeWidth={2.2} />
            </div>
          </div>
        </div>
      </section>

      <section className="analytics-week-summary">
        <div className="analytics-summary-grid">
          <article className="analytics-summary-tile analytics-summary-tile--done">
            <span className="analytics-summary-tile-badge" aria-hidden>
              <Check size={16} strokeWidth={2.5} />
            </span>
            <div className="analytics-summary-tile-head">
              <h3 className="analytics-summary-heading">Итоги {period === 'week' ? 'недели' : 'периода'}</h3>
              <p className="analytics-summary-lead">Факты и изменения</p>
            </div>
            <p className="analytics-week-summary-text">{weekSummaryText}</p>
            <div className="analytics-summary-tile-deco" aria-hidden />
          </article>
          <article className="analytics-summary-tile analytics-summary-tile--goals">
            <span className="analytics-summary-tile-badge analytics-summary-tile-badge--outline" aria-hidden>
              <Check size={16} strokeWidth={2.5} />
            </span>
            <div className="analytics-summary-tile-head">
              <h3 className="analytics-summary-heading">Цели на следующую неделю</h3>
              <p className="analytics-summary-lead">Мягкие шаги к балансу</p>
            </div>
            <ul className="analytics-summary-list analytics-summary-list--dots">
              {weekGoals.map((line) => (
                <li key={line}>
                  <span className="analytics-summary-dot" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="analytics-summary-tile-deco analytics-summary-tile-deco--stones" aria-hidden />
          </article>
        </div>
      </section>
    </div>);

};

export default Stats;