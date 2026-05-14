const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_HISTORY = 20;
const MAX_INPUT_CHARS = Number(process.env.AI_MAX_INPUT_CHARS || 2000);
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 15000);
const SESSION_TTL_MS = Number(process.env.AI_SESSION_TTL_MS || 1000 * 60 * 60 * 24);

const sessionMemory = new Map();

const SYSTEM_PROMPT = [
'Ты ИИ-помощник по ментальному здоровью в приложении.',
'Отвечай только на темы: выгорание, тревожность, грусть, стресс, усталость, сон, эмоциональная саморегуляция.',
'Стиль: по-человечески, тепло, без сложной терминологии, 4-10 предложений, 2-4 практических шага.',
'Помогай разбирать заметки о дне: что произошло, какие были мысли, эмоции, триггеры, что повлияло и какой следующий шаг.',
'Нельзя ставить диагнозы, назначать лекарства, обещать излечение.',
'При признаках острого кризиса или суицидальных мыслях советуй срочно обратиться за очной помощью.',
'Если вопрос не по теме ментального здоровья, вежливо верни пользователя к теме приложения.'].
join(' ');

const FEW_SHOT_MESSAGES = [
{ role: 'user', content: 'Я постоянно тревожусь перед учебой и не могу уснуть' },
{
  role: 'assistant',
  content:
  'Похоже, у вас накопилось много напряжения, и это правда выматывает. Давайте мягко снизим накал: 2-3 минуты дыхания с длинным выдохом (вдох 4, выдох 6), затем выпишите на листе 3 учебные задачи и выберите только одну на ближайшие 25 минут. Так мозг перестает держать все в голове сразу. Если хотите, помогу выбрать самый легкий первый шаг.'
},
{ role: 'user', content: 'Мне страшно, что я ничего не успею' },
{
  role: 'assistant',
  content:
  'Этот страх понятен, когда задач много. Сейчас важно вернуть ощущение управляемости: разделите дела на “сегодня обязательно / можно позже”, потом начните с самого короткого пункта на 10-15 минут. Не нужно решить все за раз - достаточно запустить движение. Что из дел можно сделать первым, самым маленьким шагом?'
}];


const TOPIC_RE = /выгоран|трев|груст|депресс|стресс|паник|устал|эмоци|сон|страх|тос|настроен|психол|поддерж|самооцен|саморегул|отношен|мотивац|беспокой|учеб|экзамен|сесси|дедлайн|дневник|заметк|проанализ|почему так|злост|злюс|гнев|раздраж|бесит/i;
const CRISIS_RE = /суицид|поконч|самоубий|вскрыт|не хочу жить|хочу умереть|навредить себе|самоповреж|убить себя/i;
const DIARY_RE = /дневник|заметк|проанализ|анализ дня|почему так|что повлияло|разобрать день|разбор дня/i;
const ACK_RE = /^(да|давай|ок|окей|угу|ага|хорошо|понял|поняла|согласен|согласна)$/i;

const EMPATHY_OPENERS = [
'Спасибо, что написали об этом. Вас правда можно понять.',
'Слышу, как вам тяжело сейчас, и это важно.',
'Вы не один(одна) с этим состоянием, спасибо за доверие.',
'Понимаю, что сейчас внутри много напряжения.'];


