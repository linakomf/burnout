import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useChat } from '../../hooks/useChat';
import { format, startOfMonth, getDaysInMonth, addMonths, subMonths, addDays, startOfWeek } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  BookOpen } from
'lucide-react';
import ChatPanel from '../chat/ChatPanel';
import api from '../../utils/api';
import {
  getCheckinForDate,
  getCheckinsSortedDesc,
  CHECKIN_MOOD_EMOJIS,
  percentToOneToTen } from
'../../utils/dailyCheckinStorage';
import './Diary.css';

const DIARY_TWEMOJI_CDN =
  'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/72x72';

/** Twemoji hex (без .png): порядок как в Diary MOODS — отлично … раздражён */
const DIARY_MOOD_TWEMOJI_BY_MOODS_IDX = ['1f604', '1f642', '1f610', '1f614', '1f625', '1f624'];

/** Индексы чекина 0–4 — как в макете: 😄 🙂 😐 😔 😥 */
const CHECKIN_MOOD_TWEMOJI_FILES = ['1f604', '1f642', '1f610', '1f614', '1f625'];

const EMOJI_CHAR_TO_TWEMOJI_FILE = {
  '😰': '1f630',
  '😊': '1f60a',
  '😌': '1f60c',
  '🙂': '1f642',
  '😐': '1f610',
  '😡': '1f621',
  '😄': '1f604',
  '😢': '1f622',
  '😥': '1f625',
  '😔': '1f614',
  '😕': '1f615',
  '😤': '1f624'
};

function DiaryTwemoji({
  file,
  className = '',
  size = 'md',
  title,
  variant = 'card'
}) {
  const sizeMod = size === 'sm' ? ' diary-mood-emoji-card--sm' : size === 'lg' ? ' diary-mood-emoji-card--lg' : '';
  const vMod =
    variant === 'thumb' ? ' diary-mood-emoji-card--thumb' : variant === 'inline' ? ' diary-mood-emoji-card--inline' : '';
  return (
    <span className={`diary-mood-emoji-card${sizeMod}${vMod} ${className}`.trim()} title={title}>
      <img src={`${DIARY_TWEMOJI_CDN}/${file}.png`} alt="" className="diary-mood-emoji-card__img" draggable={false} />
    </span>
  );
}

function twemojiFileForUnicode(emoji) {
  return EMOJI_CHAR_TO_TWEMOJI_FILE[emoji] || '1f610';
}

const CHECKIN_CAL_COLORS = ['#4ade80', '#60a5fa', '#9ca3af', '#fb923c', '#f87171'];

