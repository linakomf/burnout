import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import {
  ArrowRight,
  Bell,
  CloudLightning,
  Flower2,
  Info,
  Mountain,
  Save,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import api from '../../utils/api';
import { apiGetCatalog } from '../../utils/apiCatalog';
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
import { isVideoCoverAsset } from '../Practices/practiceMedia';
import { loadAllSectionFavoriteSets, FAVORITES_CHANGED_EVENT } from '../Practices/sectionFavorites';
import { buildHomeRecommendationCards } from '../../utils/homeSpaceRecommendations';
import supportNearbyArt from '../../assets/dash-support-nearby.png';
import testsNavIcon from '../../assets/tests-nav-icon.png';
import { resolveHomeBannerVideoSrc } from '../../config/homeBannerVideo';
import { dailyBurnoutIndex, burnoutRiskFromIndex } from '../../utils/burnoutAnalytics';
import { moodEmojiUrl } from '../../utils/moodEmojiAssets';
import {
  areNotificationsEnabled,
  NOTIF_CHANGED_EVENT,
} from '../../utils/notificationPreferences';
import SpaceOnboardingModal from './SpaceOnboardingModal';
import './Dashboard.css';


const DETAILS_ROW_TWEMOJI = {
  mood: '2600',
  stress: '1f329',
  energy: '26a1'
};

const MOOD_PILLS = [
  { id: 0, emojiFile: '1f604', labelClass: 'mood-pill--excellent' },
  { id: 1, emojiFile: '1f642', labelClass: 'mood-pill--good' },
  { id: 2, emojiFile: '1f610', labelClass: 'mood-pill--ok' },
  { id: 3, emojiFile: '1f614', labelClass: 'mood-pill--sad' },
  { id: 4, emojiFile: '1f625', labelClass: 'mood-pill--anxious' }
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
  const { user, updateUser } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date();

  const [activeTab, setActiveTab] = useState('today');
  const [selectedDay, setSelectedDay] = useState(today);
  const [testResults, setTestResults] = useState([]);
  const [testCatalog, setTestCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [spaceOnboardingOpen, setSpaceOnboardingOpen] = useState(false);
  const [spaceOnboardingSaving, setSpaceOnboardingSaving] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportSubmitError, setSupportSubmitError] = useState('');
  const [supportForm, setSupportForm] = useState({
    name: '',
    contact: '',
    whatsapp: '',
    message: ''
  });
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [checkinVersion, setCheckinVersion] = useState(0);
  const [favoritesTick, setFavoritesTick] = useState(0);
  const [spaceCatalog, setSpaceCatalog] = useState({
    films: [],
    musicItems: [],
    podcastEpisodes: [],
    meditations: [],
    readingItems: [],
    events: []
  });
  const [spaceCatalogLoading, setSpaceCatalogLoading] = useState(true);
  const heroBgVideoRef = useRef(null);
  const notifWrapRef = useRef(null);
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
    api.get('/tests/results/my').then((r) => r.data).catch((err) => {
      console.error('[catalog] tests/results/my failed', err.response?.status, err.message);
      return [];
    }),
    apiGetCatalog('/tests', [], 'tests').then((r) => r.data)]).
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
    const params = new URLSearchParams(location.search);
    const supportFlag = params.get('support');
    if (supportFlag !== 'open' && supportFlag !== '1') return;

    const timer = window.setTimeout(() => {
      document.querySelector('.dash-support-nearby')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSupportModalOpen(true);
      navigate('/dashboard', { replace: true });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [location.search, navigate]);

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

  const [notifEnabled, setNotifEnabled] = useState(() => areNotificationsEnabled(user));

  useEffect(() => {
    setNotifEnabled(areNotificationsEnabled(user));
  }, [user?.user_id, user?.notifications_enabled]);

  useEffect(() => {
    const onPrefChange = (event) => {
      if (event?.detail && typeof event.detail.enabled === 'boolean') {
        setNotifEnabled(event.detail.enabled);
        return;
      }
      setNotifEnabled(areNotificationsEnabled(user));
    };
    window.addEventListener(NOTIF_CHANGED_EVENT, onPrefChange);
    return () => window.removeEventListener(NOTIF_CHANGED_EVENT, onPrefChange);
  }, [user]);

  const loadNotifications = React.useCallback(async () => {
    if (!areNotificationsEnabled(user)) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError(false);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(false);
    try {
      const { data } = await api.get('/users/notifications', { params: { limit: 20 } });
      if (data?.notifications_enabled === false) {
        setNotifications([]);
        setNotifEnabled(false);
        return;
      }
      setNotifications(Array.isArray(data?.rows) ? data.rows : []);
    } catch {
      setNotifications([]);
      setNotificationsError(true);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.user_id) return undefined;
    if (!notifEnabled) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError(false);
      return undefined;
    }
    loadNotifications();
    return undefined;
  }, [user?.user_id, notifEnabled, loadNotifications]);

  useEffect(() => {
    let cancelled = false;
    setSpaceCatalogLoading(true);
    Promise.all([
      apiGetCatalog('/films', { films: [] }, 'films'),
      apiGetCatalog('/music', { items: [] }, 'music'),
      apiGetCatalog('/podcasts', { episodes: [] }, 'podcasts'),
      apiGetCatalog('/meditations', { meditations: [] }, 'meditations'),
      apiGetCatalog('/reading', { items: [] }, 'reading'),
      apiGetCatalog('/events', { events: [] }, 'events')
    ])
      .then(([filmsRes, musicRes, podRes, medRes, readingRes, eventsRes]) => {
        if (cancelled) return;
        setSpaceCatalog({
          films: filmsRes.data?.films || [],
          musicItems: musicRes.data?.items || [],
          podcastEpisodes: podRes.data?.episodes || [],
          meditations: medRes.data?.meditations || [],
          readingItems: readingRes.data?.items || [],
          events: eventsRes.data?.events || [],
        });
      })
      .finally(() => {
        if (!cancelled) setSpaceCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notifOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notifWrapRef.current?.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifOpen]);

  useEffect(() => {
    const handler = () => setFavoritesTick((v) => v + 1);
    window.addEventListener(FAVORITES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (location.search.includes('spaceOnboarding=1')) {
      setSpaceOnboardingOpen(true);
    }
  }, [location.search]);

  const saveSpacePreferences = async (spacePreferences) => {
    if (!spacePreferences || typeof spacePreferences !== 'object') return;
    setSpaceOnboardingSaving(true);
    try {
      const { data } = await api.put('/users/me/space-preferences', {
        spacePreferences,
        hasCompletedSpaceOnboarding: true
      });
      updateUser({
        space_preferences: data.space_preferences ?? spacePreferences,
        has_completed_space_onboarding: data.has_completed_space_onboarding ?? true
      });
    } finally {
      setSpaceOnboardingSaving(false);
    }
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

  const selectedCheckin = useMemo(
    () => getCheckinForDate(selectedDayStr),
    [selectedDayStr, checkinVersion]
  );

  const todayCheckin = useMemo(
    () => getCheckinForDate(todayStr),
    [todayStr, checkinVersion]
  );

  const hasSelectedDayCheckin = Boolean(selectedCheckin);
  const hasTodayCheckin = Boolean(todayCheckin);
  const showStatePanel = hasSelectedDayCheckin;

  const stressVal = todayCheckin ? todayCheckin.stress : stressFromTests;
  const moodVal = todayCheckin ? todayCheckin.mood : moodFromTests;
  const energyVal = todayCheckin ? todayCheckin.energy : energyFromTests;

  const panelStressVal = selectedCheckin?.stress ?? 0;
  const panelMoodVal = selectedCheckin?.mood ?? 0;
  const panelEnergyVal = selectedCheckin?.energy ?? 0;

  const onboardingDateKey = useMemo(() => {
    if (user?.onboarding_burnout_percent == null || !user?.onboarding_burnout_completed_at) return null;
    return format(new Date(user.onboarding_burnout_completed_at), 'yyyy-MM-dd');
  }, [user?.onboarding_burnout_percent, user?.onboarding_burnout_completed_at]);

  const testStressForDay = (dateKey) => {
    const dayTests = testResults.filter((r) => {
      if (!r.created_at) return false;
      return format(new Date(r.created_at), 'yyyy-MM-dd') === dateKey;
    });
    if (!dayTests.length) return null;
    const scores = dayTests.map((r) => (stressFromCatalogLevel(r.level) ?? Number(r.score)) || 40);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const burnoutIndexForDay = (dateKey, checkin, moodPct) =>
    dailyBurnoutIndex({
      dateKey,
      moodPct,
      checkin,
      testStress: testStressForDay(dateKey),
      hasDiary: false,
      onboardingPct: dateKey === onboardingDateKey ? user?.onboarding_burnout_percent : null,
    });

  const burnoutVal = useMemo(() => {
    if (!selectedCheckin) return null;
    const fromDay = burnoutIndexForDay(selectedDayStr, selectedCheckin, selectedCheckin.mood);
    if (fromDay != null) return fromDay;
    return selectedCheckin.stress;
  }, [
    selectedDayStr,
    selectedCheckin,
    testResults,
    user?.onboarding_burnout_percent,
    onboardingDateKey,
  ]);

  const burnoutRisk = useMemo(
    () => (burnoutVal != null ? burnoutRiskFromIndex(burnoutVal) : null),
    [burnoutVal]
  );

  const panelMoodBand = moodStateBand(panelMoodVal);
  const panelStressBand = stressStateBand(panelStressVal);
  const panelEnergyBand = energyStateBand(panelEnergyVal);

  const greetingLine = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t('dash.greeting.morning');
    if (h < 18) return t('dash.greeting.day');
    return t('dash.greeting.evening');
  }, [t]);

  const unreadNotificationsCount = useMemo(
    () => notifications.reduce((sum, item) => sum + (item.is_read ? 0 : 1), 0),
    [notifications]
  );

  const formatNotificationDate = (createdAt) => {
    const value = new Date(createdAt);
    if (Number.isNaN(value.getTime())) return '';
    if (lang === 'en') return format(value, 'MMM d, HH:mm', { locale: enUS });
    return format(value, 'd MMMM, HH:mm', { locale: ru });
  };

  const isVerifyNotification = (item) =>
    item?.type === 'support_verify_contacted' || item?.type === 'support_verify_online_consultation';

  const needsVerificationResponse = (item) =>
    isVerifyNotification(item) && item.user_confirmed == null && item.confirmation_id;

  const respondToConfirmation = async (item, confirmed) => {
    const confirmationId = item.confirmation_id || item.payload?.confirmation_id;
    if (!confirmationId || confirmingId) return;

    setConfirmingId(confirmationId);
    try {
      await api.post(`/users/support-confirmations/${confirmationId}/respond`, { confirmed });
      await loadNotifications();
    } catch {
      window.alert(t('dash.notifications.confirmError'));
    } finally {
      setConfirmingId(null);
    }
  };

  const toggleNotifications = async () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    if (nextOpen && notifEnabled) await loadNotifications();
    if (!nextOpen || !notifEnabled || unreadNotificationsCount === 0) return;

    setNotifications((current) =>
      current.map((item) =>
        item.is_read ?
        item :
        {
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString()
        }
      )
    );

    try {
      await api.patch('/users/notifications/read-all');
    } catch {
      
    }
  };

  const favoriteHints = useMemo(() => {
    const bySection = loadAllSectionFavoriteSets();
    const hints = new Set();
    if ((bySection.films?.size || 0) > 0) hints.add('films');
    if ((bySection.music?.size || 0) > 0) hints.add('music');
    if ((bySection.podcasts?.size || 0) > 0) hints.add('podcasts');
    if ((bySection.reading?.size || 0) > 0) hints.add('reading');
    if ((bySection.events?.size || 0) > 0) hints.add('events');
    return hints;
  }, [favoritesTick]);

  const recommendationCards = useMemo(
    () =>
      buildHomeRecommendationCards({
        moodVal,
        stressVal,
        energyVal,
        testResults,
        spacePreferences: user?.space_preferences || null,
        user,
        films: spaceCatalog.films,
        musicItems: spaceCatalog.musicItems,
        podcastEpisodes: spaceCatalog.podcastEpisodes,
        meditations: spaceCatalog.meditations,
        readingItems: spaceCatalog.readingItems,
        events: spaceCatalog.events,
        favoriteHints
      }),
    [
      moodVal,
      stressVal,
      energyVal,
      testResults,
      user,
      spaceCatalog,
      favoriteHints
    ]
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
      whatsapp: '',
      message: ''
    }));
    setSupportModalOpen(true);
  };

  const submitSupportRequest = async () => {
    const name = supportForm.name.trim();
    const contact = supportForm.contact.trim();
    const whatsapp = supportForm.whatsapp.trim();
    const message = supportForm.message.trim();
    if (!name || !contact || !message || supportSubmitting) return;

    setSupportSubmitError('');
    setSupportSubmitting(true);
    try {
      await api.post('/users/support-request', {
        name,
        contact,
        whatsapp: whatsapp || undefined,
        message
      });
      const subject = t('dash.supportNearby.mailSubject');
      const body = [
        `Имя: ${name}`,
        `Email: ${contact}`,
        whatsapp ? `WhatsApp: ${whatsapp}` : null,
        '',
        'Запрос:',
        message
      ]
        .filter(Boolean)
        .join('\n');
      if (supportEmail) {
        window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
      setSupportSent(true);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        t('dash.supportNearby.errorDefault');
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
      setCheckinForDate(selectedDayStr, {
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
  const hasSpaceOnboarding = Boolean(
    user?.has_completed_space_onboarding ||
      (user?.space_preferences && typeof user.space_preferences === 'object' && user.space_preferences.completedAt)
  );

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
        <div className="dash-header-actions" ref={notifWrapRef}>
          <button
            type="button"
            className={`notif-btn ${notifOpen ? 'notif-btn--open' : ''}`}
            aria-label={t('dash.notif')}
            aria-expanded={notifOpen}
            onClick={toggleNotifications}
          >
            <Bell size={20} />
            {unreadNotificationsCount > 0 ? <span className="notif-btn-dot" aria-hidden /> : null}
          </button>

          {notifOpen ? (
            <div className="dash-notif-popover" role="dialog" aria-label={t('dash.notifications.title')}>
              <div className="dash-notif-popover__head">
                <div>
                  <div className="dash-notif-popover__title">{t('dash.notifications.title')}</div>
                  <div className="dash-notif-popover__sub">
                    {unreadNotificationsCount > 0 ?
                      t('dash.notifications.unread', { n: unreadNotificationsCount }) :
                      t('dash.notifications.allRead')}
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-notif-popover__close"
                  onClick={() => setNotifOpen(false)}
                  aria-label={t('dash.close')}
                >
                  <X size={16} strokeWidth={2.2} />
                </button>
              </div>

              {notificationsLoading ? (
                <div className="dash-notif-state">{t('dash.notifications.loading')}</div>
              ) : notificationsError ? (
                <div className="dash-notif-state">{t('dash.notifications.loadError')}</div>
              ) : !notifEnabled ? (
                <div className="dash-notif-state">{t('dash.notifications.disabled')}</div>
              ) : notifications.length === 0 ? (
                <div className="dash-notif-state">{t('dash.notifications.empty')}</div>
              ) : (
                <div className="dash-notif-list">
                  {notifications.map((item) => (
                    <article
                      key={item.notification_id}
                      className={`dash-notif-card ${item.is_read ? '' : 'dash-notif-card--unread'}`}
                    >
                      <div className="dash-notif-card__row">
                        <h3 className="dash-notif-card__title">{item.title}</h3>
                        {!item.is_read ? <span className="dash-notif-card__badge">{t('dash.notifications.new')}</span> : null}
                      </div>
                      <p className="dash-notif-card__text">{item.body}</p>
                      {needsVerificationResponse(item) ? (
                        <div className="dash-notif-confirm-actions">
                          <button
                            type="button"
                            className="dash-notif-confirm-btn dash-notif-confirm-btn--yes"
                            disabled={confirmingId === item.confirmation_id}
                            onClick={() => respondToConfirmation(item, true)}
                          >
                            {item.type === 'support_verify_online_consultation'
                              ? t('dash.notifications.confirmConsultYes')
                              : t('dash.notifications.confirmYes')}
                          </button>
                          <button
                            type="button"
                            className="dash-notif-confirm-btn dash-notif-confirm-btn--no"
                            disabled={confirmingId === item.confirmation_id}
                            onClick={() => respondToConfirmation(item, false)}
                          >
                            {item.type === 'support_verify_online_consultation'
                              ? t('dash.notifications.confirmConsultNo')
                              : t('dash.notifications.confirmNo')}
                          </button>
                        </div>
                      ) : isVerifyNotification(item) && item.user_confirmed != null ? (
                        <p className="dash-notif-confirm-done">{t('dash.notifications.confirmThanks')}</p>
                      ) : null}
                      <span className="dash-notif-card__time">{formatNotificationDate(item.created_at)}</span>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
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
            className={`checkin-prompt-card ${showStatePanel ? 'checkin-prompt-card--state' : ''}`}>
            {showStatePanel ? (
              <div className="dash-state-panel" role="region" aria-labelledby="dash-state-heading">
                <header className="dash-state-head">
                  <h2 id="dash-state-heading" className="dash-state-title">
                    {t('dash.state.title')}
                  </h2>
                </header>

                <article className="dash-state-burnout" aria-labelledby="dash-state-burnout-title">
                  <div className="dash-state-burnout__head">
                    <h3 id="dash-state-burnout-title" className="dash-state-burnout__title">
                      {t('dash.state.burnoutTitle')}
                    </h3>
                    <button
                      type="button"
                      className="dash-state-burnout__info"
                      onClick={() => navigate('/stats')}
                      aria-label={t('dash.state.burnoutStatsAria')}
                    >
                      <Info size={16} strokeWidth={2.2} aria-hidden />
                    </button>
                  </div>

                  <div className="dash-state-burnout__scale-wrap" aria-hidden>
                    <div className="dash-state-burnout__scale-bar">
                      <div className="dash-state-burnout__scale-gradient" />
                      <div
                        className="dash-state-burnout__scale-marker"
                        style={{ left: `${Math.min(100, Math.max(0, burnoutVal))}%` }}
                      />
                    </div>
                  </div>

                  <p className={`dash-state-burnout__status dash-state-burnout__status--${burnoutRisk?.level ?? 'medium'}`}>
                    {t(`dash.state.burnoutStatus.${burnoutRisk?.level ?? 'medium'}`)} {Math.round(burnoutVal ?? 0)}%
                  </p>
                  <p className="dash-state-burnout__hint">{t(`dash.state.burnoutHint.${burnoutRisk?.level ?? 'medium'}`)}</p>
                </article>

                <div className="dash-state-cards">
                  <article className="dash-state-card dash-state-card--mood">
                    <div className="dash-state-card__icon">
                      <Sun size={22} strokeWidth={2.2} aria-hidden />
                    </div>
                    <div className="dash-state-card__label">{t('dash.state.labels.mood')}</div>
                    <div className="dash-state-card__value dash-state-card__value--mood">{panelMoodVal}%</div>
                    <div className="dash-state-card__badge">
                      <span>{t(`dash.state.moodStatus.${panelMoodBand}`)}</span>
                    </div>
                    <div className="dash-state-card__chart">
                      <MiniSparkline value={panelMoodVal} stroke="#f8cd8b" />
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
                    <div className="dash-state-card__value dash-state-card__value--stress">{panelStressVal}%</div>
                    <div className="dash-state-card__badge">
                      <span>{t(`dash.state.stressStatus.${panelStressBand}`)}</span>
                    </div>
                    <div className="dash-state-card__chart">
                      <MiniSparkline value={panelStressVal} stroke="#ff9567" />
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
                    <div className="dash-state-card__value dash-state-card__value--energy">{panelEnergyVal}%</div>
                    <div className="dash-state-card__badge">
                      <span>{t(`dash.state.energyStatus.${panelEnergyBand}`)}</span>
                    </div>
                    <div className="dash-state-card__chart">
                      <MiniSparkline value={panelEnergyVal} stroke="#898de2" />
                    </div>
                    <div className="dash-state-card__scale">
                      <span>{t('dash.state.scaleMin')}</span>
                      <span>{t('dash.state.scaleMax')}</span>
                    </div>
                  </article>
                </div>
              </div>
            ) : (
              <>
                <div className="checkin-prompt-top">
                  <span className="checkin-prompt-icon-badge" aria-hidden>
                    <Flower2 size={18} strokeWidth={2} className="checkin-prompt-flower" />
                  </span>
                  <h3 className="checkin-prompt-title">
                    {isViewingToday ? t('dash.checkin.title') : t('dash.checkin.titlePast')}
                  </h3>
                </div>
                <p className="checkin-prompt-sub">
                  {isViewingToday ? t('dash.checkin.sub') : t('dash.checkin.subPast')}
                </p>
                <button type="button" className="checkin-prompt-cta" onClick={openCheckinModal}>
                  {t('dash.checkin.cta')}
                </button>
              </>
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
          <div className="dash-advice__badge">💙 {hasSpaceOnboarding ? 'Ваше пространство подобрано' : t('dash.advice.dayLabel')}</div>
          <h2 className="dash-advice__title">
            {hasSpaceOnboarding ? (
              <>
                <span className="dash-advice__title-main">Подбор рекомендаций</span>{' '}
                <span className="dash-advice__title-accent">под ваше состояние</span>
              </>
            ) : (
              <span className="dash-advice__title-main">Не знаете, с чего начать?</span>
            )}
          </h2>
          {!hasSpaceOnboarding ? (
            <p className="dash-advice__lead">Пройдите короткий подбор, чтобы мы показывали более бережный и подходящий контент.</p>
          ) : (
            <>
              <p className="dash-advice__lead">Рекомендации собираются из карточек, добавленных администратором, с учётом вашего состояния и предпочтений.</p>
              <p className="dash-advice__lead dash-advice__lead--second">Вы можете пройти подбор заново в любой момент.</p>
            </>
          )}
          <div className="dash-advice__cta">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setSpaceOnboardingOpen(true)}
            >
              {hasSpaceOnboarding ? 'Изменить предпочтения' : 'Найти своё направление'}
            </button>
          </div>
        </header>
        <div className="dash-advice__strip">
          {spaceCatalogLoading ? (
            <p className="dash-advice__lead">Подбираем рекомендации…</p>
          ) : recommendationCards.length === 0 ? (
            <p className="dash-advice__lead">Пока не хватает данных для персонального подбора — начните с любого раздела пространства.</p>
          ) : recommendationCards.map((card, idx) => {
            const cover = card.image || natureAt(6 + idx);
            const coverIsVideo = Boolean(cover) && isVideoCoverAsset(cover);
            const descText =
              (card.description && String(card.description).trim()) ||
              `Подойдёт для мягкого шага в раздел «${card.subtitle.toLowerCase()}».`;
            const openRec = () => navigate(card.path);
            return (
              <article
                key={`${card.type}-${idx}-${card.title}`}
                className="dash-advice-card dash-advice-card--violet"
                role="button"
                tabIndex={0}
                onClick={openRec}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openRec();
                  }
                }}
              >
                <div className="dash-advice-card__top">
                  <span className="dash-advice-card__cat">{card.subtitle}</span>
                </div>
                <div
                  className={`dash-advice-card__media${coverIsVideo ? ' dash-advice-card__media--video' : ''}`}
                  style={coverIsVideo ? undefined : { backgroundImage: `url(${cover})` }}
                  role={coverIsVideo ? undefined : 'img'}
                  aria-hidden={coverIsVideo ? undefined : true}
                >
                  {coverIsVideo ? (
                    <video
                      src={cover}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      aria-label={card.title}
                    />
                  ) : null}
                </div>
                <h3 className="dash-advice-card__name">{card.title}</h3>
                <p className="dash-advice-card__desc">{descText}</p>
                <div className="dash-advice-card__foot">
                  <span className="dash-advice-card__dur">Рекомендация</span>
                  <button
                    type="button"
                    className="dash-advice-card__go"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRec();
                    }}
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
                    src={moodEmojiUrl(m.emojiFile)}
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
              {t('dash.supportNearby.formTitle')}
            </h2>
            <p className="checkin-form-lead">{t('dash.supportNearby.formLead')}</p>

            <section className="checkin-field">
              <div className="checkin-field-title">{t('dash.supportNearby.nameLabel')}</div>
              <input
                className="checkin-notes-input support-input"
                type="text"
                placeholder={t('dash.supportNearby.namePh')}
                value={supportForm.name}
                onChange={(e) => setSupportForm((f) => ({ ...f, name: e.target.value }))}
              />
            </section>

            <section className="checkin-field">
              <div className="checkin-field-title">{t('dash.supportNearby.contactLabel')}</div>
              <input
                className="checkin-notes-input support-input"
                type="email"
                autoComplete="email"
                placeholder={t('dash.supportNearby.contactPh')}
                value={supportForm.contact}
                onChange={(e) => setSupportForm((f) => ({ ...f, contact: e.target.value }))}
              />
            </section>

            <section className="checkin-field">
              <div className="checkin-field-title">{t('dash.supportNearby.whatsappLabel')}</div>
              <input
                className="checkin-notes-input support-input"
                type="tel"
                autoComplete="tel"
                placeholder={t('dash.supportNearby.whatsappPh')}
                value={supportForm.whatsapp}
                onChange={(e) => setSupportForm((f) => ({ ...f, whatsapp: e.target.value }))}
              />
            </section>

            <section className="checkin-field checkin-field--notes">
              <div className="checkin-field-title">{t('dash.supportNearby.messageLabel')}</div>
              <textarea
                className="checkin-notes-input"
                rows={5}
                placeholder={t('dash.supportNearby.messagePh')}
                value={supportForm.message}
                onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))}
              />
            </section>

            {supportSubmitError ? (
              <p className="support-form-error" role="alert">
                {supportSubmitError}
              </p>
            ) : supportSent ? (
              <p className="support-form-success">{t('dash.supportNearby.success')}</p>
            ) : null}

            <div className="checkin-form-actions">
              <button
                type="button"
                className="checkin-btn-cancel"
                onClick={() => setSupportModalOpen(false)}
              >
                {t('dash.supportNearby.cancel')}
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
                {supportSubmitting
                  ? t('dash.supportNearby.submitting')
                  : t('dash.supportNearby.submit')}
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
                  src={moodEmojiUrl(DETAILS_ROW_TWEMOJI.mood)}
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
                  src={moodEmojiUrl(DETAILS_ROW_TWEMOJI.stress)}
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
                  src={moodEmojiUrl(DETAILS_ROW_TWEMOJI.energy)}
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

      {spaceOnboardingOpen ? (
        <SpaceOnboardingModal
          saving={spaceOnboardingSaving}
          initialPreferences={user?.space_preferences || null}
          onClose={() => setSpaceOnboardingOpen(false)}
          onGoSpace={() => {
            setSpaceOnboardingOpen(false);
            navigate('/practices');
          }}
          onComplete={saveSpacePreferences}
        />
      ) : null}

    </div>);

};

export default Dashboard;