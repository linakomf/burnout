import api from './api';
import { format } from 'date-fns';

export function todaySessionDate() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function normalizeChatMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role,
      content: m.content.trim(),
      time: typeof m.time === 'string' ? m.time : undefined,
      cards: Array.isArray(m.cards)
        ? m.cards.map((c) => ({
            type: c.type,
            title: c.title,
            subtitle: c.subtitle,
            description: c.description,
            image: c.image,
            path: c.path,
          }))
        : undefined,
    }))
    .filter((m) => m.content.length > 0);
}

export async function loadDiaryChatSession(date = todaySessionDate()) {
  const res = await api.get('/diary/chat-session', { params: { date } });
  const messages = normalizeChatMessages(res.data?.messages);
  return {
    entryId: res.data?.entry_id ?? null,
    sessionDate: res.data?.session_date ?? date,
    messages,
  };
}

export async function saveDiaryChatSession(date, messages, extras = {}) {
  const payload = {
    date,
    messages: normalizeChatMessages(messages),
    mood: extras.mood,
    mood_score: extras.mood_score,
  };
  const res = await api.put('/diary/chat-session', payload);
  return res.data;
}