const GUIDANCE_BY_THEME = {
  anxiety: [
  'Когда накрывает тревога, помогает короткая опора: назовите 5 вещей, которые видите, 4 звука и 3 телесных ощущения.',
  'Попробуйте технику "медленный выдох": вдох на 4, выдох на 6, 2-3 минуты подряд - это мягко снижает внутренний накал.',
  'Полезно вынести тревожную мысль на бумагу и рядом написать более реалистичный вариант, чтобы вернуть чувство контроля.'],

  sleep: [
  'Перед сном сделайте "тихий режим": 30 минут без новостей и переписок, приглушенный свет и спокойный ритм.',
  'Если не получается уснуть, не ругайте себя: встаньте на 5 минут, подышите, выпейте теплой воды и снова ложитесь.',
  'Для засыпания помогает короткий ритуал: один и тот же порядок действий каждый вечер, чтобы мозг считывал сигнал "пора спать".'],

  burnout: [
  'Если это похоже на перегруз, на сегодня достаточно одного посильного шага и одной короткой паузы на восстановление.',
  'При выгорании лучше снижать планку до "минимума, который реально выполнить", а не пытаться закрыть все сразу.'],

  sadness: [
  'Когда много грусти, начните с очень простого контакта с телом: теплый напиток, душ или 10 минут спокойной прогулки.',
  'Попробуйте назвать чувство точнее: грусть, пустота, усталость или страх - это уже снижает внутреннюю неопределенность.'],

  anger: [
  'Если много злости, сначала лучше безопасно разрядить напряжение телом: пройтись быстрым шагом 7-10 минут или сделать 20-30 активных движений.',
  'Помогает короткая пауза перед реакцией: три медленных выдоха и фраза "я отвечу, когда немного остыну".',
  'Попробуйте разделить: что именно вас задело (факт), и что вы в этот момент подумали - это снижает импульсивность.'],

  study: [
  'Если тревога связана с учебой, попробуйте разложить ее на 3 части: дедлайн, объем задач и страх оценки - так становится яснее, с чего начать.',
  'Сделайте мини-план на 25 минут: одна конкретная задача, затем 5 минут перерыв - это снижает ощущение хаоса.',
  'Полезно начать с самого простого пункта, чтобы получить ощущение движения, а не ждать идеального состояния.'],

  generic: [
  'Давайте начнем с малого: три медленных выдоха, затем один посильный шаг на ближайшие 10 минут.',
  'Сейчас лучше выбрать маленькое действие, чем требовать от себя "сразу все исправить".']

};

const FOLLOW_UPS = {
  study: [
  'Что в учебе сейчас пугает больше: объем, дедлайны или страх плохой оценки?',
  'Хотите, я помогу собрать очень короткий план на сегодняшний вечер по учебе?'],

  sleep: [
  'Во сколько обычно начинается самая сильная тревога перед сном?',
  'Хотите, подберем для вас простой вечерний ритуал на 15 минут?'],

  anxiety: [
  'Когда тревога усиливается сильнее всего: утром, днем или ночью?',
  'Что сейчас пугает больше всего в этой ситуации?'],

  anger: [
  'Что именно сильнее всего разозлило вас сегодня: событие, человек или ощущение несправедливости?',
  'В теле злость сейчас где ощущается сильнее: челюсть, грудь, плечи или живот?'],

  sadness: [
  'Что в этом дне было самым тяжёлым моментом?',
  'Хотите, вместе разберем, что именно повлияло на это состояние?'],

  generic: [
  'Если хотите, можем разобрать вашу ситуацию по шагам и выбрать самый легкий первый шаг.',
  'Если удобно, напишите, что сейчас давит сильнее всего, и я помогу структурировать это.']

};

function pickBySeed(items, seedText) {
  if (!items.length) return '';
  const sum = String(seedText || '').
  split('').
  reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return items[sum % items.length];
}

function pickNotRepeated(items, seedText, avoidText) {
  if (!items.length) return '';
  const startIdx =
  String(seedText || '').
  split('').
  reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % items.length;
  for (let i = 0; i < items.length; i += 1) {
    const candidate = items[(startIdx + i) % items.length];
    if (!avoidText || !avoidText.includes(candidate)) return candidate;
  }
  return items[startIdx];
}

function isShortAnswer(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return false;
  const words = trimmed.split(/\s+/).filter(Boolean);
  return trimmed.length <= 40 || words.length <= 4;
}

function isAckMessage(text) {
  return ACK_RE.test(String(text || '').trim());
}

function detectThemes(contextText) {
  const text = String(contextText || '').toLowerCase();
  return {
    study: /учеб|экзамен|сесси|дедлайн|зачет|урок|универ|колледж/i.test(text),
    sleep: /сон|не могу спать|бессон|ноч|уснуть|просып/i.test(text),
    anxiety: /трев|страх|паник|беспокой|напряж/i.test(text),
    burnout: /выгоран|устал|сил нет|нет сил|перегруз/i.test(text),
    sadness: /груст|пустот|тоск|подавлен|апати/i.test(text),
    anger: /злост|злюс|гнев|раздраж|бесит|в бешенстве|в ярости/i.test(text),
    badDay: /плохой день|тяжелый день|тяжёлый день|день не задался|ужасный день/i.test(text)
  };
}

