import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Bell, Clock, CheckCircle, Circle } from 'lucide-react';
import api from '../../utils/api';
import './Dashboard.css';

const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();

  const [activeTab, setActiveTab] = useState('today');
  const [selectedDay, setSelectedDay] = useState(today);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    api.get('/tests/results/my')
      .then(res => setTestResults(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        { icon: '🧘', label: 'Медитация', time: '15 мин', done: false },
        { icon: '🚶', label: 'Прогулка', time: '30 мин', done: false },
        { icon: '😴', label: 'Отдых', time: '20 мин', done: true },
      ]
    };
    if (stressVal >= 40) return {
      title: 'Совет дня: поддержите баланс',
      text: 'Включите любимую музыку и уделите несколько минут себе. Это поможет переключиться и немного расслабиться.',
      activities: [
        { icon: '🏃', label: 'Легкая активность', time: '30 мин', done: false },
        { icon: '🎨', label: 'Хобби', time: '30 мин', done: false },
        { icon: '🧘', label: 'Релаксация', time: '30 мин', done: true },
      ]
    };
    return {
      title: 'Совет дня: отличное состояние!',
      text: 'Вы в хорошей форме! Поддерживайте режим дня и не забывайте про регулярную физическую активность.',
      activities: [
        { icon: '🏋️', label: 'Спорт', time: '45 мин', done: true },
        { icon: '📚', label: 'Чтение', time: '30 мин', done: false },
        { icon: '🎵', label: 'Музыка', time: '20 мин', done: false },
      ]
    };
  };

  const tip = getTip();

  const recommendations = [
    {
      img: '/photos/фото1.jpg',
      title: 'Уменьшить тревожность',
      category: 'Дыхание',
      time: '2 мин',
      desc: 'Это упражнение помогает снизить тревожность за счет замедления дыхания и активации парасимпатической нервной системы.',
      hasPlay: false,
    },
    {
      img: '/photos/фото2.jpg',
      title: 'Спокойный ум',
      category: 'Тест',
      time: '2 мин',
      desc: 'Это упражнение помогает снизить тревожность за счет замедления дыхания и активации парасимпатической нервной системы.',
      hasPlay: false,
    },
    {
      img: '/photos/фото3.jpg',
      title: 'Момент тишины',
      category: 'Медитация',
      time: '2 мин',
      desc: 'Это упражнение помогает снизить тревожность за счет замедления дыхания и активации парасимпатической нервной системы.',
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

          <button className="details-btn" onClick={() => navigate('/stats')}>
            Подробнее
          </button>
        </div>
      </div>

      {/* Tip card */}
      <div className="tip-card">
        <h2 className="tip-title">💡 {tip.title}</h2>
        <p className="tip-body">{tip.text}</p>
        <p className="activities-label">Рекомендуемые активности</p>
        <div className="activities-grid">
          {tip.activities.map((act, i) => (
            <div key={i} className={`activity-pill ${act.done ? 'done' : ''}`}>
              <span className="act-check">
                {act.done
                  ? <CheckCircle size={18} />
                  : <Circle size={18} />
                }
              </span>
              <span className="act-icon">{act.icon}</span>
              <span className="act-label">{act.label}</span>
              <span className="act-time"><Clock size={11} /> {act.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="recs-section">
        <h2 className="recs-title">🌿 Рекомендации дня</h2>
        <div className="recs-list">
          {recommendations.map((rec, i) => (
            <div key={i} className="rec-card">
              <div className="rec-img-wrap">
                <img
                  src={rec.img}
                  alt={rec.title}
                  className="rec-img"
                  onError={e => {
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
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
