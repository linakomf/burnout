import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getPsychologistReplyResult } from '../services/ai';
import { analyzeEmotions, deriveOverallMood } from '../services/emotion';
import { useSpaceCatalog } from './useSpaceCatalog';
import { buildAiChatRecommendationCards } from '../utils/aiChatRecommendations';
import { getPreviousRecommendationContext } from '../utils/aiChatRejection';
import {
  loadDiaryChatSession,
  saveDiaryChatSession,
  todaySessionDate,
} from '../utils/diaryChatSession';

export function useChat({ onSessionSaved } = {}) {
  const { user } = useAuth();
  const { catalog: spaceCatalog } = useSpaceCatalog();
  const sessionDate = todaySessionDate();
  const [messages, setMessages] = useState([]);
  const [sessionReady, setSessionReady] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState({ joy: 20, anxiety: 20, stress: 20 });
  const [overallMood, setOverallMood] = useState({
    emoji: '😌',
    label: 'Спокойно',
    sub: 'Эмоции ровные. Стресс не превышает норму.'
  });

  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const onSavedRef = useRef(onSessionSaved);
  const sendingRef = useRef(false);
  const spaceCatalogRef = useRef(spaceCatalog);
  const userRef = useRef(user);
  const sessionDateRef = useRef(sessionDate);

  onSavedRef.current = onSessionSaved;
  spaceCatalogRef.current = spaceCatalog;
  userRef.current = user;
  sessionDateRef.current = sessionDate;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    setSessionReady(false);
    loadDiaryChatSession(sessionDate)
      .then(({ messages: saved }) => {
        if (cancelled) return;
        if (saved.length) {
          setMessages(saved);
          messagesRef.current = saved;
        }
      })
      .catch((err) => {
        console.error('[diary chat session load]', err);
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionDate]);

  useEffect(() => {
    if (!sessionReady || messages.length === 0 && !loading) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, loading, sessionReady]);

  const persistSession = useCallback(async (nextMessages, moodMeta = {}) => {
    if (!nextMessages.length) return;
    try {
      await saveDiaryChatSession(sessionDateRef.current, nextMessages, moodMeta);
      window.dispatchEvent(new Event('burnout-diary-saved'));
      await onSavedRef.current?.();
    } catch (err) {
      console.error('[diary chat session save]', err);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sendingRef.current || !sessionReady) return;

    sendingRef.current = true;
    const userMsg = {
      role: 'user',
      content: text,
      time: format(new Date(), 'HH:mm'),
    };

    const prev = messagesRef.current;
    const afterUser = [...prev, userMsg];
    setMessages(afterUser);
    messagesRef.current = afterUser;
    setInput('');
    setLoading(true);

    let moodMeta = { mood: 'neutral', mood_score: 4 };

    try {
      const emotionScores = await analyzeEmotions(text);
      setEmotions(emotionScores);
      const moodState = deriveOverallMood(emotionScores);
      setOverallMood(moodState);
      const stressPct = Number(emotionScores.stress) || 20;
      moodMeta = {
        mood: 'neutral',
        mood_score: Math.min(10, Math.max(1, Math.round(10 - stressPct / 12))),
      };

      const historyForAi = afterUser.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { previousCardTypes, previousCardPaths } = getPreviousRecommendationContext(prev);
      const { reply: replyText, cardHints } = await getPsychologistReplyResult(historyForAi, {
        previousCardTypes,
      });
      const cards = buildAiChatRecommendationCards({
        userText: text,
        user: userRef.current,
        spaceCatalog: spaceCatalogRef.current,
        cardHints,
        previousCardTypes,
        previousCardPaths,
        conversationMessages: prev,
      });

      const assistantMsg = {
        role: 'assistant',
        content: replyText,
        time: format(new Date(), 'HH:mm'),
        cards: cards.length ? cards : undefined,
      };

      const next = [...afterUser, assistantMsg];
      setMessages(next);
      messagesRef.current = next;
      await persistSession(next, moodMeta);
    } catch (e) {
      console.error(e);
      const assistantMsg = {
        role: 'assistant',
        content:
          'Сейчас не удалось связаться с ассистентом. Я всё равно рядом - попробуй написать ещё раз чуть позже.',
        time: format(new Date(), 'HH:mm'),
      };
      const next = [...afterUser, assistantMsg];
      setMessages(next);
      messagesRef.current = next;
      await persistSession(next, moodMeta);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [input, sessionReady, persistSession]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    loading: loading || !sessionReady,
    sessionReady,
    emotions,
    overallMood,
    messagesEndRef,
  };
}
