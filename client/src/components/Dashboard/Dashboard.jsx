import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  Clapperboard,
  CloudLightning,
  Flower2,
  Moon,
  Mountain,
  Music,
  Save,
  Sun,
  Trees,
  X,
  Zap } from
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
import { pickRecommendedTestId } from '../../utils/recommendedTestId';
import { weekPillLines } from '../../utils/weekPillLines';
import { natureAt } from '../Practices/spaceNatureImagery';
import supportNearbyArt from '../../assets/dash-support-nearby.png';
import adviceFilmsCover from '../../assets/advice-films.png';
import adviceReadingCover from '../../assets/advice-reading.png';
import adviceMeditationCover from '../../assets/advice-meditation.png';
import adviceMusicCover from '../../assets/advice-music.png';
import adviceActivityCover from '../../assets/advice-activity.png';
import testsNavIcon from '../../assets/tests-nav-icon.png';
import { resolveHomeBannerVideoSrc } from '../../config/homeBannerVideo';
import './Dashboard.css';

const ONBOARD_KEY = 'burnout_onboarding_v1';

const ADVICE_COVER_BY_KEY = {
  films: adviceFilmsCover,
  read: adviceReadingCover,
  meditate: adviceMeditationCover,
  music: adviceMusicCover,
  walk: adviceActivityCover
};

const ADVICE_CARD_DEFS = [
  { key: 'music', path: '/practices/music', natureIdx: 4, theme: 'purple', Icon: Music },
  { key: 'films', path: '/practices/films', natureIdx: 11, theme: 'orange', Icon: Clapperboard },
  { key: 'walk', path: '/practices/events', natureIdx: 6, theme: 'green', Icon: Trees },
  { key: 'read', path: '/practices/articles', natureIdx: 14, theme: 'blue', Icon: BookOpen },
  { key: 'meditate', path: '/practices/meditation', natureIdx: 9, theme: 'violet', Icon: Moon }
];

/** Flat emoji PNGs (Twemoji) — одинаково на всех ОС, без «пластиковых» системных смайлов */
const CHECKIN_MOOD_EMOJI_CDN =
  'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/72x72';

/** Иконки строк в модалке «Подробнее» (настроение / стресс / энергия) */
const DETAILS_ROW_TWEMOJI = {
  mood: '2600',
  stress: '1f329',
  energy: '26a1'
};

const MOOD_PILLS = [
  { id: 0, emojiFile: '1f601', labelClass: 'mood-pill--excellent' },
  { id: 1, emojiFile: '1f642', labelClass: 'mood-pill--good' },
  { id: 2, emojiFile: '1f610', labelClass: 'mood-pill--ok' },
  { id: 3, emojiFile: '1f614', labelClass: 'mood-pill--sad' },
  { id: 4, emojiFile: '1f630', labelClass: 'mood-pill--anxious' }
];

function moodStateBand(pct) {
  if (pct >= 66) return 'high';
  if (pct >= 40) return 'mid';
  return 'low';
}

function stressStateBand(pct) {
  if (pct <= 35) return 'low';
  if (pct <= 65) return 'mid';
  return 'high';
}

function energyStateBand(pct) {
  if (pct >= 66) return 'high';
  if (pct >= 40) return 'mid';
  return 'low';
}

