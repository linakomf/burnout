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
    sub: 'Эмоции ровные. Стресс не превышает норму.',
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
