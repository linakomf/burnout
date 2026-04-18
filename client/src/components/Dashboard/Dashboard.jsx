import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, Clock, Circle, Sparkles, X, Compass, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import {
  stressFromCatalogLevel,
  compositeStressPct,
  compositeMoodPct,
  compositeEnergyPct,
} from '../../utils/wellnessComposite';
import { buildDailyTip, buildDailyRecommendations } from '../../utils/dailyPersonalization';
import './Dashboard.css';

const ONBOARD_KEY = 'burnout_onboarding_v1';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
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

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    api.get('/tests/results/my')
      .then(res => setTestResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshUser().catch(() => {});
  }, [refreshUser]);

  useEffect(() => {
    if (loading) return;
    try {
      if (!localStorage.getItem(ONBOARD_KEY)) setShowOnboarding(true);
    } catch {
      /* private mode */
    }
  }, [loading]);

  const dismissOnboarding = (goTests) => {
    try {
      localStorage.setItem(ONBOARD_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowOnboarding(false);
    if (goTests) navigate('/tests');
  };

  const lastResult = testResults[0];
  const stressVal = useMemo(() => {
    const lastTestStress = stressFromCatalogLevel(lastResult?.level);
    const v = compositeStressPct({
      onboardingPercent: user?.onboarding_burnout_percent ?? null,
      lastTestStress,
      periodTestStress: null,
    });
    return v ?? 40;
  }, [user?.onboarding_burnout_percent, lastResult?.level]);

  const moodVal = useMemo(() => {
    const m = compositeMoodPct({
      diaryAvgMoodPct: 0,
      stressPct: stressVal,
      fallbackWhenNoDiary: 0,
    });
    return m > 0 ? m : Math.max(10, 100 - stressVal);
  }, [stressVal]);

  const energyVal = useMemo(() => compositeEnergyPct(moodVal, stressVal), [moodVal, stressVal]);

  const greetingTime = () => {
    const h = today.getHours();
    if (h < 12) return 'ДОБРОЕ УТРО';
    if (h < 18) return 'ДОБРЫЙ ДЕНЬ';
    return 'ДОБРЫЙ ВЕЧЕР';
  };

  const personalizationLikes = user?.daily_personalization?.likes;
  const tip = useMemo(
    () => buildDailyTip(stressVal, personalizationLikes),
    [stressVal, personalizationLikes]
  );

  const recommendations = useMemo(
    () => buildDailyRecommendations(stressVal, personalizationLikes),
    [stressVal, personalizationLikes]
  );

  useEffect(() => {
    const relax = tip.activities.find((a) => /релакс|медитац/i.test(a.label));
    setSelectedActivities(relax ? new Set([relax.label]) : new Set());
    setExpandedRecIndex(null);
  }, [tip]);

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

  const hasPersonalization = Boolean(personalizationLikes?.length);

  if (loading) return (
    <div className="dash-loading"><div className="loading-spinner" /></div>
  );

  return (
    <div className="dashboard-new fade-in">

      {/* Header */}
      <div className="dash-header">
        <h1 className="dash-greeting">
          {greetingTime()}, {(user?.name?.split(' ')[0] || 'друг').toUpperCase()}!
        </h1>
        <button type="button" className="notif-btn" aria-label="Уведомления">
          <Bell size={20} />
        </button>
      </div>

      <button
        type="button"
        className={`personalization-cta${hasPersonalization ? ' personalization-cta--done' : ''}`}
        onClick={() => navigate('/personalization')}
      >
        <span className="personalization-cta-ico" aria-hidden>
          {hasPersonalization ? <Sparkles size={22} strokeWidth={2} /> : <Compass size={22} strokeWidth={2} />}
        </span>
        <span className="personalization-cta-text">
          <span className="personalization-cta-title">
            {hasPersonalization ? 'Предпочтения для дня' : 'Тест: чем вам проще восстанавливаться?'}
          </span>
          <span className="personalization-cta-sub">
            {hasPersonalization
              ? 'Обновите ответы — советы и практики на главной подстроятся под вас.'
              : '1–2 минуты: отметьте, что помогает при выгорании — появятся персональные рекомендации.'}
          </span>
        </span>
        <ChevronRight className="personalization-cta-arrow" size={20} strokeWidth={2} aria-hidden />
      </button>

      {/* Tabs */}
      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab === 'today' ? 'active' : ''}`} onClick={() => setActiveTab('today')}>Сегодня</button>
        <button className={`dash-tab ${activeTab === 'week' ? 'active' : ''}`} onClick={() => setActiveTab('week')}>За неделю</button>
      </div>

      {/* Week strip */}
      <div className="week-strip">
        {weekDays.map((day, i) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
          return (
            <button
              key={i}
              type="button"
              className={`week-day-btn ${isToday && !isSelected ? 'is-today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="wday-date">{format(day, 'd MMMM', { locale: ru })}</span>
              <span className="wday-name">{format(day, 'EEEE', { locale: ru })}</span>
            </button>
          );
        })}
      </div>

      {/* Hero banner */}
      <div className="hero-banner hero-banner--mock">
        <div className="hero-left">
          <img
            src="/photos/персонаж.png"
            alt="Персонаж"
            className="hero-character"
            onError={e => { e.target.style.opacity = 0; }}
          />
        </div>

        <div className="hero-right">
          <div className="indicator mood-ind">
            <div className="ind-top">
              <span>Ваше настроение</span>
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
              <span>Стресс</span>
              <span className="ind-pct">{stressVal}%</span>
            </div>
            <div className="ind-track">
              <div className="ind-bar stress-bar" style={{ width: `${stressVal}%` }} />
            </div>
          </div>

          <div className="indicator energy-ind">
            <div className="ind-top">
              <span>Энергия</span>
              <span className="ind-pct">{energyVal}%</span>
            </div>
            <div className="ind-track">
              <div className="ind-bar energy-bar" style={{ width: `${energyVal}%` }} />
            </div>
          </div>

          <div className="hero-actions-row">
            <button type="button" className="details-btn" onClick={() => setDetailsOpen(true)}>
              Подробнее
            </button>
          </div>
        </div>
      </div>

      {/* Tip card */}
      <div className="tip-card">
        <h2 className="tip-title">💡 {tip.title.toUpperCase()}</h2>
        <p className="tip-body">{tip.text}</p>
        <p className="activities-label">Рекомендуемые активности</p>
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

      {/* Recommendations */}
      <div className="recs-section">
        <h2 className="recs-title">🌿 Рекомендации дня</h2>
        <p className="recs-sub">
          {hasPersonalization
            ? 'Подобрано с учётом ваших предпочтений и текущего уровня стресса.'
            : 'Пройдите короткий тест выше — рекомендации станут точнее.'}
        </p>
        <div className="recs-list">
          {recommendations.map((rec, i) => {
            const expanded = expandedRecIndex === i;
            const RecIcon = rec.icon;
            return (
              <div
                key={rec.key}
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
                <div className="rec-img-wrap">
                  <RecIcon className="rec-thumb-icon" size={32} strokeWidth={1.6} aria-hidden />
                  {rec.hasPlay && (
                    <div className="rec-play">▶</div>
                  )}
                </div>
                <div className="rec-body">
                  <h3 className="rec-name">{rec.title}</h3>
                  <p className="rec-meta">
                    <span className="rec-cat">{rec.category}</span>
                    <span> · {rec.time}</span>
                  </p>
                  <p className="rec-desc">{rec.desc}</p>
                  {expanded && (
                    <div className="rec-expanded" onClick={(e) => e.stopPropagation()}>
                      <p className="rec-detail">{rec.detail}</p>
                      <button
                        type="button"
                        className="rec-start-btn btn btn-primary"
                        onClick={() => navigate('/practices')}
                      >
                        К практикам
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
              <h2 id="dash-details-title">Показатели подробно</h2>
              <button type="button" className="modal-close" onClick={() => setDetailsOpen(false)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>
            <p className="dash-details-lead">
              Ниже — расшифровка блоков настроения, стресса и энергии. Показатели учитывают{' '}
              {user?.onboarding_burnout_percent != null ? 'первичный скрининг выгорания, ' : ''}
              последние результаты тестов из каталога и согласованы между собой. Это ориентир, а не диагноз.
            </p>
            <ul className="dash-details-list">
              <li><strong>Настроение ({moodVal}%)</strong> — чем выше значение, тем комфортнее субъективное состояние.</li>
              <li><strong>Стресс ({stressVal}%)</strong> — отражает нагрузку; при высоких значениях полезны паузы и поддержка.</li>
              <li><strong>Энергия ({energyVal}%)</strong> — оценка бодрости; низкие значения намекают на отдых и режим сна.</li>
            </ul>
            <p className="dash-details-note">
              Полную динамику можно посмотреть в разделе «Аналитика».
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDetailsOpen(false)}>Закрыть</button>
              <button type="button" className="btn btn-primary" onClick={() => { setDetailsOpen(false); navigate('/stats'); }}>
                Перейти в аналитику
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="modal-overlay" role="dialog" aria-labelledby="onboard-title">
          <div className="modal-card fade-in">
            <h2 id="onboard-title" style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800}}>Добро пожаловать</h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-mid)', marginBottom: 20 }}>
              Загляните в раздел <strong>Тесты</strong> (например GAD-7) и ведите <strong>ежедневный чек-ин</strong> — так в разделе «Аналитика»
              появится динамика. Затем загляните в <strong>Практики</strong>: мы подберём упражнения под ваши последние результаты.
              В разделе «ИИ Дневник» можно записывать состояние и получать мягкую поддержку (не диагноз).
            </p>
            <div className="modal-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={() => dismissOnboarding(false)}>
                Позже
              </button>
              <button type="button" className="btn btn-primary" onClick={() => dismissOnboarding(true)}>
                Перейти к тестам
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
