import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { getPsychologistReply } from '../services/ai';
import { analyzeEmotions, deriveOverallMood } from '../services/emotion';

export function useChat({ userFirstName = 'друг', onUserMessageSent } = {}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState({ joy: 20, anxiety: 20, stress: 20 });
  const [overallMood, setOverallMood] = useState({
    emoji: '😌',
    label: 'Спокойно',
    sub: 'Напишите пару строк — обновим анализ',
  });

  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);
  const onSentRef = useRef(onUserMessageSent);
  const sendingRef = useRef(false);

  onSentRef.current = onUserMessageSent;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const welcomeContent = `Привет, ${userFirstName}! Расскажи, как прошёл твой день?`;
    const welcome = {
      role: 'assistant',
      content: welcomeContent,
      time: format(new Date(), 'HH:mm'),
    };
    setMessages((prev) => {
      if (prev.length === 0) {
        messagesRef.current = [welcome];
        return [welcome];
      }
      if (
        prev.length === 1 &&
        prev[0].role === 'assistant' &&
        typeof prev[0].content === 'string' &&
        prev[0].content.startsWith('Привет,')
      ) {
        const w = { ...prev[0], content: welcomeContent };
        messagesRef.current = [w];
        return [w];
      }
      return prev;
    });
  }, [userFirstName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;

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

    try {
      const emotionScores = await analyzeEmotions(text);
      setEmotions(emotionScores);
      setOverallMood(deriveOverallMood(emotionScores));

      const historyForAi = afterUser.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const replyText = await getPsychologistReply(historyForAi);

      setMessages((cur) => {
        const next = [
          ...cur,
          {
            role: 'assistant',
            content: replyText,
            time: format(new Date(), 'HH:mm'),
          },
        ];
        messagesRef.current = next;
        return next;
      });

      await onSentRef.current?.(text);
    } catch (e) {
      console.error(e);
      setMessages((cur) => {
        const next = [
          ...cur,
          {
            role: 'assistant',
            content:
              'Сейчас не удалось связаться с ассистентом. Я всё равно рядом — попробуй написать ещё раз чуть позже.',
            time: format(new Date(), 'HH:mm'),
          },
        ];
        messagesRef.current = next;
        return next;
      });
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [input]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    loading,
    emotions,
    overallMood,
    messagesEndRef,
  };
}
