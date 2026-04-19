import api from '../utils/api';

const FAKE_REPLIES = {
  stress: [
    'Слышу, как много на тебе сейчас. Попробуй на 2 минуты замедлить дыхание: вдох на 4, выдох на 6. Ты не обязан(а) справляться идеально.',
    'Усталость и давление — сигнал, что телу нужна пауза. Что одно маленькое действие ты можешь сделать для себя сегодня, без героизма?',
    'Когда всё сжимается, полезно назвать чувство вслух или написать его. Я рядом: расскажи, что больше всего давит?',
  ],
  anxiety: [
    'Тревога часто шепчет катастрофы. Опиши факт, а не страх: что произошло на самом деле? Я с тобой.',
    'Ты не один(а) с этим чувством. Можем разобрать по шагам: что сейчас в твоей власти изменить хотя бы чуть-чуть?',
    'Дыши медленнее, плечи опусти. Тревога — волна, она отступает. Что помогает тебе чувствовать опору?',
  ],
  joy: [
    'Как приятно слышать светлую ноту в твоих словах. Поддержи это: что именно дало этот заряд?',
    'Радость — тоже ресурс. Запомни этот момент: он пригодится в более тяжёлые дни.',
    'Ты замечаешь хорошее — это сила. Хочешь поделиться, что сегодня особенно порадовало?',
  ],
  question: [
    'Хороший вопрос. В таких ситуациях часто помогает сначала назвать чувство, потом выбрать один маленький шаг на сегодня. О чём именно хочешь поговорить подробнее?',
    'Чтобы ответить точнее: что для тебя сейчас самое тяжёлое — тело, мысли или отношения с людьми?',
  ],
  neutral: [
    'Спасибо, что делишься. Я здесь, чтобы слушать без оценки. Что для тебя сейчас главное?',
    'Расскажи чуть подробнее: что происходит внутри, если назвать это одним-двумя словами?',
    'Ты уже сделал(а) шаг, написав это. Что бы ты хотел(а), чтобы изменилось в ближайшие дни?',
    'Я рядом. Иногда полезно просто выговориться — продолжай в своём темпе.',
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function classifyForFake(text) {
  const t = text.toLowerCase();
  if (/\?|почему|как |что делать|совет|помоги|расскажи|объясни/i.test(t)) return 'question';
  if (/стресс|устал|дедлайн|выгор|не успева|много дел|раздраж/i.test(t)) return 'stress';
  if (/тревог|боюсь|страшно|волнуюсь|паник|нерв/i.test(t)) return 'anxiety';
  if (/рад|счастлив|класс|отлично|хорошо|люблю|весел/i.test(t)) return 'joy';
  return 'neutral';
}

export function getFakePsychologistReply(userText) {
  const bucket = classifyForFake(userText);
  return pick(FAKE_REPLIES[bucket] || FAKE_REPLIES.neutral);
}

function toApiMessages(history) {
  return history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

async function getServerPsychologistReply(messages) {
  const payload = {
    messages: toApiMessages(messages).slice(-20),
  };
  const res = await api.post('/ai/chat', payload);
  return res?.data?.reply?.trim() || null;
}

/**
 * Ответ ассистента: приоритет — backend AI, fallback — локальная заглушка.
 */
export async function getPsychologistReply(messagesForApi) {
  try {
    const text = await getServerPsychologistReply(messagesForApi);
    if (text) return text;
  } catch (err) {
    console.error('[AI chat]', err?.response?.data || err?.message || err);
  }
  const lastUser = [...messagesForApi].reverse().find((m) => m.role === 'user');
  return getFakePsychologistReply(lastUser?.content || '');
}
