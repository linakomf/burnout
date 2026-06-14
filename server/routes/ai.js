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
'Если вопрос не по теме ментального здоровья, вежливо верни пользователя к теме приложения.',
'Используй формулировки из сценария ниже: выбирай подходящий вариант по ситуации, не смешивай несколько вариантов одного типа в одном ответе.'].
join(' ');

const SCENARIO_REFERENCE = [
'### Сценарий ответов',
'',
'Приветствие (если пользователь только поздоровался):',
'1) «Привет! 🌿 Как вы себя сегодня чувствуете?»',
'2) «Здравствуйте! Я рядом и готов выслушать вас. Чем хотите поделиться сегодня?»',
'3) «Рад вас видеть 😊 Как проходит ваш день?»',
'4) «Добро пожаловать! Расскажите, что сейчас у вас на душе.»',
'',
'Поддержка при стрессе:',
'1) «Похоже, сейчас у вас непростой период. Постарайтесь дать себе немного времени на отдых.»',
'2) «Большая нагрузка действительно может вызывать стресс. Попробуйте сосредоточиться на одной задаче за раз.»',
'3) «Спасибо, что поделились своими переживаниями. Иногда даже короткий перерыв помогает восстановить силы.»',
'',
'При тревожности:',
'1) «Мне жаль, что вы испытываете тревогу. Постарайтесь сосредоточиться на том, что находится под вашим контролем.»',
'2) «Тревожность может возникать в периоды высокой неопределённости. Сделайте несколько глубоких вдохов и дайте себе немного времени.»',
'3) «Ваши переживания важны. Попробуйте переключиться на спокойное занятие или небольшую прогулку.»',
'',
'При усталости и выгорании:',
'1) «Похоже, вы сильно устали. Не забывайте, что отдых — это тоже важная часть продуктивности.»',
'2) «Эмоциональное истощение часто появляется после длительной нагрузки. Постарайтесь выделить время на восстановление.»',
'3) «Спасибо, что поделились своим состоянием. Сейчас важно позаботиться о себе и снизить нагрузку, если это возможно.»',
'',
'Рекомендации по интересам (добавляй, если уместно):',
'- музыка: «Возможно, сейчас вам поможет спокойная музыкальная подборка для расслабления.»',
'- книги: «Попробуйте уделить немного времени чтению одной из рекомендованных книг.»',
'- практики: «Сейчас может быть полезна короткая дыхательная практика или медитация.»',
'- фильмы: «Для отдыха и переключения внимания можно посмотреть фильм из рекомендованной подборки.»',
'',
'На благодарность:',
'1) «Пожалуйста 🌿 Берегите себя.»',
'2) «Рад был помочь. Желаю вам спокойного дня.»',
'3) «Спасибо за доверие. Если захотите поделиться своими мыслями, я всегда готов выслушать.»',
'',
'Если пользователь отклоняет рекомендацию (не хочу музыку/медитацию/фильм и т.д.):',
'- Примите отказ без давления.',
'- Предложите другой формат отдыха (подкаст, статья, фильм, музыка — что не было отклонено).',
'- Не повторяйте тот же тип рекомендации в этом ответе.'
].join('\n');

const GREETING_RESPONSES = [
'Привет! 🌿 Как вы себя сегодня чувствуете?',
'Здравствуйте! Я рядом и готов выслушать вас. Чем хотите поделиться сегодня?',
'Рад вас видеть 😊 Как проходит ваш день?',
'Добро пожаловать! Расскажите, что сейчас у вас на душе.'];

const STRESS_SUPPORT_RESPONSES = [
'Похоже, сейчас у вас непростой период. Постарайтесь дать себе немного времени на отдых.',
'Большая нагрузка действительно может вызывать стресс. Попробуйте сосредоточиться на одной задаче за раз.',
'Спасибо, что поделились своими переживаниями. Иногда даже короткий перерыв помогает восстановить силы.'];

const ANXIETY_SUPPORT_RESPONSES = [
'Мне жаль, что вы испытываете тревогу. Постарайтесь сосредоточиться на том, что находится под вашим контролем.',
'Тревожность может возникать в периоды высокой неопределённости. Сделайте несколько глубоких вдохов и дайте себе немного времени.',
'Ваши переживания важны. Попробуйте переключиться на спокойное занятие или небольшую прогулку.'];

