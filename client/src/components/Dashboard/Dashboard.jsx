import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  AlertCircle,
  Bell,
  Brain,
  Clock,
  Circle,
  Leaf,
  PhoneCall,
  Save,
  Sparkles,
  Star,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import api from '../../utils/api';
import {
  stressFromCatalogLevel,
  compositeStressPct,
  compositeMoodPct,
  compositeEnergyPct,
} from '../../utils/wellnessComposite';
import {
  getCheckinForDate,
  setCheckinForDate,
  emitCheckinSaved,
} from '../../utils/dailyCheckinStorage';
import { weekPillLines } from '../../utils/weekPillLines';
import './Dashboard.css';

const ONBOARD_KEY = 'burnout_onboarding_v1';
const PSYCH_REQ_KEY = 'burnout_psych_requests_v1';

const MOOD_PILLS = [
  { id: 0, emoji: '😁', labelClass: 'mood-pill--excellent' },
  { id: 1, emoji: '🙂', labelClass: 'mood-pill--good' },
  { id: 2, emoji: '😐', labelClass: 'mood-pill--ok' },
  { id: 3, emoji: '😔', labelClass: 'mood-pill--sad' },
  { id: 4, emoji: '😰', labelClass: 'mood-pill--anxious' },
];

function moodIndexToPercent(idx) {
  return [100, 82, 60, 38, 18][idx] ?? 50;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { lang, t, tRaw } = useLanguage();
  const navigate = useNavigate();
  const today = new Date();

  const [activeTab, setActiveTab] = useState('today');
  const [selectedDay, setSelectedDay] = useState(today);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState(() => new Set());
  const [expandedRecIndex, setExpandedRecIndex] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinVersion, setCheckinVersion] = useState(0);
  const [checkinForm, setCheckinForm] = useState({
    moodIndex: 2,
    energy: 5,
    stress: 5,
    notes: '',
  });
  const [psychModalOpen, setPsychModalOpen] = useState(false);
  const [psychForm, setPsychForm] = useState({
    email: '',
    phone: '',
    fullName: '',
    helpText: '',
  });
  const [psychSuccess, setPsychSuccess] = useState(false);
  const [psychError, setPsychError] = useState('');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const isViewingToday = selectedDayStr === todayStr;

  useEffect(() => {
    api.get('/tests/results/my')
      .then(res => setTestResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      if (!localStorage.getItem(ONBOARD_KEY)) setShowOnboarding(true);
    } catch {
    }
  }, [loading]);

  const dismissOnboarding = (goTests) => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1');
    } catch {
    }
    setShowOnboarding(false);
    if (goTests) navigate('/tests');
  };

  const lastResult = testResults[0];
  const stressFromTests = useMemo(() => {
    const lastTestStress = stressFromCatalogLevel(lastResult?.level);
    const v = compositeStressPct({
      onboardingPercent: user?.onboarding_burnout_percent ?? null,
      lastTestStress,
      periodTestStress: null,
    });
    return v ?? 40;
  }, [user?.onboarding_burnout_percent, lastResult?.level]);

  const moodFromTests = useMemo(() => {
    const m = compositeMoodPct({
      diaryAvgMoodPct: 0,
      stressPct: stressFromTests,
      fallbackWhenNoDiary: 0,
    });
    return m > 0 ? m : Math.max(10, 100 - stressFromTests);
  }, [stressFromTests]);

  const energyFromTests = useMemo(
    () => compositeEnergyPct(moodFromTests, stressFromTests),
    [moodFromTests, stressFromTests]
  );

  const todayCheckin = useMemo(
    () => getCheckinForDate(todayStr),
    // checkinVersion — перечитываем localStorage после сохранения
    // eslint-disable-next-line react-hooks/exhaustive-deps -- need checkinVersion bump
    [todayStr, checkinVersion]
  );

  const stressVal =
    isViewingToday && todayCheckin ? todayCheckin.stress : stressFromTests;
  const moodVal = isViewingToday && todayCheckin ? todayCheckin.mood : moodFromTests;
  const energyVal = isViewingToday && todayCheckin ? todayCheckin.energy : energyFromTests;
  const hasTodayCheckin = Boolean(todayCheckin);

  const greetingLine = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('dash.greeting.morning');
    if (h < 18) return t('dash.greeting.day');
    return t('dash.greeting.evening');
  }, [t]);

  const tip = useMemo(() => {
    if (stressVal >= 70) {
      return {
        title: t('tip.high.title'),
        text: t('tip.high.text'),
        activities: [
          { icon: '🧘', label: t('tipAct.m1.label'), time: t('tipAct.m1.time') },
          { icon: '🚶', label: t('tipAct.m2.label'), time: t('tipAct.m2.time') },
          { icon: '😴', label: t('tipAct.m3.label'), time: t('tipAct.m3.time') },
        ],
      };
    }
    if (stressVal >= 40) {
      return {
        title: t('tip.mid.title'),
        text: t('tip.mid.text'),
        activities: [
          { icon: '🏃', label: t('tipAct.w1.label'), time: t('tipAct.w1.time') },
          { icon: '🎨', label: t('tipAct.w2.label'), time: t('tipAct.w2.time') },
          { icon: '🧘', label: t('tipAct.w3.label'), time: t('tipAct.w3.time') },
        ],
      };
    }
    return {
      title: t('tip.low.title'),
      text: t('tip.low.text'),
      activities: [
        { icon: '🏋️', label: t('tipAct.l1.label'), time: t('tipAct.l1.time') },
        { icon: '📚', label: t('tipAct.l2.label'), time: t('tipAct.l2.time') },
        { icon: '🎵', label: t('tipAct.l3.label'), time: t('tipAct.l3.time') },
      ],
    };
  }, [stressVal, t]);

  useEffect(() => {
    let idx = -1;
    if (stressVal >= 70) idx = 0;
    else if (stressVal >= 40) idx = 2;
    const act = idx >= 0 ? tip.activities[idx] : null;
    setSelectedActivities(act ? new Set([act.label]) : new Set());
    setExpandedRecIndex(null);
  }, [tip, stressVal]);

  const moodOptions = useMemo(
    () =>
      MOOD_PILLS.map((m) => ({
        ...m,
        label: t(`mood.${m.id}`),
      })),
    [t]
  );

  const toggleActivity = (label) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleRecCard = (index) => {
    setExpandedRecIndex((cur) => (cur === index ? null : index));
  };

  const openCheckinModal = () => {
    setCheckinForm({
      moodIndex: 2,
      energy: 5,
      stress: 5,
      notes: '',
    });
    setCheckinModalOpen(true);
  };

  const saveCheckinFromModal = () => {
    const mood = moodIndexToPercent(checkinForm.moodIndex);
    const stress = Math.min(100, Math.max(0, Math.round(Number(checkinForm.stress) * 10)));
    const energy = Math.min(100, Math.max(0, Math.round(Number(checkinForm.energy) * 10)));
    try {
      setCheckinForDate(todayStr, {
        mood,
        stress,
        energy,
        moodIndex: checkinForm.moodIndex,
        notes: checkinForm.notes.trim(),
      });
      emitCheckinSaved();
    } catch {
      /* private mode */
    }
    setCheckinVersion((v) => v + 1);
    setCheckinModalOpen(false);
  };

  const openPsychModal = () => {
    setPsychError('');
    setPsychSuccess(false);
    setPsychForm({
      email: (user?.email || '').trim(),
      phone: '',
      fullName: (user?.name || '').trim(),
      helpText: '',
    });
    setPsychModalOpen(true);
  };

  const closePsychModal = () => {
    setPsychModalOpen(false);
    setPsychError('');
    setPsychSuccess(false);
  };

  const submitPsychRequest = (e) => {
    e.preventDefault();
    const email = psychForm.email.trim();
    const phone = psychForm.phone.trim();
    const fullName = psychForm.fullName.trim();
    const helpText = psychForm.helpText.trim();
    if (!email || !phone || !fullName || !helpText) {
      setPsychError(t('dash.psych.fillAll'));
      return;
    }
    const entry = {
      email,
      phone,
      fullName,
      helpText,
      createdAt: new Date().toISOString(),
    };
    try {
      let list = [];
      const raw = localStorage.getItem(PSYCH_REQ_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p)) list = p;
      }
      list.push(entry);
      localStorage.setItem(PSYCH_REQ_KEY, JSON.stringify(list));
    } catch {
      /* private mode */
    }
    setPsychError('');
    setPsychSuccess(true);
  };

  const recommendations = useMemo(() => {
    const recIcons = [Wind, Brain, Sparkles];
    return [0, 1, 2].map((i) => {
      const raw = tRaw(`rec.${i}`) || {};
      return {
        icon: recIcons[i],
        title: raw.title,
        category: raw.category,
        time: raw.time,
        desc: raw.desc,
        detail: raw.detail,
        hasPlay: i === 2,
        thumb: i === 2 ? 'dark' : 'light',
        catVariant: i === 0 ? 'breath' : i === 1 ? 'test' : 'meditation',
      };
    });
  }, [tRaw]);

  if (loading) return (
    <div className="dash-loading"><div className="loading-spinner" /></div>
  );

  return (
    <div className="dashboard-new fade-in-page">

      <div className="dash-header">
        <h1 className="dash-greeting">
          {greetingLine},{' '}
          {(user?.name?.split(' ')[0] || t('dash.greeting.friend')).toUpperCase()}!
        </h1>
        <button type="button" className="notif-btn" aria-label={t('dash.notif')}>
          <Bell size={20} />
        </button>
      </div>

      <div className="dash-tabs">
        <button
          className={`dash-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          {t('dash.tabs.today')}
        </button>
        <button
          className={`dash-tab ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          {t('dash.tabs.week')}
        </button>
      </div>

      <div className="week-strip">
        {weekDays.map((day, i) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
          const { dateLine, wdayLine } = weekPillLines(day, lang, t);
          return (
            <button
              key={i}
              type="button"
              className={`week-day-btn ${isToday && !isSelected ? 'is-today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="wday-date">{dateLine}</span>
              <span className="wday-name">{wdayLine}</span>
            </button>
          );
        })}
      </div>

      <div className="hero-banner hero-banner--mock">
        <div className="hero-left">
          <img
            src="/photos/hero-character.png"
            alt={t('dash.heroAlt')}
            className="hero-character"
            onError={e => { e.target.style.opacity = 0; }}
          />
        </div>

        <div className="hero-right">
          {isViewingToday && !hasTodayCheckin ? (
            <div className="checkin-prompt-card">
              <div className="checkin-prompt-top">
                <span className="checkin-prompt-icon-badge" aria-hidden>
                  <Star size={17} fill="currentColor" strokeWidth={1.5} className="checkin-prompt-star" />
                </span>
                <h3 className="checkin-prompt-title">{t('dash.checkin.title')}</h3>
              </div>
              <p className="checkin-prompt-sub">
                {t('dash.checkin.sub')}
              </p>
              <button
                type="button"
                className="checkin-prompt-cta"
                onClick={openCheckinModal}
              >
                {t('dash.checkin.cta')}
              </button>
            </div>
          ) : (
            <div className="stats-indicators-panel">
              <div className="indicator mood-ind">
                <div className="ind-top">
                  <span>{t('dash.stats.mood')}</span>
                  <span className="ind-pct">{moodVal}%</span>
                </div>
                <div className="ind-row">
                  <span className="ind-emoji-s">😟</span>
                  <div className="ind-track">
                    <div className="ind-bar mood-bar" style={{ width: `${moodVal}%` }} />
                  </div>
                  <span className="ind-emoji-s">😊</span>
                </div>
              </div>

              <div className="indicator stress-ind">
                <div className="ind-top">
                  <span>{t('dash.stats.stress')}</span>
                  <span className="ind-pct">{stressVal}%</span>
                </div>
                <div className="ind-track">
                  <div className="ind-bar stress-bar" style={{ width: `${stressVal}%` }} />
                </div>
              </div>

              <div className="indicator energy-ind">
                <div className="ind-top">
                  <span>{t('dash.stats.energy')}</span>
                  <span className="ind-pct">{energyVal}%</span>
                </div>
                <div className="ind-track">
                  <div className="ind-bar energy-bar" style={{ width: `${energyVal}%` }} />
                </div>
              </div>

              <div className="hero-actions-row hero-actions-row--stats">
                <button type="button" className="details-btn" onClick={() => setDetailsOpen(true)}>
                  {t('dash.stats.more')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tip-card">
        <h2 className="tip-title">💡 {tip.title.toUpperCase()}</h2>
        <p className="tip-body">{tip.text}</p>
        <p className="activities-label">{t('dash.activitiesLabel')}</p>
        <div className="activities-grid">
          {tip.activities.map((act) => {
            const sel = selectedActivities.has(act.label);
            return (
              <button
                key={act.label}
                type="button"
                className={`activity-pill ${sel ? 'selected' : ''}`}
                onClick={() => toggleActivity(act.label)}
                aria-pressed={sel}
              >
                <span className="act-check" aria-hidden>
                  {sel ? <span className="act-check-mark">✔</span> : <Circle size={18} />}
                </span>
                <span className="act-icon">{act.icon}</span>
                <span className="act-label">{act.label}</span>
                <span className="act-time"><Clock size={11} /> {act.time}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="recs-section">
        <h2 className="recs-title">
          <Leaf className="recs-title-leaf" size={22} strokeWidth={2.2} aria-hidden />
          <span>{t('dash.recsTitle')}</span>
        </h2>
        <div className="recs-list">
          {recommendations.map((rec, i) => {
            const expanded = expandedRecIndex === i;
            const RecIcon = rec.icon;
            return (
              <div
                key={`rec-${i}`}
                role="button"
                tabIndex={0}
                className={`rec-card ${expanded ? 'expanded' : ''}`}
                onClick={() => toggleRecCard(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleRecCard(i);
                  }
                }}
                aria-expanded={expanded}
              >
                <div
                  className={`rec-img-wrap ${
                    rec.thumb === 'dark' ? 'rec-img-wrap--dark' : 'rec-img-wrap--light'
                  }`}
                >
                  <RecIcon className="rec-thumb-icon" size={32} strokeWidth={1.6} aria-hidden />
                  {rec.hasPlay && (
                    <div className="rec-play" aria-hidden>
                      <span className="rec-play-btn" title={t('dash.recPlay')}>▶</span>
                    </div>
                  )}
                </div>
                <div className="rec-body">
                  <h3 className="rec-name">{rec.title}</h3>
                  <p className="rec-meta">
                    <span
                      className={`rec-cat rec-cat--${rec.catVariant || 'test'}`}
                    >
                      {rec.category}
                    </span>
                    <span className="rec-time-suffix">
                      {' '}
                      — {rec.time}
                    </span>
                  </p>
                  <p className="rec-desc">{rec.desc}</p>
                  {expanded && (
                    <div className="rec-expanded" onClick={(e) => e.stopPropagation()}>
                      <p className="rec-detail">{rec.detail}</p>
                      <button
                        type="button"
                        className="rec-start-btn btn btn-primary"
                        onClick={() => navigate(i === 1 ? '/tests' : '/practices')}
                      >
                        {t('dash.recStart')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section
        className={psychModalOpen ? 'psych-cta-section psych-cta-section--over-modal' : 'psych-cta-section'}
        aria-label={t('dash.psych.sectionAria')}
      >
        <button
          type="button"
          className={psychModalOpen ? 'psych-cta-btn psych-cta-btn--close-only' : 'psych-cta-btn'}
          onClick={psychModalOpen ? closePsychModal : openPsychModal}
          aria-label={psychModalOpen ? t('dash.psych.closeRequest') : t('dash.psych.cta')}
        >
          {psychModalOpen ? (
            <X className="psych-cta-ic" size={22} strokeWidth={2.2} aria-hidden />
          ) : (
            <>
              <PhoneCall className="psych-cta-ic" size={18} strokeWidth={2.2} aria-hidden />
              <span className="psych-cta-text">
                <span className="psych-cta-title">{t('dash.psych.cta')}</span>
                <span className="psych-cta-sub">{t('dash.psych.ctaSub')}</span>
              </span>
            </>
          )}
        </button>
      </section>

      {checkinModalOpen && (
        <div
          className="modal-overlay checkin-form-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkin-form-title"
          onClick={() => setCheckinModalOpen(false)}
        >
          <div className="modal-card checkin-form-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close checkin-form-close"
              onClick={() => setCheckinModalOpen(false)}
              aria-label={t('dash.close')}
            >
              <X size={20} />
            </button>
            <h2 id="checkin-form-title" className="checkin-form-h1">
              {t('dash.checkinForm.title')}
            </h2>
            <p className="checkin-form-lead">
              {t('dash.checkinForm.lead')}
            </p>

            <div className="checkin-mood-row" role="group" aria-label={t('dash.checkinForm.moodGroup')}>
              {moodOptions.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`checkin-mood-btn ${checkinForm.moodIndex === m.id ? 'selected' : ''}`}
                  onClick={() => setCheckinForm((f) => ({ ...f, moodIndex: m.id }))}
                  aria-pressed={checkinForm.moodIndex === m.id}
                >
                  <span className="checkin-mood-emoji">{m.emoji}</span>
                  <span className={`checkin-mood-label ${m.labelClass}`}>{m.label}</span>
                </button>
              ))}
            </div>

            <section className="checkin-field">
              <div className="checkin-field-head">
                <span className="checkin-field-icon checkin-field-icon--energy">
                  <Zap size={18} strokeWidth={2.2} aria-hidden />
                </span>
                <div className="checkin-field-titles">
                  <div className="checkin-field-title">{t('dash.checkinForm.energy')}</div>
                  <div className="checkin-field-sub">{t('dash.checkinForm.energySub')}</div>
                </div>
                <span className="checkin-field-value">{checkinForm.energy}</span>
              </div>
              <input
                type="range"
                className="checkin-range checkin-range--energy"
                min={1}
                max={10}
                value={checkinForm.energy}
                onChange={(e) =>
                  setCheckinForm((f) => ({ ...f, energy: Number(e.target.value) }))
                }
                aria-label={t('dash.checkinForm.energyAria')}
              />
              <div className="checkin-range-labels">
                <span>{t('dash.checkinForm.rangeLow')}</span>
                <span>{t('dash.checkinForm.rangeHigh')}</span>
              </div>
            </section>

            <section className="checkin-field">
              <div className="checkin-field-head">
                <span className="checkin-field-icon checkin-field-icon--stress">
                  <AlertCircle size={18} strokeWidth={2.2} aria-hidden />
                </span>
                <div className="checkin-field-titles">
                  <div className="checkin-field-title">{t('dash.checkinForm.stress')}</div>
                  <div className="checkin-field-sub">{t('dash.checkinForm.stressSub')}</div>
                </div>
                <span className="checkin-field-value">{checkinForm.stress}</span>
              </div>
              <input
                type="range"
                className="checkin-range checkin-range--stress"
                min={1}
                max={10}
                value={checkinForm.stress}
                onChange={(e) =>
                  setCheckinForm((f) => ({ ...f, stress: Number(e.target.value) }))
                }
                aria-label={t('dash.checkinForm.stressAria')}
              />
              <div className="checkin-range-labels">
                <span>{t('dash.checkinForm.rangeLowM')}</span>
                <span>{t('dash.checkinForm.rangeHighM')}</span>
              </div>
            </section>

            <section className="checkin-field checkin-field--notes">
              <div className="checkin-field-head checkin-field-head--notes">
                <span className="checkin-field-icon checkin-field-icon--notes">
                  <Sparkles size={16} strokeWidth={2} aria-hidden />
                </span>
                <div className="checkin-field-titles">
                  <div className="checkin-field-title">{t('dash.checkinForm.notes')}</div>
                  <div className="checkin-field-sub">{t('dash.checkinForm.notesSub')}</div>
                </div>
              </div>
              <textarea
                className="checkin-notes-input"
                rows={4}
                placeholder={t('dash.checkinForm.notesPh')}
                value={checkinForm.notes}
                onChange={(e) => setCheckinForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </section>

            <div className="checkin-form-actions">
              <button
                type="button"
                className="checkin-btn-cancel"
                onClick={() => setCheckinModalOpen(false)}
              >
                {t('dash.checkinForm.cancel')}
              </button>
              <button type="button" className="checkin-btn-save" onClick={saveCheckinFromModal}>
                <Save size={18} strokeWidth={2.2} aria-hidden />
                {t('dash.checkinForm.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {psychModalOpen && (
        <div
          className="modal-overlay psych-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="psych-modal-title"
          onClick={closePsychModal}
        >
          <div className="modal-card psych-form-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close psych-form-close" onClick={closePsychModal} aria-label={t('dash.close')}>
              <X size={18} />
            </button>
            {psychSuccess ? (
              <div className="psych-form-success">
                <p className="psych-success-title">{t('dash.psych.successTitle')}</p>
                <p className="psych-success-text">
                  {t('dash.psych.successText')}
                </p>
                <button type="button" className="psych-form-submit" onClick={closePsychModal}>
                  {t('dash.close')}
                </button>
              </div>
            ) : (
              <form className="psych-form" onSubmit={submitPsychRequest} noValidate>
                <h2 id="psych-modal-title" className="psych-form-title">
                  {t('dash.psych.formTitle')}
                </h2>
                <p className="psych-form-lead">
                  {t('dash.psych.formLead')}
                </p>
                {psychError && <p className="psych-form-error" role="alert">{psychError}</p>}
                <label className="psych-label">
                  <span>{t('dash.psych.email')}</span>
                  <input
                    type="email"
                    className="psych-input"
                    autoComplete="email"
                    value={psychForm.email}
                    onChange={(e) => setPsychForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </label>
                <label className="psych-label">
                  <span>{t('dash.psych.phone')}</span>
                  <input
                    type="tel"
                    className="psych-input"
                    autoComplete="tel"
                    value={psychForm.phone}
                    onChange={(e) => setPsychForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder={t('dash.psych.phonePh')}
                    required
                  />
                </label>
                <label className="psych-label">
                  <span>{t('dash.psych.fio')}</span>
                  <input
                    type="text"
                    className="psych-input"
                    name="name"
                    autoComplete="name"
                    value={psychForm.fullName}
                    onChange={(e) => setPsychForm((f) => ({ ...f, fullName: e.target.value }))}
                    required
                  />
                </label>
                <label className="psych-label">
                  <span>{t('dash.psych.help')}</span>
                  <textarea
                    className="psych-textarea"
                    rows={3}
                    value={psychForm.helpText}
                    onChange={(e) => setPsychForm((f) => ({ ...f, helpText: e.target.value }))}
                    placeholder={t('dash.psych.helpPh')}
                    required
                  />
                </label>
                <button type="submit" className="psych-form-submit">
                  {t('dash.psych.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {detailsOpen && (
        <div
          className="modal-overlay dash-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dash-details-title"
          onClick={() => setDetailsOpen(false)}
        >
          <div className="modal-card dash-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="dash-details-title">{t('dash.details.title')}</h2>
              <button type="button" className="modal-close" onClick={() => setDetailsOpen(false)} aria-label={t('dash.close')}>
                <X size={18} />
              </button>
            </div>
            <p className="dash-details-lead">
              {t('dash.details.leadIntro')}
              {isViewingToday && hasTodayCheckin
                ? t('dash.details.leadFromCheckin')
                : user?.onboarding_burnout_percent != null
                  ? t('dash.details.leadModelWithOnb')
                  : t('dash.details.leadModel')}
              {t('dash.details.leadDisclaim')}
            </p>
            <ul className="dash-details-list">
              <li>
                <strong>
                  {t('dash.details.liMood')} ({moodVal}%)
                </strong>{' '}
                {t('dash.details.liMoodExp')}
              </li>
              <li>
                <strong>
                  {t('dash.details.liStress')} ({stressVal}%)
                </strong>{' '}
                {t('dash.details.liStressExp')}
              </li>
              <li>
                <strong>
                  {t('dash.details.liEnergy')} ({energyVal}%)
                </strong>{' '}
                {t('dash.details.liEnergyExp')}
              </li>
            </ul>
            <p className="dash-details-note">
              {t('dash.details.foot')}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDetailsOpen(false)}>{t('dash.details.close')}</button>
              <button type="button" className="btn btn-primary" onClick={() => { setDetailsOpen(false); navigate('/stats'); }}>
                {t('dash.details.analytics')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="modal-overlay" role="dialog" aria-labelledby="onboard-title">
          <div className="modal-card fade-in">
            <h2 id="onboard-title" style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800}}>{t('dash.onboard.title')}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-mid)', marginBottom: 20 }}>
              {t('dash.onboard.body')}
            </p>
            <div className="modal-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => dismissOnboarding(false)}>
                {t('dash.onboard.later')}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => dismissOnboarding(true)}>
                {t('dash.onboard.toTests')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