function MiniSparkline({ value, stroke }) {
  const w = 120;
  const h = 40;
  const pad = 6;
  const n = 14;
  const parts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = pad + t * (w - 2 * pad);
    const norm = Math.min(100, Math.max(0, value)) / 100;
    const yBase = h - pad - norm * (h - 2 * pad) * (0.2 + 0.8 * t);
    const y = yBase + Math.sin(t * Math.PI * 2.6 + norm * 1.4) * 3.5;
    const yy = Math.max(pad, Math.min(h - pad, y));
    parts.push(`${x.toFixed(1)},${yy.toFixed(1)}`);
  }
  return (
    <svg
      className="dash-state-spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true">
      
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={parts.join(' ')}
      />
    </svg>
  );

}

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
  const [testCatalog, setTestCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSubmitError, setSupportSubmitError] = useState('');
  const [supportForm, setSupportForm] = useState({
    name: '',
    contact: '',
    message: ''
  });
  const [checkinVersion, setCheckinVersion] = useState(0);
  const heroBgVideoRef = useRef(null);
  const [checkinForm, setCheckinForm] = useState({
    moodIndex: 2,
    energy: 5,
    stress: 5,
    notes: ''
  });
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const heroBannerVideoSrc = useMemo(
    () => resolveHomeBannerVideoSrc(user),
    [user?.user_id, user?.role, user?.gender]
  );

  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const isViewingToday = selectedDayStr === todayStr;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
    api.get('/tests/results/my').then((r) => r.data).catch(() => []),
    api.get('/tests').then((r) => r.data).catch(() => [])]).
    then(([results, catalog]) => {
      if (cancelled) return;
      setTestResults(results || []);
      setTestCatalog(catalog || []);
    }).
    finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = heroBgVideoRef.current;
    if (!el) return;
    const play = () => {
      el.muted = true;
      el.play().catch(() => {});
    };
    const restart = () => {
      el.currentTime = 0;
      play();
    };
    play();
    el.addEventListener('loadeddata', play);
    el.addEventListener('ended', restart);
    return () => {
      el.removeEventListener('loadeddata', play);
      el.removeEventListener('ended', restart);
    };
  }, [heroBannerVideoSrc]);

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

  const statePanelDateLine = useMemo(() => {
    let s;
    if (lang === 'en') s = format(selectedDay, 'MMMM d, EEEE', { locale: enUS });
    else if (lang === 'ru') s = format(selectedDay, 'd MMMM, EEEE', { locale: ru });
    else s = format(selectedDay, 'd MMMM, EEEE', { locale: ru });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [selectedDay, lang]);

  const moodBand = moodStateBand(moodVal);
  const stressBand = stressStateBand(stressVal);
  const energyBand = energyStateBand(energyVal);

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
    setSupportSent(false);
    setSupportSubmitError('');
    setSupportForm((f) => ({
      ...f,
      name: user?.name || '',
      contact: user?.email || '',
      message: ''
    }));
    setSupportModalOpen(true);
  };

  const submitSupportRequest = async () => {
    const name = supportForm.name.trim();
    const contact = supportForm.contact.trim();
    const message = supportForm.message.trim();
    if (!name || !contact || !message || supportSubmitting) return;

    setSupportSubmitError('');
    setSupportSubmitting(true);
    try {
      await api.post('/users/support-request', {
        name,
        contact,
        message
      });
      const subject = t('dash.supportNearby.mailSubject');
      const body = [
        `Имя: ${name}`,
        `Контакт: ${contact}`,
        '',
        'Запрос:',
        message
      ].join('\n');
      if (supportEmail) {
        window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
      setSupportSent(true);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Не удалось отправить заявку. Попробуйте позже.';
      setSupportSubmitError(String(msg));
    } finally {
      setSupportSubmitting(false);
    }
  };

  const recommendedTestId = useMemo(
    () =>
    pickRecommendedTestId({
      role: user?.role,
      stressVal,
      moodVal,
      energyVal,
      catalogIds: testCatalog.map((t) => t.test_id)
    }),
    [user?.role, stressVal, moodVal, energyVal, testCatalog]
  );

  const openPersonalizedTest = () => {
    if (recommendedTestId != null) {
      navigate(`/tests/${recommendedTestId}`);
    } else {
      navigate('/tests');
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
          const dayStr = format(day, 'yyyy-MM-dd');
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedDayStr;
          const hasCheckin = Boolean(getCheckinForDate(dayStr));
          let btnClass = 'week-day-btn';
          if (isSelected) {
            btnClass += ' selected';
          } else {
            if (isToday) btnClass += ' is-today';
            else if (hasCheckin) btnClass += ' has-mark';
          }
          const { dateLine, wdayLine } = weekPillLines(day, lang, t);
          return (
            <button
              key={i}
              type="button"
              className={btnClass}
              onClick={() => setSelectedDay(day)}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}>
              
              <span className="wday-date">{dateLine}</span>
              <span className="wday-name">{wdayLine}</span>
            </button>);

        })}
      </div>

      <div className="hero-banner hero-banner--mock hero-banner--has-video">
        <div className="hero-banner-video-wrap" aria-hidden>
          <video
            key={heroBannerVideoSrc}
            ref={heroBgVideoRef}
            className="hero-banner-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            onEnded={(e) => {
              e.currentTarget.currentTime = 0;
              e.currentTarget.play().catch(() => {});
            }}
          >
            <source src={heroBannerVideoSrc} type="video/mp4" />
          </video>
        </div>
        <div className="hero-right">
          <div
            className={`checkin-prompt-card ${isViewingToday && !hasTodayCheckin ? '' : 'checkin-prompt-card--state'}`}>
            {isViewingToday && !hasTodayCheckin ? (
              <>
                <div className="checkin-prompt-top">
                  <span className="checkin-prompt-icon-badge" aria-hidden>
                    <Flower2 size={18} strokeWidth={2} className="checkin-prompt-flower" />
                  </span>
                  <h3 className="checkin-prompt-title">{t('dash.checkin.title')}</h3>
                </div>
                <p className="checkin-prompt-sub">{t('dash.checkin.sub')}</p>
                <button type="button" className="checkin-prompt-cta" onClick={openCheckinModal}>
                  {t('dash.checkin.cta')}
                </button>
              </>
            ) : (
              <div className="dash-state-panel" role="region" aria-labelledby="dash-state-heading">
                <header className="dash-state-head">
                  <div className="dash-state-head-text">
                    <h2 id="dash-state-heading" className="dash-state-title">
                      {t('dash.state.title')}
                    </h2>
                    <p className="dash-state-sub">{t('dash.state.subtitle')}</p>
                  </div>
                  <div className="dash-state-date">
                    <Calendar size={16} strokeWidth={2} aria-hidden />
                    <span>{statePanelDateLine}</span>
                  </div>
                </header>

                <div className="dash-state-cards">
                  <article className="dash-state-card dash-state-card--mood">
                    <div className="dash-state-card__icon">
                      <Sun size={22} strokeWidth={2.2} aria-hidden />
                    </div>
                    <div className="dash-state-card__label">{t('dash.state.labels.mood')}</div>
                    <div className="dash-state-card__value dash-state-card__value--mood">{moodVal}%</div>
                    <div className="dash-state-card__badge">
                      <span>{t(`dash.state.moodStatus.${moodBand}`)}</span>
                    </div>
                    <div className="dash-state-card__chart">
                      <MiniSparkline value={moodVal} stroke="#f8cd8b" />
                    </div>
                    <div className="dash-state-card__scale">
                      <span>{t('dash.state.scaleMin')}</span>
                      <span>{t('dash.state.scaleMax')}</span>
                    </div>
                  </article>

                  <article className="dash-state-card dash-state-card--stress">
                    <div className="dash-state-card__icon">
                      <CloudLightning size={22} strokeWidth={2.2} aria-hidden />
                    </div>
                    <div className="dash-state-card__label">{t('dash.state.labels.stress')}</div>
                    <div className="dash-state-card__value dash-state-card__value--stress">{stressVal}%</div>
                    <div className="dash-state-card__badge">
                      <span>{t(`dash.state.stressStatus.${stressBand}`)}</span>
                    </div>
                    <div className="dash-state-card__chart">
                      <MiniSparkline value={stressVal} stroke="#ff9567" />
                    </div>
                    <div className="dash-state-card__scale">
                      <span>{t('dash.state.scaleMin')}</span>
                      <span>{t('dash.state.scaleMax')}</span>
                    </div>
                  </article>

                  <article className="dash-state-card dash-state-card--energy">
                    <div className="dash-state-card__icon">
                      <Zap size={22} strokeWidth={2.2} aria-hidden />
                    </div>
                    <div className="dash-state-card__label">{t('dash.state.labels.energy')}</div>
                    <div className="dash-state-card__value dash-state-card__value--energy">{energyVal}%</div>
                    <div className="dash-state-card__badge">
                      <span>{t(`dash.state.energyStatus.${energyBand}`)}</span>
                    </div>
                    <div className="dash-state-card__chart">
                      <MiniSparkline value={energyVal} stroke="#898de2" />
                    </div>
                    <div className="dash-state-card__scale">
                      <span>{t('dash.state.scaleMin')}</span>
                      <span>{t('dash.state.scaleMax')}</span>
                    </div>
                  </article>
                </div>

                <div className="dash-state-banner">
                  <div className="dash-state-banner__icon" aria-hidden>
                    <Mountain size={22} strokeWidth={2} />
                  </div>
                  <div className="dash-state-banner__text">
                    <div className="dash-state-banner__title">{t('dash.state.bannerTitle')}</div>
                    <p className="dash-state-banner__sub">{t('dash.state.bannerSub')}</p>
                  </div>
                  <button type="button" className="dash-state-banner__btn" onClick={() => setDetailsOpen(true)}>
                    {t('dash.stats.more')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-top-row">
        <section className="dash-daily-test dash-daily-test--streamlined" aria-labelledby="dash-daily-test-title">
          <div className="dash-daily-test__icon-stack" aria-hidden>
            <img src={testsNavIcon} alt="" className="dash-daily-test__clipboard-img" width={96} height={96} />
          </div>
          <div className="dash-daily-test__main">
            <h2 id="dash-daily-test-title" className="dash-daily-test__title">
              {t('dash.dailyTest.title')}
            </h2>
            <p className="dash-daily-test__desc">{t('dash.dailyTest.desc')}</p>
            <p className="dash-daily-test__meta-inline">{t('dash.dailyTest.metaCompact')}</p>
          </div>
          <div className="dash-daily-test__aside">
            <button
              type="button"
              className="dash-daily-test__cta"
              onClick={openPersonalizedTest}
              aria-label={
              recommendedTestId != null ? t('dash.dailyTest.ctaAriaPersonalized') : t('dash.dailyTest.aria')
              }
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
          <div className="dash-advice__badge">💙 {t('dash.advice.dayLabel')}</div>
          <h2 className="dash-advice__title">
            {t('dash.advice.titleMain')}{' '}
            <span className="dash-advice__title-accent">{t('dash.advice.titleAccent')}</span>
          </h2>
          <p className="dash-advice__lead">{t('dash.advice.subLine1')}</p>
          <p className="dash-advice__lead dash-advice__lead--second">{t('dash.advice.subLine2')}</p>
          <p className="dash-advice__lead dash-advice__lead--second">{t('dash.advice.subLine3')}</p>
        </header>
        <div className="dash-advice__strip">
          {adviceCards.map((card) => {
            const Icon = card.Icon;
            const cover = ADVICE_COVER_BY_KEY[card.key] || natureAt(card.natureIdx);
            return (
              <article key={card.key} className={`dash-advice-card dash-advice-card--${card.theme}`}>
                <div className="dash-advice-card__top">
                  <Icon className="dash-advice-card__cat-icon" size={16} strokeWidth={2.2} aria-hidden />
                  <span className="dash-advice-card__cat">{card.category}</span>
                </div>
                <div
                  className={`dash-advice-card__media${card.key === 'meditate' ? ' dash-advice-card__media--meditate' : ''}${card.key === 'walk' ? ' dash-advice-card__media--walk' : ''}${card.key === 'films' ? ' dash-advice-card__media--films' : ''}${card.key === 'read' ? ' dash-advice-card__media--read' : ''}`}
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
              
                  <img
                    className="checkin-mood-emoji"
                    src={`${CHECKIN_MOOD_EMOJI_CDN}/${m.emojiFile}.png`}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
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
              style={{ '--checkin-fill-pct': `${((checkinForm.energy - 1) / 9) * 100}%` }}
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
              style={{ '--checkin-fill-pct': `${((checkinForm.stress - 1) / 9) * 100}%` }}
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

      {supportModalOpen &&
      <div
        className="modal-overlay checkin-form-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-form-title"
        onClick={() => setSupportModalOpen(false)}>
        
          <div className="modal-card checkin-form-card support-form-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close checkin-form-close"
              onClick={() => setSupportModalOpen(false)}
              aria-label={t('dash.close')}
            >
              <X size={20} />
            </button>
            <h2 id="support-form-title" className="checkin-form-h1">
              Написать специалисту
            </h2>
            <p className="checkin-form-lead">
              Оставьте заявку, и мы свяжемся с вами. Ответим с заботой и без осуждения.
            </p>

            <section className="checkin-field">
              <div className="checkin-field-title">Ваше имя</div>
              <input
                className="checkin-notes-input support-input"
                type="text"
                placeholder="Например, Алия"
                value={supportForm.name}
                onChange={(e) => setSupportForm((f) => ({ ...f, name: e.target.value }))}
              />
            </section>

            <section className="checkin-field">
              <div className="checkin-field-title">Контакт (email или телефон)</div>
              <input
                className="checkin-notes-input support-input"
                type="text"
                placeholder="name@email.com или +7..."
                value={supportForm.contact}
                onChange={(e) => setSupportForm((f) => ({ ...f, contact: e.target.value }))}
              />
            </section>

            <section className="checkin-field checkin-field--notes">
              <div className="checkin-field-title">Сообщение</div>
              <textarea
                className="checkin-notes-input"
                rows={5}
                placeholder="Коротко опишите, что вас беспокоит."
                value={supportForm.message}
                onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))}
              />
            </section>

            {supportSubmitError ? (
              <p className="support-form-error" role="alert">
                {supportSubmitError}
              </p>
            ) : supportSent ? (
              <p className="support-form-success">
                Заявка отправлена. Мы скоро свяжемся с вами.
              </p>
            ) : null}

            <div className="checkin-form-actions">
              <button
                type="button"
                className="checkin-btn-cancel"
                onClick={() => setSupportModalOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="checkin-btn-save"
                onClick={submitSupportRequest}
                disabled={
                  supportSubmitting ||
                  !supportForm.name.trim() ||
                  !supportForm.contact.trim() ||
                  !supportForm.message.trim()
                }
              >
                {supportSubmitting ? 'Отправка…' : 'Отправить заявку'}
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
            <div className="modal-header dash-details-header">
              <h2 id="dash-details-title" className="dash-details-title-text">
                {t('dash.details.title')}
              </h2>
              <button
                type="button"
                className="modal-close dash-details-close"
                onClick={() => setDetailsOpen(false)}
                aria-label={t('dash.close')}>
                
                <X size={18} strokeWidth={2.2} />
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

            <ul className="dash-details-rows">
              <li className="dash-details-row dash-details-row--mood">
                <img
                  className="dash-details-emoji"
                  src={`${CHECKIN_MOOD_EMOJI_CDN}/${DETAILS_ROW_TWEMOJI.mood}.png`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <p className="dash-details-row__para">
                  <span className="dash-details-row__dot" aria-hidden />
                  <strong className="dash-details-row__strong">
                    {t('dash.details.liMood')} ({moodVal}%)
                  </strong>{' '}
                  <span className="dash-details-row__exp">{t('dash.details.liMoodExp')}</span>
                </p>
              </li>
              <li className="dash-details-row dash-details-row--stress">
                <img
                  className="dash-details-emoji"
                  src={`${CHECKIN_MOOD_EMOJI_CDN}/${DETAILS_ROW_TWEMOJI.stress}.png`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <p className="dash-details-row__para">
                  <span className="dash-details-row__dot" aria-hidden />
                  <strong className="dash-details-row__strong">
                    {t('dash.details.liStress')} ({stressVal}%)
                  </strong>{' '}
                  <span className="dash-details-row__exp">{t('dash.details.liStressExp')}</span>
                </p>
              </li>
              <li className="dash-details-row dash-details-row--energy">
                <img
                  className="dash-details-emoji"
                  src={`${CHECKIN_MOOD_EMOJI_CDN}/${DETAILS_ROW_TWEMOJI.energy}.png`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <p className="dash-details-row__para">
                  <span className="dash-details-row__dot" aria-hidden />
                  <strong className="dash-details-row__strong">
                    {t('dash.details.liEnergy')} ({energyVal}%)
                  </strong>{' '}
                  <span className="dash-details-row__exp">{t('dash.details.liEnergyExp')}</span>
                </p>
              </li>
            </ul>

            <div className="dash-details-hint" role="note">
              <div className="dash-details-hint__icon" aria-hidden>
                <Mountain size={22} strokeWidth={2} />
              </div>
              <p className="dash-details-hint__text">{t('dash.details.foot')}</p>
            </div>

            <div className="dash-details-actions">
              <button
                type="button"
                className="dash-details-btn dash-details-btn--secondary"
                onClick={() => setDetailsOpen(false)}>
                
                {t('dash.details.close')}
              </button>
              <button
                type="button"
                className="dash-details-btn dash-details-btn--primary"
                onClick={() => {
                  setDetailsOpen(false);
                  navigate('/stats');
                }}>
                
                {t('dash.details.analytics')}
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
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