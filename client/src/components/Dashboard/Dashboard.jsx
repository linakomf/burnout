import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  Clapperboard,
  ClipboardList,
  Flower2,
  Heart,
  Moon,
  Music,
  Save,
  Sparkles,
  Trees,
  X } from
'lucide-react';
import api from '../../utils/api';
import {
  stressFromCatalogLevel,
  compositeStressPct,
  compositeMoodPct,
  compositeEnergyPct } from
'../../utils/wellnessComposite';
import {
  getCheckinForDate,
  setCheckinForDate,
  emitCheckinSaved } from
'../../utils/dailyCheckinStorage';
import { weekPillLines } from '../../utils/weekPillLines';
import { natureAt } from '../Practices/spaceNatureImagery';
import supportNearbyArt from '../../assets/dash-support-nearby.png';
import './Dashboard.css';

const ONBOARD_KEY = 'burnout_onboarding_v1';

const ADVICE_CARD_DEFS = [
  { key: 'music', path: '/practices/music', natureIdx: 4, theme: 'purple', Icon: Music },
  { key: 'films', path: '/practices/films', natureIdx: 11, theme: 'orange', Icon: Clapperboard },
  { key: 'walk', path: '/practices/events', natureIdx: 6, theme: 'green', Icon: Trees },
  { key: 'read', path: '/practices/articles', natureIdx: 14, theme: 'blue', Icon: BookOpen },
  { key: 'meditate', path: '/practices/meditation', natureIdx: 9, theme: 'violet', Icon: Moon }
];

