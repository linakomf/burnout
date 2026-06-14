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
} from '../../utils/burnoutAnalytics';
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

function resolveAnxietyPct(anxietyValue, stressPct) {
  if (anxietyValue != null && !Number.isNaN(Number(anxietyValue))) {
    return Number(anxietyValue);
  }
  return Math.round((stressPct ?? 40) * 0.88);
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
    return buildBurnoutTimeline({
      chartDays,
      period,
      moodByDate,
      diaryDateKeys: diaryKeys,
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
  const anxietyPct = resolveAnxietyPct(anxietyPctValue, stressPct);

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

  const prevAnxietyPct = resolveAnxietyPct(prevAnxietyValue, prevStressPctValue ?? 40);

  const moodTrend = formatTrend(prevMood, avgMoodPct);
  const stressTrend = formatTrend(prevStressPctValue, stressPctValue);
  const anxietyTrend = formatTrend(prevAnxietyPct, anxietyPct);
  const energyTrend = formatTrend(prevEnergy, energyPct);

  const radarData = [
  { subject: 'Настроение', value: avgMoodPct, fullMark: 100 },
  { subject: 'Стресс', value: stressPct, fullMark: 100 },
  { subject: 'Тревога', value: anxietyPct, fullMark: 100 },
  { subject: 'Энергия', value: energyPct, fullMark: 100 }];


  const diaryDateKeys = useMemo(
    () => diaryEntries.map((e) => format(new Date(e.created_at), 'yyyy-MM-dd')),
    [diaryEntries]
  );

  const streak = diaryStreak(diaryDateKeys);
  const entriesCount = diaryInPeriod.length;
  const testsCount = resultsInPeriod.length;
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
          <p className="analytics-subtitle">Индекс выгорания и показатели вашего состояния</p>
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
                {anxietyTrend.text !== '-' ? (
                  <span
                    className={`analytics-kpi-delta${
                      anxietyTrend.up != null ? ` ${deltaToneClass(anxietyTrend, false)}` : ' analytics-kpi-delta--flat'
                    }`}
                  >
                    {anxietyTrend.up === true ? <TrendingUp size={14} /> : null}
                    {anxietyTrend.up === false ? <TrendingDown size={14} /> : null}
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
        </div>
        <div className="analytics-balance-stack">
          <div className="analytics-card analytics-card--radar">
            <div className="analytics-card-head">
              <h2 className="analytics-card-title">Баланс</h2>
              <span className="analytics-card-meta">4 показателя</span>
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
        </div>
      </section>

      <section className="analytics-activity">
        <h2 className="analytics-section-title">Прогресс активности</h2>
        <div className="analytics-card analytics-donuts-card">
          <div className="analytics-donuts-track">
            <DonutStat current={entriesCount} max={50} label="Записей создано" color="#5b8fd8" />
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
    </div>);

};

export default Stats;