import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';
import { format, startOfMonth, getDaysInMonth, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import ChatPanel from '../chat/ChatPanel';
import api from '../../utils/api';
import './Diary.css';

const MOODS = [
  { emoji: '😄', label: 'Отлично', score: 6, color: '#4ade80' },
  { emoji: '😊', label: 'Хорошо', score: 5, color: '#86efac' },
  { emoji: '😐', label: 'Нейтрально', score: 4, color: '#fbbf24' },
  { emoji: '😕', label: 'Плохо', score: 3, color: '#fb923c' },
  { emoji: '😢', label: 'Грустно', score: 2, color: '#f87171' },
  { emoji: '😤', label: 'Раздражён', score: 1, color: '#ef4444' },
];

const EMOTIONS = [
  { key: 'joy', label: 'Радость', emoji: '😊', color: '#4ade80' },
  { key: 'anxiety', label: 'Тревога', emoji: '😰', color: '#fb923c' },
  { key: 'stress', label: 'Стресс', emoji: '😤', color: '#f87171' },
];

const Diary = () => {
  const { user } = useAuth();
  const today = new Date();

  const [calMonth, setCalMonth] = useState(today);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [historyEntries, setHistoryEntries] = useState([]);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get('/diary');
      setHistoryEntries(res.data.slice(0, 10));
      setDiaryEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const {
    messages,
    input,
    setInput,
    sendMessage,
    loading: chatLoading,
    emotions,
    overallMood,
    messagesEndRef,
  } = useChat({
    userFirstName: user?.name?.split(' ')[0] || 'друг',
    onUserMessageSent: async (text) => {
      try {
        await api.post('/diary', {
          mood: 'neutral',
          mood_score: 4,
          note: text,
        });
        await fetchEntries();
      } catch (err) {
        console.error(err);
      }
    },
  });

  const daysInMonth = getDaysInMonth(calMonth);
  const firstDay = (startOfMonth(calMonth).getDay() + 6) % 7;
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

  const getMoodForDay = (day) => {
    if (!day) return null;
    const dateStr = format(new Date(calMonth.getFullYear(), calMonth.getMonth(), day), 'yyyy-MM-dd');
    const entry = diaryEntries.find(e => format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr);
    if (!entry) return null;
    return MOODS.find(m => m.score === entry.mood_score) || MOODS[2];
  };

  const isToday = (day) =>
    day === today.getDate() &&
    calMonth.getMonth() === today.getMonth() &&
    calMonth.getFullYear() === today.getFullYear();

  return (
    <div className="ai-diary fade-in">

      <div className="diary-top">
        <h1 className="diary-page-title">🧠 Burnout Tracker</h1>
        <p className="diary-page-sub">Профессиональный анализ эмоционального выгорания</p>
      </div>

      <div className="diary-grid">

        <div className="diary-left">

          <div className="diary-card calendar-block">
            <div className="cal-nav-row">
              <button type="button" className="cal-arrow" onClick={() => setCalMonth(m => subMonths(m, 1))}>
                <ChevronLeft size={16} />
              </button>
              <span className="cal-title">
                {format(calMonth, 'LLLL yyyy', { locale: ru })}
              </span>
              <button type="button" className="cal-arrow" onClick={() => setCalMonth(m => addMonths(m, 1))}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="cal-weekdays-row">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                <span key={d} className="cal-wd">{d}</span>
              ))}
            </div>

            <div className="cal-days-grid">
              {calDays.map((day, i) => {
                const mood = getMoodForDay(day);
                return (
                  <div
                    key={i}
                    className={`cal-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''}`}
                  >
                    {day && (
                      <>
                        <span className="cal-num">{day}</span>
                        {mood && (
                          <div
                            className="cal-mood-dot"
                            style={{ background: mood.color }}
                            title={mood.label}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cal-legend">
              <span className="legend-label">Легенда:</span>
              {MOODS.slice(0, 4).map(m => (
                <div key={m.score} className="legend-dot" style={{ background: m.color }} title={m.label} />
              ))}
            </div>
          </div>

          <div className="diary-card history-block">
            <div className="history-header">
              <span className="history-title">История записей</span>
              <span className="history-count">{historyEntries.length} записей</span>
            </div>
            <div className="history-list">
              {historyEntries.length === 0 ? (
                <p className="history-empty">Записей пока нет</p>
              ) : (
                historyEntries.map(entry => {
                  const mood = MOODS.find(m => m.score === entry.mood_score) || MOODS[2];
                  return (
                    <div key={entry.entry_id} className="history-item">
                      <div className="history-item-top">
                        <Clock size={12} className="history-clock" />
                        <span className="history-date">
                          {format(new Date(entry.created_at), 'd MMMM', { locale: ru })}
                        </span>
                        <span className="history-emoji">{mood.emoji}</span>
                      </div>
                      <p className="history-note">{entry.note || '—'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="diary-center">
          <ChatPanel
            user={user}
            messages={messages}
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            loading={chatLoading}
            messagesEndRef={messagesEndRef}
          />
        </div>

        <div className="diary-right">

          <div className="diary-card emotion-block">
            <div className="emotion-header">
              <TrendingUp size={16} />
              <span>Анализ эмоций</span>
              <span className="emotion-icon-right">↗</span>
            </div>

            {EMOTIONS.map(em => (
              <div key={em.key} className="emotion-row">
                <div className="emotion-row-top">
                  <span className="emotion-emoji-sm">{em.emoji}</span>
                  <span className="emotion-name">{em.label}</span>
                  <span className="emotion-score">{emotions[em.key]}%</span>
                </div>
                <div className="emotion-labels">
                  <span>Низкое</span><span>Высокое</span>
                </div>
                <div className="emotion-track">
                  <div
                    className="emotion-fill"
                    style={{
                      width: `${emotions[em.key]}%`,
                      background: em.color,
                    }}
                  />
                </div>
              </div>
            ))}

            <div className="overall-state">
              <span className="overall-label">ОБЩЕЕ СОСТОЯНИЕ</span>
              <div className="overall-card">
                <span className="overall-emoji">{overallMood.emoji}</span>
                <div>
                  <div className="overall-mood-name">{overallMood.label}</div>
                  <div className="overall-mood-sub">{overallMood.sub}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="diary-card support-block">
            <div className="support-stars">✨</div>
            <div className="support-content">
              <div className="support-character">🧘</div>
              <div className="support-text">
                Я здесь, чтобы поддержать тебя 💙
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Diary;