const MOOD_PILLS = [
{ id: 0, emoji: '😁', labelClass: 'mood-pill--excellent' },
{ id: 1, emoji: '🙂', labelClass: 'mood-pill--good' },
{ id: 2, emoji: '😐', labelClass: 'mood-pill--ok' },
{ id: 3, emoji: '😔', labelClass: 'mood-pill--sad' },
{ id: 4, emoji: '😰', labelClass: 'mood-pill--anxious' }];


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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinVersion, setCheckinVersion] = useState(0);
  const [checkinForm, setCheckinForm] = useState({
    moodIndex: 2,
    energy: 5,
    stress: 5,
    notes: ''
  });
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const isViewingToday = selectedDayStr === todayStr;

  useEffect(() => {
    api.get('/tests/results/my').
    then((res) => setTestResults(res.data)).
    catch(() => {}).
    finally(() => setLoading(false));
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

  const testDoneToday = useMemo(() => {
    const ca = lastResult?.created_at;
    if (!ca) return false;
    try {
      return format(new Date(ca), 'yyyy-MM-dd') === todayStr;
    } catch {
      return false;
    }
  }, [lastResult, todayStr]);

  const stressFromTests = useMemo(() => {
    const lastTestStress = stressFromCatalogLevel(lastResult?.level);
    const v = compositeStressPct({
      onboardingPercent: user?.onboarding_burnout_percent ?? null,
      lastTestStress,
      periodTestStress: null
    });
    return v ?? 40;
  }, [user?.onboarding_burnout_percent, lastResult?.level]);

  const moodFromTests = useMemo(() => {
    const m = compositeMoodPct({
      diaryAvgMoodPct: 0,
      stressPct: stressFromTests,
      fallbackWhenNoDiary: 0
    });
    return m > 0 ? m : Math.max(10, 100 - stressFromTests);
  }, [stressFromTests]);

  const energyFromTests = useMemo(
    () => compositeEnergyPct(moodFromTests, stressFromTests),
    [moodFromTests, stressFromTests]
  );

  const todayCheckin = useMemo(
    () => getCheckinForDate(todayStr),


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

  const adviceCards = useMemo(
    () =>
      ADVICE_CARD_DEFS.map((def) => {
        const copy = tRaw(`dash.advice.cards.${def.key}`) || {};
        return {
          ...def,
          category: copy.category || '',
          title: copy.title || '',
          desc: copy.desc || '',
          duration: copy.duration || ''
        };
      }),
    [tRaw]
  );

  const moodOptions = useMemo(
    () =>
    MOOD_PILLS.map((m) => ({
      ...m,
      label: t(`mood.${m.id}`)
    })),
    [t]
  );

  const supportEmail = (process.env.REACT_APP_SUPPORT_EMAIL || '').trim();

  const openSupportContact = () => {
    if (supportEmail) {
      window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(t('dash.supportNearby.mailSubject'))}`;
    } else {
      navigate('/diary');
    }
  };

  const openCheckinModal = () => {
    setCheckinForm({
      moodIndex: 2,
      energy: 5,
      stress: 5,
      notes: ''
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
        notes: checkinForm.notes.trim()
      });
      emitCheckinSaved();
    } catch {

    }
    setCheckinVersion((v) => v + 1);
    setCheckinModalOpen(false);
  };

  if (loading) return (
    <div className="dash-loading"><div className="loading-spinner" /></div>);


  const firstName = user?.name?.split(' ')[0] || t('dash.greeting.friend');

  return (
    <div className="dashboard-new fade-in-page">

      <header className="dash-header">
        <h1 className="dash-greeting">
          {greetingLine},{' '}
          <span className="dash-greeting-name">{firstName}</span>
          <span className="dash-greeting-accent" aria-hidden>
            {' '}
            🌿
          </span>
        </h1>
        <button type="button" className="notif-btn" aria-label={t('dash.notif')}>
          <Bell size={20} />
        </button>
      </header>

      <div className="dash-tabs">
        <button
          className={`dash-tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}>
          
          {t('dash.tabs.today')}
        </button>
        <button
          className={`dash-tab ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}>
          
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
              onClick={() => setSelectedDay(day)}>
              
              <span className="wday-date">{dateLine}</span>
              <span className="wday-name">{wdayLine}</span>
            </button>);

        })}
      </div>

      <div className="hero-banner hero-banner--mock">
        <div className="hero-banner-atmosphere" aria-hidden />
        <div className="hero-left">
          <img
            src="/photos/hero-character.png"
            alt={t('dash.heroAlt')}
            className="hero-character"
            onError={(e) => {e.target.style.opacity = 0;}} />
          
        </div>

        <div className="hero-right">
          {isViewingToday && !hasTodayCheckin ?
          <div className="checkin-prompt-card">
              <div className="checkin-prompt-top">
                <span className="checkin-prompt-icon-badge" aria-hidden>
                  <Flower2 size={18} strokeWidth={2} className="checkin-prompt-flower" />
                </span>
                <h3 className="checkin-prompt-title">{t('dash.checkin.title')}</h3>
              </div>
              <p className="checkin-prompt-sub">
                {t('dash.checkin.sub')}
              </p>
              <button
              type="button"
              className="checkin-prompt-cta"
              onClick={openCheckinModal}>
              
                {t('dash.checkin.cta')}
              </button>
            </div> :

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
          }
        </div>
      </div>

      <div className="dash-top-row">
        <section className="dash-daily-test" aria-labelledby="dash-daily-test-title">
          <div className="dash-daily-test__icon-stack" aria-hidden>
            <ClipboardList className="dash-daily-test__clipboard" size={46} strokeWidth={1.75} />
            <Heart className="dash-daily-test__heart" size={22} fill="currentColor" strokeWidth={1.4} />
          </div>
          <div className="dash-daily-test__main">
            <h2 id="dash-daily-test-title" className="dash-daily-test__title">
              {t('dash.dailyTest.title')}
            </h2>
            <p className="dash-daily-test__desc">{t('dash.dailyTest.desc')}</p>
            <ul className="dash-daily-test__meta">
              <li>
                <span className="dash-daily-test__chip-emoji" aria-hidden>
                  ?
                </span>
                {t('dash.dailyTest.metaQuestions')}
              </li>
              <li>
                <span className="dash-daily-test__chip-emoji" aria-hidden>
                  🕒
                </span>
                {t('dash.dailyTest.metaDuration')}
              </li>
              <li>
                <span className="dash-daily-test__chip-emoji" aria-hidden>
                  ❄️
                </span>
                {t('dash.dailyTest.metaInstant')}
              </li>
            </ul>
            <p className={`dash-daily-test__status ${testDoneToday ? 'dash-daily-test__status--done' : ''}`}>
              <span className="dash-daily-test__status-emoji" aria-hidden>
                ❄️
              </span>
              {testDoneToday ? t('dash.dailyTest.statusDone') : t('dash.dailyTest.statusPending')}
            </p>
          </div>
          <div className="dash-daily-test__aside">
            <div
              className="dash-daily-test__donut"
              style={{ '--dash-donut-pct': Math.min(100, Math.max(0, moodVal)) }}
              aria-hidden
            />
            <div className="dash-daily-test__bars" aria-hidden>
              <span className="dash-daily-test__bar" />
              <span className="dash-daily-test__bar" />
              <span className="dash-daily-test__bar" />
            </div>
            <button
              type="button"
              className="dash-daily-test__cta"
              onClick={() => navigate('/tests')}
              aria-label={t('dash.dailyTest.aria')}
            >
              {t('dash.dailyTest.cta')}
            </button>
          </div>
        </section>

        <section className="dash-support-nearby" aria-labelledby="dash-support-nearby-title">
          <div className="dash-support-nearby__copy">
            <h2 id="dash-support-nearby-title" className="dash-support-nearby__title">
              {t('dash.supportNearby.title')}
            </h2>
            <p className="dash-support-nearby__desc">{t('dash.supportNearby.desc')}</p>
            <button
              type="button"
              className="dash-support-nearby__cta"
              onClick={openSupportContact}
              aria-label={t('dash.supportNearby.ctaAria')}
            >
              {t('dash.supportNearby.cta')}
            </button>
          </div>
          <div className="dash-support-nearby__art">
            <img src={supportNearbyArt} alt="" loading="lazy" decoding="async" />
          </div>
        </section>
      </div>

      <section className="dash-advice-panel" aria-label={t('dash.recsTitle')}>
        <header className="dash-advice__head">
          <h2 className="dash-advice__title">
            💡 {t('dash.advice.headline')}
          </h2>
          <p className="dash-advice__lead">{t('dash.advice.sub1')}</p>
          <p className="dash-advice__lead dash-advice__lead--second">{t('dash.advice.sub2')}</p>
        </header>
        <div className="dash-advice__strip">
          {adviceCards.map((card) => {
            const Icon = card.Icon;
            const cover = natureAt(card.natureIdx);
            return (
              <article key={card.key} className={`dash-advice-card dash-advice-card--${card.theme}`}>
                <div className="dash-advice-card__top">
                  <Icon className="dash-advice-card__cat-icon" size={16} strokeWidth={2.2} aria-hidden />
                  <span className="dash-advice-card__cat">{card.category}</span>
                </div>
                <div
                  className="dash-advice-card__media"
                  style={{ backgroundImage: `url(${cover})` }}
                  role="img"
                  aria-hidden
                />
                <h3 className="dash-advice-card__name">{card.title}</h3>
                <p className="dash-advice-card__desc">{card.desc}</p>
                <div className="dash-advice-card__foot">
                  <span className="dash-advice-card__dur">{card.duration}</span>
                  <button
                    type="button"
                    className="dash-advice-card__go"
                    onClick={() => navigate(card.path)}
                    aria-label={card.title}
                  >
                    <ArrowRight size={18} strokeWidth={2.4} aria-hidden />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {checkinModalOpen &&
      <div
        className="modal-overlay checkin-form-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-form-title"
        onClick={() => setCheckinModalOpen(false)}>
        
          <div className="modal-card checkin-form-card" onClick={(e) => e.stopPropagation()}>
            <button
            type="button"
            className="modal-close checkin-form-close"
            onClick={() => setCheckinModalOpen(false)}
            aria-label={t('dash.close')}>
            
              <X size={20} />
            </button>
            <h2 id="checkin-form-title" className="checkin-form-h1">
              {t('dash.checkinForm.title')}
            </h2>
            <p className="checkin-form-lead">
              {t('dash.checkinForm.lead')}
            </p>

            <div className="checkin-mood-row" role="group" aria-label={t('dash.checkinForm.moodGroup')}>
              {moodOptions.map((m) =>
            <button
              key={m.id}
              type="button"
              className={`checkin-mood-btn ${checkinForm.moodIndex === m.id ? 'selected' : ''}`}
              onClick={() => setCheckinForm((f) => ({ ...f, moodIndex: m.id }))}
              aria-pressed={checkinForm.moodIndex === m.id}>
              
                  <span className="checkin-mood-emoji">{m.emoji}</span>
                  <span className={`checkin-mood-label ${m.labelClass}`}>{m.label}</span>
                </button>
            )}
            </div>

            <section className="checkin-field">
              <div className="checkin-field-head">
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
              aria-label={t('dash.checkinForm.energyAria')} />
            
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
              aria-label={t('dash.checkinForm.stressAria')} />
            
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
              onChange={(e) => setCheckinForm((f) => ({ ...f, notes: e.target.value }))} />
            
            </section>

            <div className="checkin-form-actions">
              <button
              type="button"
              className="checkin-btn-cancel"
              onClick={() => setCheckinModalOpen(false)}>
              
                {t('dash.checkinForm.cancel')}
              </button>
              <button type="button" className="checkin-btn-save" onClick={saveCheckinFromModal}>
                <Save size={18} strokeWidth={2.2} aria-hidden />
                {t('dash.checkinForm.save')}
              </button>
            </div>
          </div>
        </div>
      }

      {detailsOpen &&
      <div
        className="modal-overlay dash-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dash-details-title"
        onClick={() => setDetailsOpen(false)}>
        
          <div className="modal-card dash-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="dash-details-title">{t('dash.details.title')}</h2>
              <button type="button" className="modal-close" onClick={() => setDetailsOpen(false)} aria-label={t('dash.close')}>
                <X size={18} />
              </button>
            </div>
            <p className="dash-details-lead">
              {t('dash.details.leadIntro')}
              {isViewingToday && hasTodayCheckin ?
            t('dash.details.leadFromCheckin') :
            user?.onboarding_burnout_percent != null ?
            t('dash.details.leadModelWithOnb') :
            t('dash.details.leadModel')}
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
              <button type="button" className="btn btn-primary" onClick={() => {setDetailsOpen(false);navigate('/stats');}}>
                {t('dash.details.analytics')}
              </button>
            </div>
          </div>
        </div>
      }

      {showOnboarding &&
      <div className="modal-overlay" role="dialog" aria-labelledby="onboard-title">
          <div className="modal-card fade-in">
            <h2 id="onboard-title" style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800 }}>{t('dash.onboard.title')}</h2>
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
      }

    </div>);

};

export default Dashboard;