const BURNOUT_SUPPORT_RESPONSES = [
'Похоже, вы сильно устали. Не забывайте, что отдых — это тоже важная часть продуктивности.',
'Эмоциональное истощение часто появляется после длительной нагрузки. Постарайтесь выделить время на восстановление.',
'Спасибо, что поделились своим состоянием. Сейчас важно позаботиться о себе и снизить нагрузку, если это возможно.'];

const THANK_YOU_RESPONSES = [
'Пожалуйста 🌿 Берегите себя.',
'Рад был помочь. Желаю вам спокойного дня.',
'Спасибо за доверие. Если захотите поделиться своими мыслями, я всегда готов выслушать.'];

const RECOMMENDATIONS_BY_INTEREST = {
  music: 'Возможно, сейчас вам поможет спокойная музыкальная подборка для расслабления.',
  books: 'Попробуйте уделить немного времени чтению одной из рекомендованных книг.',
  practices: 'Сейчас может быть полезна короткая дыхательная практика или медитация.',
  films: 'Для отдыха и переключения внимания можно посмотреть фильм из рекомендованной подборки.'
};

const GREETING_RE = /^(привет|здравствуйте|здравствуй|добрый день|доброе утро|добрый вечер|добро пожаловать|hi|hello|hey)[!.?\s🌿😊]*$/i;
const THANKS_RE = /^(спасибо|благодарю|thank you|thanks)[!.?\s🌿]*$|большое спасибо|очень спасибо/i;

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


const TOPIC_RE = /выгоран|трев|груст|депресс|стресс|паник|устал|эмоци|сон|страх|тос|настроен|психол|поддерж|самооцен|саморегул|отношен|мотивац|беспокой|учеб|экзамен|сесси|дедлайн|дневник|заметк|проанализ|почему так|злост|злюс|гнев|раздраж|бесит|привет|здравств|добр(ый|ое|ая)|спасибо|благодар/i;
const CRISIS_RE = /суицид|поконч|самоубий|вскрыт|не хочу жить|хочу умереть|навредить себе|самоповреж|убить себя/i;
const DIARY_RE = /дневник|заметк|проанализ|анализ дня|почему так|что повлияло|разобрать день|разбор дня/i;
const ACK_RE = /^(да|давай|ок|окей|угу|ага|хорошо|понял|поняла|согласен|согласна)$/i;

const CHAT_CARD_TYPE_PRIORITY = ['podcast', 'article', 'book', 'film', 'music', 'meditation', 'event'];

const REJECTION_SIGNAL_RE =
/не хочу|не буду|не надо|не интерес|не подход|не сейчас|не мо[её]|не нрав|не помог|бесполез|отказыва|не могу слушать|не буду слушать|не хочу слушать|не хочу смотреть|не хочу читать|не хочу медит|не буду медит|не хочу заним/i;

const ALTERNATIVE_SIGNAL_RE =
/другое|другой|другую|другие|иначе|ещё|еще|что.?нибудь|предлож|вариант|альтернатив/i;

const GENERAL_NO_RE = /^(нет|не|неа|no)[!.?\s🌿]*$|^не хочу[!.?\s🌿]*$/i;

const EMPATHY_OPENERS = [
'Спасибо, что написали об этом. Вас правда можно понять.',
'Слышу, как вам тяжело сейчас, и это важно.',
'Вы не один(одна) с этим состоянием, спасибо за доверие.',
'Понимаю, что сейчас внутри много напряжения.'];


