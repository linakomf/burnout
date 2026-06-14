import api from '../utils/api';
import {
  buildLocalAlternativeReply,
  detectRecommendationRejection,
  preferTypesAfterRejection,
} from '../utils/aiChatRejection';

const FAKE_REPLIES = {
  greeting: [
    'Привет! 🌿 Как вы себя сегодня чувствуете?',
    'Здравствуйте! Я рядом и готов выслушать вас. Чем хотите поделиться сегодня?',
    'Рад вас видеть 😊 Как проходит ваш день?',
    'Добро пожаловать! Расскажите, что сейчас у вас на душе.'
  ],

  stress: [
    'Похоже, сейчас у вас непростой период. Постарайтесь дать себе немного времени на отдых.',
    'Большая нагрузка действительно может вызывать стресс. Попробуйте сосредоточиться на одной задаче за раз.',
    'Спасибо, что поделились своими переживаниями. Иногда даже короткий перерыв помогает восстановить силы.'
  ],

  anxiety: [
    'Мне жаль, что вы испытываете тревогу. Постарайтесь сосредоточиться на том, что находится под вашим контролем.',
    'Тревожность может возникать в периоды высокой неопределённости. Сделайте несколько глубоких вдохов и дайте себе немного времени.',
    'Ваши переживания важны. Попробуйте переключиться на спокойное занятие или небольшую прогулку.'
  ],

  burnout: [
    'Похоже, вы сильно устали. Не забывайте, что отдых — это тоже важная часть продуктивности.',
    'Эмоциональное истощение часто появляется после длительной нагрузки. Постарайтесь выделить время на восстановление.',
    'Спасибо, что поделились своим состоянием. Сейчас важно позаботиться о себе и снизить нагрузку, если это возможно.'
  ],

  thanks: [
    'Пожалуйста 🌿 Берегите себя.',
    'Рад был помочь. Желаю вам спокойного дня.',
    'Спасибо за доверие. Если захотите поделиться своими мыслями, я всегда готов выслушать.'
  ],

  music: ['Возможно, сейчас вам поможет спокойная музыкальная подборка для расслабления.'],
  books: ['Попробуйте уделить немного времени чтению одной из рекомендованных книг.'],
  practices: ['Сейчас может быть полезна короткая дыхательная практика или медитация.'],
  films: ['Для отдыха и переключения внимания можно посмотреть фильм из рекомендованной подборки.'],

  question: [
    'Хороший вопрос. В таких ситуациях часто помогает сначала назвать чувство, потом выбрать один маленький шаг на сегодня. О чём именно хочешь поговорить подробнее?',
    'Чтобы ответить точнее: что для тебя сейчас самое тяжёлое - тело, мысли или отношения с людьми?'
  ],

  neutral: [
    'Спасибо, что делишься. Я здесь, чтобы слушать без оценки. Что для тебя сейчас главное?',
    'Расскажи чуть подробнее: что происходит внутри, если назвать это одним-двумя словами?',
    'Ты уже сделал(а) шаг, написав это. Что бы ты хотел(а), чтобы изменилось в ближайшие дни?'
  ]
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function classifyForFake(text) {
  const t = text.toLowerCase().trim();
  if (/^(привет|здравств|добр(ый|ое|ая)|hi|hello|hey)[!.?\s🌿😊]*$/i.test(t)) return 'greeting';
  if (/^(спасибо|благодар|thank you|thanks)[!.?\s🌿]*$|большое спасибо|очень спасибо/i.test(t)) return 'thanks';
  if (/\?|почему|как |что делать|совет|помоги|расскажи|объясни/i.test(t)) return 'question';
  if (/музык|плейлист|песн/i.test(t)) return 'music';
  if (/книг|чтени|читать/i.test(t)) return 'books';
  if (/практик|медитац|дыхат|йог/i.test(t)) return 'practices';
  if (/фильм|кино|сериал/i.test(t)) return 'films';
  if (/стресс|нагруз|не справ|давлен/i.test(t)) return 'stress';
  if (/тревог|боюсь|страшно|волнуюсь|паник|нерв/i.test(t)) return 'anxiety';
  if (/выгоран|устал|сил нет|истощ/i.test(t)) return 'burnout';
  return 'neutral';
}

export function getFakePsychologistReply(userText) {
  const bucket = classifyForFake(userText);
  return pick(FAKE_REPLIES[bucket] || FAKE_REPLIES.neutral);
}

function toApiMessages(history) {
  return history.
  filter((m) => m.role === 'user' || m.role === 'assistant').
  map((m) => ({ role: m.role, content: m.content }));
}

async function getServerPsychologistReply(messages, context = {}) {
  const payload = {
    messages: toApiMessages(messages).slice(-20),
    context: {
      previousCardTypes: context.previousCardTypes || [],
    },
  };
  const res = await api.post('/ai/chat', payload);
  return {
    reply: res?.data?.reply?.trim() || null,
    cardHints: res?.data?.cardHints || null,
  };
}

export async function getPsychologistReplyResult(messagesForApi, context = {}) {
  try {
    const { reply, cardHints } = await getServerPsychologistReply(messagesForApi, context);
    if (reply) return { reply, cardHints };
  } catch (err) {
    console.error('[AI chat]', err?.response?.data || err?.message || err);
  }
  const lastUser = [...messagesForApi].reverse().find((m) => m.role === 'user');
  const userText = lastUser?.content || '';
  const rejection = detectRecommendationRejection(userText, context.previousCardTypes || []);
  if (rejection.isRejection) {
    const preferTypes = preferTypesAfterRejection(rejection.rejectedTypes);
    return {
      reply: buildLocalAlternativeReply(rejection.rejectedTypes, preferTypes),
      cardHints: {
        showCards: preferTypes.length > 0,
        themes: [],
        interests: [],
        excludeTypes: rejection.rejectedTypes,
        preferTypes,
        isAlternative: true,
      },
    };
  }
  return {
    reply: getFakePsychologistReply(userText),
    cardHints: null,
  };
}

export async function getPsychologistReply(messagesForApi) {
  const { reply } = await getPsychologistReplyResult(messagesForApi);
  return reply;
}