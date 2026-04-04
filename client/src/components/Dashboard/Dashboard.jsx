import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, Clock, Circle, MessageCircle, Send, X } from 'lucide-react';
import api from '../../utils/api';
import { getPsychologistReply } from '../../services/ai';
import './Dashboard.css';

const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const ONBOARD_KEY = 'burnout_onboarding_v1';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();

  const [activeTab, setActiveTab] = useState('today');
  const [selectedDay, setSelectedDay] = useState(today);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState(() => new Set());
  const [expandedRecIndex, setExpandedRecIndex] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [aiHelperOpen, setAiHelperOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiSendingRef = useRef(false);
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
  const levelMap = { 'Низкий': 30, 'Средний': 60, 'Высокий': 85 };
  const stressVal = lastResult ? (levelMap[lastResult.level] || 40) : 40;
  const moodVal = Math.max(10, 100 - stressVal);
  const energyVal = Math.max(10, 80 - Math.floor(stressVal / 2));

  const greetingTime = () => {
    const h = today.getHours();
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const getTip = () => {
    if (stressVal >= 70) return {
      title: 'Совет дня: позаботьтесь о себе',
      text: 'Уровень стресса повышен. Сделайте паузу, выйдите на свежий воздух и уделите время дыхательным упражнениям.',
      activities: [
        { icon: '🧘', label: 'Медитация', time: '15 мин' },
        { icon: '🚶', label: 'Прогулка', time: '30 мин' },
        { icon: '😴', label: 'Отдых', time: '20 мин' },
      ]
    };
    if (stressVal >= 40) return {
      title: 'Совет дня: поддержите баланс',
      text: 'Включите любимую музыку и уделите несколько минут себе. Это поможет переключиться и немного расслабиться.',
      activities: [
        { icon: '🏃', label: 'Легкая активность', time: '30 мин' },
        { icon: '🎨', label: 'Хобби', time: '30 мин' },
        { icon: '🧘', label: 'Релаксация', time: '30 мин' },
      ]
    };
    return {
      title: 'Совет дня: отличное состояние!',
      text: 'Вы в хорошей форме! Поддерживайте режим дня и не забывайте про регулярную физическую активность.',
      activities: [
        { icon: '🏋️', label: 'Спорт', time: '45 мин' },
        { icon: '📚', label: 'Чтение', time: '30 мин' },
        { icon: '🎵', label: 'Музыка', time: '20 мин' },
      ]
    };
  };

  const tip = getTip();

  useEffect(() => {
    setSelectedActivities(new Set());
    setExpandedRecIndex(null);
  }, [tip.title]);

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

  const sendAiHelper = async () => {
    const t = aiInput.trim();
    if (!t || aiSendingRef.current) return;
    aiSendingRef.current = true;
    const userMsg = { role: 'user', text: t };
    const withUser = [...aiMessages, userMsg];
    setAiMessages(withUser);
    setAiInput('');
    setAiLoading(true);
    const historyForApi = withUser.map((m) => ({ role: m.role, content: m.text }));
    try {
      const replyText = await getPsychologistReply(historyForApi);
      setAiMessages((prev) => [...prev, { role: 'assistant', text: replyText }]);
    } catch (e) {
      console.error(e);
      setAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            'Сейчас не удалось получить ответ. Попробуйте ещё раз позже или нажмите кнопку «ИИ-помощник» в углу экрана.',
        },
      ]);
    } finally {
      setAiLoading(false);
      aiSendingRef.current = false;
    }
  };

  const recommendations = [
    {
      img: '/photos/фото1.jpg',
      title: 'Уменьшить тревожность',
      category: 'Дыхание',
      time: '2 мин',
      desc: 'Короткая практика дыхания для снижения тревожности.',
      detail:
        'Дышите медленно: вдох 4 счёта, задержка 2, выдох 6. Повторите 5–8 циклов. Так активируется парасимпатическая нервная система, снижается пульс и уровень кортизола. Удобно делать сидя или перед сном.',
      hasPlay: false,
    },
    {
      img: '/photos/фото2.jpg',
      title: 'Спокойный ум',
      category: 'Тест',
      time: '2 мин',
      desc: 'Мини-проверка состояния и фокус внимания.',
      detail:
        'Закройте глаза на минуту и отметьте три звука вокруг, затем три ощущения в теле. Это упражнение «заземления» возвращает внимание в настоящий момент и снижает круговые мысли.',
      hasPlay: false,
    },
    {
      img: '/photos/фото3.jpg',
      title: 'Момент тишины',
      category: 'Медитация',
      time: '2 мин',
      desc: 'Микро-медитация без подготовки.',
      detail:
        'Сядьте ровно, мягко смотрите в одну точку или закройте глаза. Считайте вдохи от 1 до 10 и снова. Если отвлеклись — спокойно вернитесь к счёту. Достаточно 2 минут, чтобы снизить возбуждение нервной системы.',
      hasPlay: true,
    },
  ];

  if (loading) return (
    <div className="dash-loading"><div className="loading-spinner" /></div>
  );

  return (
    <div className="dashboard-new fade-in">

      {/* Header */}
      <div className="dash-header">
        <h1 className="dash-greeting">{greetingTime()}, {user?.name?.split(' ')[0]}!</h1>
        <button className="notif-btn"><Bell size={20} /></button>
      </div>

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
              className={`week-day-btn ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className="wday-date">{format(day, 'd MMM', { locale: ru })}</span>
              <span className="wday-name">{WEEK_DAYS[i]}</span>
            </button>
          );
        })}
      </div>

      {/* Hero banner */}
      <div className="hero-banner">
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
            <button type="button" className="ai-helper-btn" onClick={() => setAiHelperOpen(true)}>
              <MessageCircle size={18} />
              ИИ-помощник
            </button>
          </div>
        </div>
      </div>

      {/* Tip card */}
      <div className="tip-card">
        <h2 className="tip-title">💡 {tip.title}</h2>
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
        <div className="recs-list">
          {recommendations.map((rec, i) => {
            const expanded = expandedRecIndex === i;
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
                <div className="rec-img-wrap">
                  <img
                    src={rec.img}
                    alt=""
                    className="rec-img"
                    onError={(e) => {
                      e.target.parentElement.style.background = '#c8d8a8';
                      e.target.style.display = 'none';
                    }}
                  />
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
                        onClick={() => navigate('/tests')}
                      >
                        Начать
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
              Ниже — расшифровка блоков настроения, стресса и энергии. Данные основаны на ваших последних результатах тестов
              и служат ориентиром, а не диагнозом.
            </p>
            <ul className="dash-details-list">
              <li><strong>Настроение ({moodVal}%)</strong> — чем выше значение, тем комфортнее субъективное состояние.</li>
              <li><strong>Стресс ({stressVal}%)</strong> — отражает нагрузку; при высоких значениях полезны паузы и поддержка.</li>
              <li><strong>Энергия ({energyVal}%)</strong> — оценка бодрости; низкие значения намекают на отдых и режим сна.</li>
            </ul>
            <p className="dash-details-note">
              Полную динамику можно посмотреть в разделе «Статистика».
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setDetailsOpen(false)}>Закрыть</button>
              <button type="button" className="btn btn-primary" onClick={() => { setDetailsOpen(false); navigate('/stats'); }}>
                Перейти в статистику
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`dash-ai-drawer ${aiHelperOpen ? 'open' : ''}`} aria-hidden={!aiHelperOpen}>
        <div className="dash-ai-drawer-header">
          <span className="dash-ai-drawer-title">
            <MessageCircle size={18} /> ИИ-помощник
            {process.env.REACT_APP_OPENAI_API_KEY?.trim() ? (
              <span className="dash-ai-badge">ChatGPT</span>
            ) : (
              <span className="dash-ai-badge dash-ai-badge-muted">локально</span>
            )}
          </span>
          <button type="button" className="dash-ai-close" onClick={() => setAiHelperOpen(false)} aria-label="Закрыть чат">
            <X size={18} />
          </button>
        </div>
        <div className="dash-ai-messages">
          {aiMessages.length === 0 && (
            <p className="dash-ai-empty">Напишите, что вас беспокоит — ответ появится здесь.</p>
          )}
          {aiMessages.map((msg, idx) => (
            <div key={idx} className={`dash-ai-msg ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          {aiLoading && (
            <div className="dash-ai-msg assistant dash-ai-typing">Печатаю ответ…</div>
          )}
        </div>
        <div className="dash-ai-input-row">
          <input
            className="dash-ai-input input"
            placeholder="Ваше сообщение..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !aiLoading && sendAiHelper()}
            disabled={aiLoading}
          />
          <button
            type="button"
            className="btn btn-primary dash-ai-send"
            onClick={sendAiHelper}
            disabled={!aiInput.trim() || aiLoading}
          >
            <Send size={16} />
            Отправить
          </button>
        </div>
      </div>
      {aiHelperOpen && <button type="button" className="dash-ai-backdrop" aria-label="Закрыть" onClick={() => setAiHelperOpen(false)} />}

      {showOnboarding && (
        <div className="modal-overlay" role="dialog" aria-labelledby="onboard-title">
          <div className="modal-card fade-in">
            <h2 id="onboard-title" style={{ margin: '0 0 12px', fontSize: 22, fontWeight: 800 }}>Добро пожаловать</h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-mid)', marginBottom: 20 }}>
              Начните с теста <strong>GAD-7</strong> (тревожность) и <strong>ежедневного чек-ина</strong> — так в разделе «Аналитика»
              появится динамика. Затем загляните в <strong>Практики</strong>: мы подберём упражнения под ваши последние результаты.
              В дневнике можно написать «как я себя чувствую» — ИИ даст мягкую поддержку (не диагноз).
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