const GUIDANCE_BY_THEME = {
  stress: STRESS_SUPPORT_RESPONSES,

  anxiety: [
  ...ANXIETY_SUPPORT_RESPONSES,
  'Когда накрывает тревога, помогает короткая опора: назовите 5 вещей, которые видите, 4 звука и 3 телесных ощущения.',
  'Попробуйте технику "медленный выдох": вдох на 4, выдох на 6, 2-3 минуты подряд - это мягко снижает внутренний накал.'],

  sleep: [
  'Перед сном сделайте "тихий режим": 30 минут без новостей и переписок, приглушенный свет и спокойный ритм.',
  'Если не получается уснуть, не ругайте себя: встаньте на 5 минут, подышите, выпейте теплой воды и снова ложитесь.',
  'Для засыпания помогает короткий ритуал: один и тот же порядок действий каждый вечер, чтобы мозг считывал сигнал "пора спать".'],

  burnout: [
  ...BURNOUT_SUPPORT_RESPONSES,
  'Если это похоже на перегруз, на сегодня достаточно одного посильного шага и одной короткой паузы на восстановление.'],

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

  stress: [
  'Что сейчас давит сильнее всего: объём задач, сроки или ожидания окружающих?',
  'Хотите, вместе выберем один самый посильный шаг на ближайший час?'],

  burnout: [
  'Когда вы в последний раз позволяли себе полноценный отдых без чувства вины?',
  'Что из нагрузки можно временно снизить или делегировать?'],

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

function isGreetingOnly(text) {
  return GREETING_RE.test(String(text || '').trim());
}

function isThankYouMessage(text) {
  return THANKS_RE.test(String(text || '').trim());
}

function detectInterests(text) {
  const t = String(text || '').toLowerCase();
  return {
    music: /музык|плейлист|песн|слушать/i.test(t),
    books: /книг|чтени|читать|стать/i.test(t),
    practices: /практик|медитац|дыхат|йог|упражнен/i.test(t),
    films: /фильм|кино|сериал|посмотрет/i.test(t)
  };
}

function pickInterestRecommendation(text) {
  const interests = detectInterests(text);
  const order = ['music', 'books', 'practices', 'films'];
  for (const key of order) {
    if (interests[key]) return RECOMMENDATIONS_BY_INTEREST[key];
  }
  return '';
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
    stress: /стресс|нагрузк|давлен|не справ|перегруж/i.test(text),
    burnout: /выгоран|устал|сил нет|нет сил|истощ/i.test(text),
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
  if (themes.stress) tags.push('стресс');
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
  const order = ['anger', 'study', 'sleep', 'anxiety', 'stress', 'burnout', 'sadness', 'generic'];
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

function explicitRejectedTypes(text) {
  const t = String(text || '').toLowerCase();
  const rejected = [];
  if (/музык|плейлист|песн|слушать/i.test(t)) rejected.push('music');
  if (/медитац|практик|дыхат|йог/i.test(t)) rejected.push('meditation');
  if (/книг|чтени|читать/i.test(t)) rejected.push('book');
  if (/стать/i.test(t)) rejected.push('article');
  if (/фильм|кино|сериал|смотрет/i.test(t)) rejected.push('film');
  if (/подкаст/i.test(t)) rejected.push('podcast');
  if (/событи|мероприят/i.test(t)) rejected.push('event');
  return [...new Set(rejected)];
}

function detectRecommendationRejection(userText, previousCardTypes = []) {
  const text = String(userText || '').trim();
  const lower = text.toLowerCase();
  const explicit = explicitRejectedTypes(lower);
  const hasRejectionSignal = REJECTION_SIGNAL_RE.test(lower);
  const wantsAlternative = ALTERNATIVE_SIGNAL_RE.test(lower);
  const isGeneralNo = GENERAL_NO_RE.test(lower);
  const prevTypes = [...new Set(previousCardTypes || [])];

  if (explicit.length) {
    return { isRejection: true, rejectedTypes: explicit, wantsAlternative: true };
  }
  if (prevTypes.length && (hasRejectionSignal || wantsAlternative || isGeneralNo)) {
    return { isRejection: true, rejectedTypes: prevTypes, wantsAlternative: true };
  }
  if (wantsAlternative && prevTypes.length) {
    return { isRejection: true, rejectedTypes: prevTypes, wantsAlternative: true };
  }
  return { isRejection: false, rejectedTypes: [], wantsAlternative: false };
}

function preferTypesAfterRejection(rejectedTypes = []) {
  const rejected = new Set(rejectedTypes);
  return CHAT_CARD_TYPE_PRIORITY.filter((type) => !rejected.has(type));
}

function buildAlternativeSupportReply(rejectedTypes = [], preferTypes = []) {
  const rejected = new Set(rejectedTypes);
  const nextType = preferTypes[0] || CHAT_CARD_TYPE_PRIORITY.find((t) => !rejected.has(t));

  if (!nextType) {
    return 'Понимаю, эти варианты не подошли. Тогда просто сделайте паузу на 5–10 минут: вода, окно, несколько спокойных вдохов. Я рядом, если захотите продолжить.';
  }
  if (rejected.has('music') && nextType === 'podcast') {
    return 'Понимаю, музыка сейчас не подходит. Тогда попробуйте короткий подкаст — иногда легче переключиться через спокойный разговор.';
  }
  if (rejected.has('music') && (nextType === 'article' || nextType === 'book')) {
    return 'Хорошо, без музыки. Может, поможет короткая статья или книга — можно просто пролистать пару страниц в своём темпе.';
  }
  if (rejected.has('meditation') && nextType === 'film') {
    return 'Без медитации — это нормально. Для мягкого отдыха можно выбрать спокойный фильм и просто переключить внимание.';
  }
  if (rejected.has('meditation') && nextType === 'music') {
    return 'Хорошо, без практики. Иногда помогает просто спокойная музыка — без усилий и без «упражнений».';
  }
  if (rejected.has('meditation') && (nextType === 'article' || nextType === 'podcast')) {
    return 'Понимаю, медитация сейчас не ваш формат. Попробуйте что-то более лёгкое — подкаст или короткую статью.';
  }
  if ((rejected.has('film') || rejected.has('article') || rejected.has('book')) && nextType === 'music') {
    return 'Хорошо, давайте другой вариант. Может, сейчас больше подойдёт спокойная музыкальная подборка.';
  }
  if (rejected.has('film') && nextType === 'podcast') {
    return 'Фильм не хочется — понимаю. Попробуйте подкаст: можно слушать фоном и не держать внимание на экране.';
  }
  return 'Понимаю, этот вариант не подошёл. Давайте попробуем что-то другое из подборки — иногда лучше заходит другой формат отдыха.';
}

function buildLocalSupportReply(messages, userText, options = {}) {
  const { previousCardTypes = [] } = options;
  const rejection = detectRecommendationRejection(userText, previousCardTypes);
  if (rejection.isRejection) {
    const preferTypes = preferTypesAfterRejection(rejection.rejectedTypes);
    return buildAlternativeSupportReply(rejection.rejectedTypes, preferTypes);
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')?.content || '';
  const userCount = messages.filter((m) => m.role === 'user').length;

  if (isGreetingOnly(userText) && userCount <= 1) {
    return pickNotRepeated(GREETING_RESPONSES, userText, lastAssistant);
  }

  if (isThankYouMessage(userText)) {
    return pickNotRepeated(THANK_YOU_RESPONSES, userText, lastAssistant);
  }

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
  const themedFullSets = {
    stress: STRESS_SUPPORT_RESPONSES,
    anxiety: ANXIETY_SUPPORT_RESPONSES,
    burnout: BURNOUT_SUPPORT_RESPONSES
  };

  if (!isAck && themedFullSets[primaryTheme]) {
    const main = pickNotRepeated(themedFullSets[primaryTheme], userText, lastAssistant);
    const recommendation = pickInterestRecommendation(`${userText} ${recentUserText}`);
    const followUp = pickNotRepeated(
      FOLLOW_UPS[primaryTheme] || FOLLOW_UPS.generic,
      `${userText}-f`,
      lastAssistant
    );
    return [main, recommendation, followUp].filter(Boolean).join(' ');
  }

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
  [opener, firstGuidance, secondGuidance, pickInterestRecommendation(`${userText} ${recentUserText}`), followUp];
  const reply = replyParts.filter(Boolean).join(' ');
  if (lastAssistant && reply.trim() === lastAssistant.trim()) {
    const altGuidance = pickBySeed(GUIDANCE_BY_THEME.generic, `${userText}-alt`);
    return [opener, altGuidance, followUp].filter(Boolean).join(' ');
  }
  return reply;
}

function buildCardHints(userText, messages, rejectionCtx = {}) {
  const recentUserText = messages.
  filter((m) => m.role === 'user').
  slice(-4).
  map((m) => m.content).
  join(' ');
  const combined = `${userText} ${recentUserText}`;
  const themes = detectThemes(combined);
  const interests = detectInterests(combined);

  const themeKeys = [];
  if (themes.stress) themeKeys.push('stress');
  if (themes.anxiety) themeKeys.push('anxiety');
  if (themes.burnout) themeKeys.push('burnout');

  const interestKeys = [];
  if (interests.music) interestKeys.push('music');
  if (interests.books) interestKeys.push('books');
  if (interests.practices) interestKeys.push('practices');
  if (interests.films) interestKeys.push('films');

  const {
    rejectedTypes = [],
    preferTypes = [],
    isAlternative = false
  } = rejectionCtx;

  const showCards = isAlternative ?
  preferTypes.length > 0 :
  themeKeys.length > 0 || interestKeys.length > 0;

  return {
    showCards,
    themes: themeKeys,
    interests: interestKeys,
    excludeTypes: rejectedTypes,
    preferTypes,
    isAlternative
  };
}

function isMentalHealthContext(messages, previousCardTypes = []) {
  const recentUserText = messages.
  filter((m) => m.role === 'user').
  slice(-4).
  map((m) => m.content).
  join(' ');
  const lastUserText = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const inRejectionFlow = previousCardTypes.length > 0 &&
  (REJECTION_SIGNAL_RE.test(lastUserText) || ALTERNATIVE_SIGNAL_RE.test(lastUserText) || GENERAL_NO_RE.test(lastUserText));
  return TOPIC_RE.test(recentUserText) || inRejectionFlow;
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
    const promptMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: SCENARIO_REFERENCE }
    ];
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

    const previousCardTypes = Array.isArray(req.body?.context?.previousCardTypes) ?
    req.body.context.previousCardTypes.filter((t) => typeof t === 'string') :
    [];

    const rejection = detectRecommendationRejection(lastUser.content, previousCardTypes);
    const rejectionCtx = rejection.isRejection ?
    {
      rejectedTypes: rejection.rejectedTypes,
      preferTypes: preferTypesAfterRejection(rejection.rejectedTypes),
      isAlternative: true
    } :
    {};

    const cardHints = buildCardHints(lastUser.content, messages, rejectionCtx);

    if (!isMentalHealthContext(messages, previousCardTypes)) {
      return res.json({
        reply:
        'Я работаю только с темами ментального здоровья: выгорание, тревога, стресс, грусть, сон и эмоциональная поддержка. Опишите, пожалуйста, что вы чувствуете, и я помогу.',
        source: 'guardrail',
        cardHints: { showCards: false, themes: [], interests: [], excludeTypes: [], preferTypes: [], isAlternative: false }
      });
    }

    if (CRISIS_RE.test(lastUser.content)) {
      return res.json({
        reply:
        'Спасибо, что честно написали об этом. Такие мысли нельзя оставлять без живой помощи - пожалуйста, срочно обратитесь к психологу/психотерапевту или в экстренную службу вашей страны и сообщите близкому человеку, что вам сейчас нужна поддержка. Наше приложение рядом для сопровождения, но в такой ситуации очная помощь обязательна и приоритетна.',
        source: 'crisis',
        cardHints: { showCards: false, themes: [], interests: [], excludeTypes: [], preferTypes: [], isAlternative: false }
      });
    }

    const userId = req.user?.user_id || 'anon';
    const existingSummary = sessionMemory.get(userId)?.summary || '';
    const heuristicSummary = buildSessionSummary(messages);
    const rejectionSummary = rejection.isRejection ?
    `Пользователь отклонил рекомендации (${rejection.rejectedTypes.join(', ')}). Предложи другой формат отдыха и не повторяй отклонённое.` :
    '';
    const sessionSummary = [existingSummary, heuristicSummary, rejectionSummary].filter(Boolean).join(' ');

    const reply = await getOpenAIReply(messages, sessionSummary);
    if (!reply) {
      return res.json({
        reply: buildLocalSupportReply(messages, lastUser.content, { previousCardTypes }),
        source: rejection.isRejection ? 'fallback-alternative' : 'fallback-local-support',
        cardHints
      });
    }

    sessionMemory.set(userId, {
      summary: buildSessionSummary([...messages, { role: 'assistant', content: reply }]),
      updatedAt: Date.now()
    });

    return res.json({ reply, source: 'openai', model: DEFAULT_MODEL, cardHints });
  } catch (err) {
    console.error('[AI] route error:', err?.message || err);
    return res.status(500).json({ message: 'Ошибка AI-сервиса. Попробуйте чуть позже.' });
  }
});

module.exports = router;