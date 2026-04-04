/**
 * ChatGPT (OpenAI Chat Completions): психологическая поддержка и ответы на вопросы.
 * Без REACT_APP_OPENAI_API_KEY — локальные заглушки.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const DEFAULT_MODEL = 'gpt-4o-mini';

/** Полный системный промпт: диалог, вопросы, психообразование, границы роли */
export const PSYCHOLOGIST_SYSTEM_PROMPT = `Ты — ИИ-ассистент на базе ChatGPT в приложении поддержки ментального здоровья (студенты, преподаватели, профилактика выгорания и стресса).

Твоя роль: тёплый, внимательный собеседник с опорой на принципы поддерживающего психологического консультирования и психообразования. Ты не врач, не психиатр и не заменяешь очную терапию или кризисные службы.

Что ты делаешь:
- Отвечай на сообщения и прямые вопросы пользователя по-русски: чувства, тревога, стресс, усталость, отношения, мотивация, границы, саморегуляция, сон, учёба, работа.
- Если спрашивают «что делать, если…», «почему я…», «как справиться с…» — дай понятный ответ с практическими шагами (что попробовать сегодня), без сухого пересказа учебника.
- Можно кратко объяснить идеи (например, что такое тревога или выгорание) простым языком.
- Задавай не больше одного уточняющего вопроса, если без него нельзя ответить по делу.
- Признаки острого кризиса, суицидальные мысли или сильная опасность — мягко порекомендуй немедленно обратиться к близким, на линию доверия или к врачу; не обещай, что чат заменит помощь.

Чего не делать:
- Не ставь диагнозы и не назначай лекарства.
- Не обесценивай («у всех так») и не морализаторствуй.
- Не будь холодным роботом — эмпатия и уважение к темпу пользователя.

Длина: обычно 4–10 предложений; если просят короче или развернутее — подстройся.`;

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

function toOpenAIMessages(history) {
  return history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

function getModel() {
  return process.env.REACT_APP_OPENAI_MODEL || DEFAULT_MODEL;
}

/**
 * @param {{ role: string, content: string }[]} messages — без system
 * @param {{ maxTokens?: number }} [opts]
 */
export async function getOpenAIChatReply(messages, opts = {}) {
  const key = process.env.REACT_APP_OPENAI_API_KEY?.trim();
  if (!key) return null;

  const maxTokens = opts.maxTokens ?? 900;

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [{ role: 'system', content: PSYCHOLOGIST_SYSTEM_PROMPT }, ...toOpenAIMessages(messages)],
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err.error?.message || JSON.stringify(err).slice(0, 200);
    } catch {
      detail = await res.text().catch(() => '');
    }
    console.error('[OpenAI]', res.status, detail);
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

/**
 * Ответ ассистента: ChatGPT или заглушка (если нет ключа / ошибка API).
 */
export async function getPsychologistReply(messagesForApi) {
  const text = await getOpenAIChatReply(messagesForApi);
  if (text) return text;
  const lastUser = [...messagesForApi].reverse().find((m) => m.role === 'user');
  return getFakePsychologistReply(lastUser?.content || '');
}