function cleanupMemory(now = Date.now()) {
  for (const [userId, entry] of sessionMemory.entries()) {
    if (!entry || now - entry.updatedAt > SESSION_TTL_MS) {
      sessionMemory.delete(userId);
    }
  }
}

function buildSessionSummary(messages) {
  const recentUsers = messages.
  filter((m) => m.role === 'user').
  slice(-6).
  map((m) => m.content).
  join(' ');
  const themes = detectThemes(recentUsers);
  const tags = [];
  if (themes.study) tags.push('учебная тревога');
  if (themes.sleep) tags.push('сон');
  if (themes.anxiety) tags.push('тревога');
  if (themes.burnout) tags.push('перегруз');
  if (themes.sadness) tags.push('грусть');
  if (themes.anger) tags.push('злость');
  if (themes.badDay) tags.push('тяжелый день');
  return tags.length ? `Текущий контекст: ${tags.join(', ')}.` : '';
}

function buildDiaryAnalysisReply(userText, lastAssistant = '') {
  const intro =
  isShortAnswer(userText) && /учеб|работ|отнош|дом|семья|сон/i.test(userText) ?
  `Принял(а): "${String(userText).trim()}". Давайте разберем это спокойно и по шагам.` :
  'Давайте разберем ваш день спокойно и без самокритики.';
  const guidance =
  'Напишите коротко по 5 пунктам: 1) что произошло, 2) какие мысли были в моменте, 3) какие эмоции (0-10), 4) что усилило состояние, 5) что даже немного помогло.';
  const close =
  'После этого я помогу сделать вывод: почему так произошло и какой 1 маленький шаг стоит попробовать завтра.';

  const merged = [intro, guidance, close].join(' ');
  if (lastAssistant && merged.trim() === lastAssistant.trim()) {
    return 'Хорошая идея пойти в анализ. Начнем с простого: что было главным событием дня, какую мысль вы тогда себе сказали и какая эмоция была самой сильной по шкале 0-10? Я помогу связать это с триггерами.';
  }
  return merged;
}

function prioritizeThemes(currentThemes, contextThemes) {
  const order = ['anger', 'study', 'sleep', 'anxiety', 'burnout', 'sadness', 'generic'];
  const selected = [];
  for (const key of order) {
    if (key !== 'generic' && currentThemes[key]) selected.push(key);
  }
  if (!selected.length && currentThemes.badDay) selected.push('sadness');
  if (!selected.length) {
    for (const key of order) {
      if (key !== 'generic' && contextThemes[key]) selected.push(key);
    }
  }
  if (!selected.length && contextThemes.badDay) selected.push('sadness');
  if (!selected.length) selected.push('generic');
  return selected;
}

function buildLocalSupportReply(messages, userText) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
  if (DIARY_RE.test(String(userText || '').toLowerCase())) {
    return buildDiaryAnalysisReply(userText, lastAssistant);
  }
  if (/плохой день|тяжелый день|тяжёлый день|день не задался|ужасный день/i.test(String(userText || '').toLowerCase())) {
    return buildDiaryAnalysisReply(
      'плохой день',
      lastAssistant
    );
  }
  const recentUserText = messages.
  filter((m) => m.role === 'user').
  slice(-4).
  map((m) => m.content).
  join(' ');
  const currentThemes = detectThemes(userText);
  const contextThemes = detectThemes(recentUserText);

  const selectedThemes = prioritizeThemes(currentThemes, contextThemes);

  const primaryTheme = selectedThemes[0];
  const isAck = isAckMessage(userText);
  const opener = isAck ?
  'Давайте спокойно продолжим.' :
  isShortAnswer(userText) ?
  `Спасибо, что уточнили: "${String(userText).trim()}".` :
  pickNotRepeated(EMPATHY_OPENERS, userText, lastAssistant);

  const firstGuidance = pickNotRepeated(GUIDANCE_BY_THEME[primaryTheme], `${userText}-g1`, lastAssistant);

  const secondaryTheme = selectedThemes.find((t) => t !== primaryTheme && t !== 'generic');
  const secondGuidance = secondaryTheme ?
  pickNotRepeated(GUIDANCE_BY_THEME[secondaryTheme], `${userText}-g2`, lastAssistant) :
  '';

  const followUp = pickNotRepeated(
    FOLLOW_UPS[primaryTheme] || FOLLOW_UPS.generic,
    `${userText}-f`,
    lastAssistant
  );

  const replyParts = isAck ?
  [opener, followUp] :
  [opener, firstGuidance, secondGuidance, followUp];
  const reply = replyParts.filter(Boolean).join(' ');
  if (lastAssistant && reply.trim() === lastAssistant.trim()) {
    const altGuidance = pickBySeed(GUIDANCE_BY_THEME.generic, `${userText}-alt`);
    return [opener, altGuidance, followUp].filter(Boolean).join(' ');
  }
  return reply;
}

