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
  CHECKIN_MOOD_EMOJIS,
  percentToOneToTen } from
'../../utils/dailyCheckinStorage';
import { normalizeChatMessages } from '../../utils/diaryChatSession';
import {
  CHECKIN_MOOD_TWEMOJI_FILES,
  moodEmojiUrl,
} from '../../utils/moodEmojiAssets';
import './Diary.css';

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
      <img src={moodEmojiUrl(file)} alt="" className="diary-mood-emoji-card__img" draggable={false} />
    </span>
  );
}

const CHECKIN_CAL_COLORS = ['#4ade80', '#60a5fa', '#9ca3af', '#fb923c', '#f87171'];

const Diary = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const today = new Date();

  const [calMonth, setCalMonth] = useState(today);
  const [selectedCalDate, setSelectedCalDate] = useState(format(today, 'yyyy-MM-dd'));
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

  useEffect(() => {
    void checkinListTick;
    const checkin = getCheckinForDate(selectedCalDate);
    setExpandedCheckinDate(checkin ? selectedCalDate : null);
  }, [selectedCalDate, checkinListTick]);

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

  const {
    messages,
    input,
    setInput,
    sendMessage,
    loading: chatLoading,
    messagesEndRef
  } = useChat({
    onSessionSaved: fetchEntries,
  });

  const dateLocale = lang === 'en' ? enUS : ru;

  const aiDiaryGroups = useMemo(() => {
    const groups = [];
    const groupsMap = new Map();

    const ensureGroup = (dateKey, createdAt) => {
      if (groupsMap.has(dateKey)) return groupsMap.get(dateKey);
      const dateLabel =
        lang === 'kk' ?
          `${createdAt.getDate()} ${t(`cal.months.${createdAt.getMonth()}`)}` :
          format(createdAt, 'd MMMM', { locale: dateLocale });
      const nextGroup = { dateKey, dateLabel, entries: [] };
      groupsMap.set(dateKey, nextGroup);
      groups.push(nextGroup);
      return nextGroup;
    };

    [...diaryEntries]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .forEach((entry, index) => {
        const chatMessages = normalizeChatMessages(entry.chat_messages);
        if (chatMessages.length) {
          const sessionDay = entry.session_date ?
            new Date(`${String(entry.session_date).slice(0, 10)}T12:00:00`) :
            new Date(entry.created_at);
          if (Number.isNaN(sessionDay.getTime())) return;
          const dateKey = format(sessionDay, 'yyyy-MM-dd');
          const group = ensureGroup(dateKey, sessionDay);
          chatMessages.forEach((msg, msgIdx) => {
            group.entries.push({
              id: `${entry.entry_id || dateKey}-chat-${msgIdx}`,
              time: msg.time || format(new Date(entry.created_at), 'HH:mm'),
              text: msg.content,
              role: msg.role,
            });
          });
          return;
        }

        if (typeof entry?.note !== 'string' || !entry.note.trim()) return;
        const createdAt = new Date(entry.created_at);
        if (Number.isNaN(createdAt.getTime())) return;
        const dateKey = format(createdAt, 'yyyy-MM-dd');
        const group = ensureGroup(dateKey, createdAt);
        group.entries.push({
          id: entry.entry_id || `${dateKey}-${index}`,
          time: format(createdAt, 'HH:mm'),
          text: entry.note.trim(),
          role: 'user',
        });
      });

    return groups;
  }, [diaryEntries, lang, t, dateLocale]);

  const aiLogMessageCount = useMemo(
    () => aiDiaryGroups.reduce((sum, group) => sum + group.entries.length, 0),
    [aiDiaryGroups]
  );

  const selectedCheckin = useMemo(() => {
    void checkinListTick;
    return getCheckinForDate(selectedCalDate);
  }, [selectedCalDate, checkinListTick]);

  const selectedAiGroup = useMemo(
    () => aiDiaryGroups.find((group) => group.dateKey === selectedCalDate) || null,
    [aiDiaryGroups, selectedCalDate]
  );

  const selectedDayLabel = useMemo(() => {
    const rowDate = new Date(`${selectedCalDate}T12:00:00`);
    if (Number.isNaN(rowDate.getTime())) return selectedCalDate;
    if (lang === 'kk') {
      return `${rowDate.getDate()} ${t(`cal.months.${rowDate.getMonth()}`)}`;
    }
    return format(rowDate, 'd MMMM', { locale: dateLocale });
  }, [selectedCalDate, lang, t, dateLocale]);

  const calDateStrForDay = (day) =>
    format(new Date(calMonth.getFullYear(), calMonth.getMonth(), day), 'yyyy-MM-dd');

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
    <div className="ai-diary" data-no-scroll-reveal>

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
                const dateStr = day ? calDateStrForDay(day) : null;
                const selected = Boolean(dateStr && selectedCalDate === dateStr);
                if (!day) {
                  return <div key={i} className="cal-cell empty" aria-hidden />;
                }
                return (
                  <button
                    key={i}
                    type="button"
                    className={`cal-cell ${isToday(day) ? 'today' : ''} ${selected && !isToday(day) ? 'selected' : ''}`}
                    onClick={() => setSelectedCalDate(dateStr)}
                    aria-label={format(new Date(`${dateStr}T12:00:00`), 'd MMMM yyyy', { locale: dateLocale })}
                    aria-pressed={selected}
                  >
                    <span className="cal-num">{day}</span>
                    {mood ? (
                      <div
                        className="cal-mood-dot"
                        style={{ background: mood.color }}
                        title={mood.label}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="diary-card history-block">
            <div className="history-header">
              <span className="history-title">{t('pages.diaryHistory')}</span>
              <span className="history-count-badge">
                {t('pages.diaryEntriesBadge', { n: selectedCheckin ? 1 : 0 })}
              </span>
            </div>
            <p className="history-selected-day">{selectedDayLabel}</p>
            <div className="state-history-list">
              {!selectedCheckin ? (
              <div className="history-empty-state">
                <div className="history-empty-art" aria-hidden>
                  <BookOpen className="history-empty-icon" size={52} strokeWidth={1.35} />
                </div>
                <p className="history-empty-title">{t('dash.checkin.noCheckinTitle')}</p>
                <p className="history-empty-hint">{t('dash.checkin.noCheckinSub')}</p>
              </div>
              ) : (
              (() => {
                const row = selectedCheckin;
                const open = expandedCheckinDate === row.date;
                const e = percentToOneToTen(row.energy);
                const s = percentToOneToTen(row.stress);
                const moodTwemojiFile =
                CHECKIN_MOOD_TWEMOJI_FILES[Math.min(4, Math.max(0, row.moodIndex))] || '1f610';
                return (
                  <div key={row.date} className="state-history-card" data-checkin-date={row.date}>
                      <button
                      type="button"
                      className="state-history-toggle"
                      onClick={() =>
                      setExpandedCheckinDate((cur) => cur === row.date ? null : row.date)
                      }
                      aria-expanded={open}>
                        <span className="state-history-date-text">{selectedDayLabel}</span>
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
              })()
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
            messagesEndRef={messagesEndRef} />
          
        </div>

        <div className="diary-right">

          <div className="diary-card ai-log-block">
            <div className="ai-log-header">
              <span className="ai-log-title">{t('pages.diaryAiLog')}</span>
              <span className="ai-log-total">
                {t('pages.diaryAiMessagesBadge', { n: selectedAiGroup?.entries.length || 0 })}
              </span>
            </div>
            <p className="history-selected-day">{selectedDayLabel}</p>

            {!selectedAiGroup ?
            <div className="history-empty-state ai-log-empty-state">
                <div className="history-empty-art" aria-hidden>
                  <BookOpen className="history-empty-icon" size={52} strokeWidth={1.35} />
                </div>
                <p className="history-empty-title">
                  {aiLogMessageCount === 0 ? t('pages.diaryAiEmpty') : t('pages.diaryAiEmptyForDay')}
                </p>
                <p className="history-empty-hint">
                  {aiLogMessageCount === 0 ? t('pages.diaryAiEmptyHint') : t('pages.diaryAiEmptyForDayHint')}
                </p>
              </div>
             :
            <div className="ai-log-list">
                <article className="ai-log-card">
                    <div className="ai-log-card-head">
                      <span className="ai-log-date">{selectedAiGroup.dateLabel}</span>
                      <span className="ai-log-count">
                        {t('pages.diaryAiMessagesBadge', { n: selectedAiGroup.entries.length })}
                      </span>
                    </div>
                    <div className="ai-log-messages">
                      {selectedAiGroup.entries.map((entry) =>
                  <div key={entry.id} className={`ai-log-message${entry.role === 'assistant' ? ' ai-log-message--assistant' : ''}`}>
                          <span className="ai-log-message-time">{entry.time}</span>
                          <p className="ai-log-message-text">{entry.text}</p>
                        </div>
                  )}
                    </div>
                  </article>
                </div>
            }
          </div>

        </div>
      </div>
    </div>);

};

export default Diary;