const Diary = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const today = new Date();

  const [calMonth, setCalMonth] = useState(today);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [checkinListTick, setCheckinListTick] = useState(0);
  const [expandedCheckinDate, setExpandedCheckinDate] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await api.get('/diary');
      setDiaryEntries(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const refresh = () => setCheckinListTick((t) => t + 1);
    window.addEventListener('burnout-checkin-saved', refresh);
    const onStorage = (e) => {
      if (e.key === 'burnout_checkin_log_v1' || e.key === 'burnout_daily_checkin_v1') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('burnout-checkin-saved', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useLayoutEffect(() => {
    if (!expandedCheckinDate) return;
    const el = document.querySelector(
      `.state-history-card[data-checkin-date="${expandedCheckinDate}"]`
    );
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [expandedCheckinDate]);

  const checkinHistory = useMemo(() => {
    void checkinListTick;
    return getCheckinsSortedDesc();
  }, [checkinListTick]);

  const MOODS = useMemo(
    () => [
    { emoji: '😄', label: t('pages.diaryM0'), score: 6, color: '#4ade80' },
    { emoji: '🙂', label: t('pages.diaryM1'), score: 5, color: '#86efac' },
    { emoji: '😐', label: t('pages.diaryM2'), score: 4, color: '#fbbf24' },
    { emoji: '😔', label: t('pages.diaryM3'), score: 3, color: '#fb923c' },
    { emoji: '😥', label: t('pages.diaryM4'), score: 2, color: '#f87171' },
    { emoji: '😤', label: t('pages.diaryM5'), score: 1, color: '#ef4444' }],

    [t]
  );

  const EMOTIONS = useMemo(
    () => [
    { key: 'joy', label: t('pages.diaryEjoy'), emoji: '😄' },
    { key: 'anxiety', label: t('pages.diaryEanxiety'), emoji: '😰' },
    { key: 'stress', label: t('pages.diaryEstress'), emoji: '😡' }],

    [t]
  );

  const {
    messages,
    input,
    setInput,
    sendMessage,
    loading: chatLoading,
    emotions,
    overallMood,
    messagesEndRef
  } = useChat({
    userFirstName: user?.name?.split(' ')[0] || t('dash.greeting.friend'),
    onUserMessageSent: async (text) => {
      try {
        await api.post('/diary', {
          mood: 'neutral',
          mood_score: 4,
          note: text
        });
        await fetchEntries();
      } catch (err) {
        console.error(err);
      }
    }
  });

  const dateLocale = lang === 'en' ? enUS : ru;

  const calTitleStr = useMemo(() => {
    if (lang === 'kk') {
      return `${t(`cal.months.${calMonth.getMonth()}`)} ${calMonth.getFullYear()}`;
    }
    return format(calMonth, 'LLLL yyyy', { locale: dateLocale });
  }, [lang, t, calMonth, dateLocale]);

  const weekShortLabels = useMemo(() => {
    if (lang === 'kk') {
      return [0, 1, 2, 3, 4, 5, 6].map((i) => t(`cal.weekdayShort.${i}`));
    }
    const mon = startOfWeek(new Date(), { weekStartsOn: 1 });
    return [0, 1, 2, 3, 4, 5, 6].map((i) => format(addDays(mon, i), 'EEEEE', { locale: dateLocale }));
  }, [lang, t, dateLocale]);

  const daysInMonth = getDaysInMonth(calMonth);
  const firstDay = (startOfMonth(calMonth).getDay() + 6) % 7;
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

  const getMoodForDay = (day) => {
    if (!day) return null;
    const dateStr = format(new Date(calMonth.getFullYear(), calMonth.getMonth(), day), 'yyyy-MM-dd');
    const checkin = getCheckinForDate(dateStr);
    if (checkin) {
      return {
        color: CHECKIN_CAL_COLORS[checkin.moodIndex] || '#9ca3af',
        label: CHECKIN_MOOD_EMOJIS[checkin.moodIndex] || t('pages.checkinMark')
      };
    }
    const entry = diaryEntries.find((e) => format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr);
    if (!entry) return null;
    return MOODS.find((m) => m.score === entry.mood_score) || MOODS[2];
  };

  const isToday = (day) =>
  day === today.getDate() &&
  calMonth.getMonth() === today.getMonth() &&
  calMonth.getFullYear() === today.getFullYear();

  return (
    <div className="ai-diary fade-in">

      <div className="diary-grid">

        <div className="diary-left">

          <div className="diary-card calendar-block">
            <div className="cal-nav-row">
              <button type="button" className="cal-arrow" onClick={() => setCalMonth((m) => subMonths(m, 1))}>
                <ChevronLeft size={16} />
              </button>
              <span className="cal-title">
                {calTitleStr}
              </span>
              <button type="button" className="cal-arrow" onClick={() => setCalMonth((m) => addMonths(m, 1))}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="cal-weekdays-row">
              {weekShortLabels.map((d, idx) =>
              <span key={idx} className="cal-wd">{d}</span>
              )}
            </div>

            <div className="cal-days-grid">
              {calDays.map((day, i) => {
                const mood = getMoodForDay(day);
                return (
                  <div
                    key={i}
                    className={`cal-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''}`}>
                    
                    {day &&
                    <>
                        <span className="cal-num">{day}</span>
                        {mood &&
                      <div
                        className="cal-mood-dot"
                        style={{ background: mood.color }}
                        title={mood.label} />

                      }
                      </>
                    }
                  </div>);

              })}
            </div>

            <div className="cal-legend cal-legend--mood-cards">
              <span className="legend-label">{t('pages.diaryLegend')}</span>
              <div className="cal-legend-moods" role="list">
                {MOODS.map((m, idx) =>
                <DiaryTwemoji
                  key={m.score}
                  file={DIARY_MOOD_TWEMOJI_BY_MOODS_IDX[idx]}
                  title={m.label}
                  size="sm"
                />
                )}
              </div>
            </div>
          </div>

          <div className="diary-card history-block">
            <div className="history-header">
              <span className="history-title">{t('pages.diaryHistory')}</span>
              <span className="history-count-badge">{t('pages.diaryEntriesBadge', { n: checkinHistory.length })}</span>
            </div>
            <div className="state-history-list">
              {checkinHistory.length === 0 ?
              <div className="history-empty-state">
                <div className="history-empty-art" aria-hidden>
                  <BookOpen className="history-empty-icon" size={52} strokeWidth={1.35} />
                </div>
                <p className="history-empty-title">{t('pages.diaryEmpty')}</p>
                <p className="history-empty-hint">{t('pages.diaryEmptyHint')}</p>
              </div> :

              checkinHistory.map((row) => {
                const open = expandedCheckinDate === row.date;
                const e = percentToOneToTen(row.energy);
                const s = percentToOneToTen(row.stress);
                const moodTwemojiFile =
                CHECKIN_MOOD_TWEMOJI_FILES[Math.min(4, Math.max(0, row.moodIndex))] || '1f610';
                const rowDate = new Date(`${row.date}T12:00:00`);
                const dayLabel =
                lang === 'kk' ?
                `${rowDate.getDate()} ${t(`cal.months.${rowDate.getMonth()}`)}` :
                format(rowDate, 'd MMMM', { locale: dateLocale });
                return (
                  <div key={row.date} className="state-history-card" data-checkin-date={row.date}>
                      <button
                      type="button"
                      className="state-history-toggle"
                      onClick={() =>
                      setExpandedCheckinDate((cur) => cur === row.date ? null : row.date)
                      }
                      aria-expanded={open}>
                        <span className="state-history-date-text">{dayLabel}</span>
                        <span className="state-history-chev" aria-hidden>
                          {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </span>
                      </button>
                      {open &&
                    <div className="state-history-body">
                          <div className="state-history-row state-history-mood">
                            <span className="state-history-label">{t('pages.diaryMood')}</span>
                            <DiaryTwemoji
                              file={moodTwemojiFile}
                              size="sm"
                              title={CHECKIN_MOOD_EMOJIS[row.moodIndex] || ''}
                              className="state-history-emoji-card"
                            />
                          </div>
                          <div className="state-history-section">
                            <div className="state-history-sec-top">
                              <span className="state-history-sec-title">{t('pages.diaryEnergy')}</span>
                              <span className="state-history-sec-val">
                                {t('pages.diaryOutOf', { n: e })}
                              </span>
                            </div>
                            <div className="state-bar-track state-bar-track--energy">
                              <div
                            className="state-bar-fill state-bar-fill--energy"
                            style={{ width: `${e * 10}%` }} />
                          
                            </div>
                          </div>
                          <div className="state-history-section">
                            <div className="state-history-sec-top">
                              <span className="state-history-sec-title">{t('pages.diaryStress')}</span>
                              <span className="state-history-sec-val">
                                {t('pages.diaryOutOf', { n: s })}
                              </span>
                            </div>
                            <div className="state-bar-track state-bar-track--stress">
                              <div
                            className="state-bar-fill state-bar-fill--stress"
                            style={{ width: `${s * 10}%` }} />
                          
                            </div>
                          </div>
                          {row.notes &&
                      <div className="state-history-notes-block">
                              <div className="state-history-notes-h">{t('pages.diaryNotes')}</div>
                              <p className="state-history-notes-t">{row.notes}</p>
                            </div>
                      }
                        </div>
                    }
                    </div>);

              })
              }
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
            messagesEndRef={messagesEndRef} />
          
        </div>

        <div className="diary-right">

          <div className="diary-card emotion-block">
            <div className="emotion-header">
              <span className="emotion-header-title">{t('pages.diaryAnalysis')}</span>
            </div>

            {EMOTIONS.map((em) =>
            <div key={em.key} className="emotion-row">
                <div className="emotion-row-top">
                  <DiaryTwemoji
                    file={twemojiFileForUnicode(em.emoji)}
                    variant="inline"
                    title={em.label}
                  />
                  <span className="emotion-name">{em.label}</span>
                  <span className="emotion-score">{emotions[em.key]}%</span>
                </div>
                <div className="emotion-track">
                  <div className="emotion-fill" style={{ width: `${emotions[em.key]}%` }} />
                
                </div>
              </div>
            )}

            <div className="overall-state">
              <span className="overall-label">{t('pages.diaryOverall')}</span>
              <div className="overall-card">
                <div className="overall-card-text">
                  <div className="overall-mood-name">{overallMood.label}</div>
                  <div className="overall-mood-sub">{overallMood.sub}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>);

};

export default Diary;