function isMentalHealthContext(messages) {
  const recentUserText = messages.
  filter((m) => m.role === 'user').
  slice(-4).
  map((m) => m.content).
  join(' ');
  return TOPIC_RE.test(recentUserText);
}

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];
  return rawMessages.
  filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').
  map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_INPUT_CHARS) })).
  filter((m) => m.content.length > 0).
  slice(-MAX_HISTORY);
}

async function getOpenAIReply(messages, sessionSummary = '') {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  let response;
  try {
    const promptMessages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (sessionSummary) promptMessages.push({ role: 'system', content: sessionSummary });
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.72,
        max_tokens: 800,
        messages: [...promptMessages, ...FEW_SHOT_MESSAGES, ...messages]
      })
    });
  } catch (err) {
    const isAbort = err?.name === 'AbortError';
    console.error('[AI] OpenAI fetch error:', isAbort ? 'timeout' : err?.message || err);
    return null;
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[AI] OpenAI error:', response.status, detail.slice(0, 300));
    return null;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    cleanupMemory();
    const messages = sanitizeMessages(req.body?.messages);
    if (!messages.length) {
      return res.status(400).json({ message: 'Передайте непустую историю сообщений.' });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) {
      return res.status(400).json({ message: 'Не найдено сообщение пользователя.' });
    }

    if (lastUser.content.length > MAX_INPUT_CHARS) {
      return res.status(400).json({ message: `Слишком длинное сообщение (до ${MAX_INPUT_CHARS} символов).` });
    }

    if (!isMentalHealthContext(messages)) {
      return res.json({
        reply:
        'Я работаю только с темами ментального здоровья: выгорание, тревога, стресс, грусть, сон и эмоциональная поддержка. Опишите, пожалуйста, что вы чувствуете, и я помогу.',
        source: 'guardrail'
      });
    }

    if (CRISIS_RE.test(lastUser.content)) {
      return res.json({
        reply:
        'Спасибо, что честно написали об этом. Такие мысли нельзя оставлять без живой помощи - пожалуйста, срочно обратитесь к психологу/психотерапевту или в экстренную службу вашей страны и сообщите близкому человеку, что вам сейчас нужна поддержка. Наше приложение рядом для сопровождения, но в такой ситуации очная помощь обязательна и приоритетна.',
        source: 'crisis'
      });
    }

    const userId = req.user?.user_id || 'anon';
    const existingSummary = sessionMemory.get(userId)?.summary || '';
    const heuristicSummary = buildSessionSummary(messages);
    const sessionSummary = [existingSummary, heuristicSummary].filter(Boolean).join(' ');

    const reply = await getOpenAIReply(messages, sessionSummary);
    if (!reply) {
      return res.json({
        reply: buildLocalSupportReply(messages, lastUser.content),
        source: 'fallback-local-support'
      });
    }

    sessionMemory.set(userId, {
      summary: buildSessionSummary([...messages, { role: 'assistant', content: reply }]),
      updatedAt: Date.now()
    });

    return res.json({ reply, source: 'openai', model: DEFAULT_MODEL });
  } catch (err) {
    console.error('[AI] route error:', err?.message || err);
    return res.status(500).json({ message: 'Ошибка AI-сервиса. Попробуйте чуть позже.' });
  }
});

module.exports = router;