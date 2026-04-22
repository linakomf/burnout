const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const JOY_WORDS = [
'рад', 'радост', 'счастлив', 'классно', 'отлично', 'хорошо', 'весел', 'люблю', 'кайф', 'супер',
'здорово', 'приятно', 'благодар', 'легко', 'спокоен', 'умиротвор', 'на высоте', 'получилось'];

const ANXIETY_WORDS = [
'тревог', 'беспоко', 'волнуюсь', 'страшно', 'боюсь', 'переживаю', 'паник', 'нерв', 'не знаю что',
'вдруг', 'плохо кончится', 'дрож', 'сердце колотится'];

const STRESS_WORDS = [
'стресс', 'устал', 'устала', 'выгор', 'много дел', 'дедлайн', 'экзамен', 'диплом', 'не успеваю',
'давлен', 'раздраж', 'злой', 'злая', 'невыносим', 'тяжело', 'грустно', 'плохо', 'одинок'];


function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizeScores(raw) {
  return {
    joy: clamp(Number(raw.joy) || 0),
    anxiety: clamp(Number(raw.anxiety) || 0),
    stress: clamp(Number(raw.stress) || 0)
  };
}

export function analyzeEmotionsKeywords(text) {
  if (!text || !String(text).trim()) {
    return { joy: 15, anxiety: 15, stress: 15 };
  }
  const lower = text.toLowerCase();

  const countHits = (words) =>
  words.reduce((acc, w) => lower.includes(w) ? acc + 1 : acc, 0);

  const j = countHits(JOY_WORDS);
  const a = countHits(ANXIETY_WORDS);
  const s = countHits(STRESS_WORDS);

  let joy = 12 + j * 18 + (j > 0 && a === 0 && s === 0 ? 25 : 0);
  let anxiety = 10 + a * 22;
  let stress = 10 + s * 20;

  const total = j + a + s;
  if (total === 0) {
    joy = 28;
    anxiety = 22;
    stress = 22;
  } else {
    if (joy > anxiety && joy > stress) {
      joy = Math.min(100, joy + 15);
    }
    if (anxiety >= stress && anxiety > 0) {
      anxiety = Math.min(100, anxiety + 10);
    }
    if (stress >= anxiety && stress > 0) {
      stress = Math.min(100, stress + 8);
    }
  }

  return normalizeScores({ joy, anxiety, stress });
}

export async function analyzeEmotionsOpenAI(text) {
  const key = process.env.REACT_APP_OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 120,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
        {
          role: 'system',
          content:
          'Ты аналитик эмоций. По тексту пользователя оцени интенсивность (0–100 каждое): радость (joy), тревога (anxiety), стресс (stress). Ответь ТОЛЬКО JSON: {"joy":number,"anxiety":number,"stress":number}'
        },
        { role: 'user', content: String(text).slice(0, 2000) }]

      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeScores(parsed);
  } catch {
    return null;
  }
}

export async function analyzeEmotions(text) {
  const fromAi = await analyzeEmotionsOpenAI(text);
  if (fromAi) return fromAi;
  return analyzeEmotionsKeywords(text);
}

export function deriveOverallMood({ joy, anxiety, stress }) {
  if (stress >= 70 || anxiety >= 70) {
    return { emoji: '😰', label: 'Напряжённо', sub: 'Высокий стресс или тревога — дышите глубже' };
  }
  if (joy >= 65 && stress < 45 && anxiety < 45) {
    return { emoji: '😊', label: 'Хорошо', sub: 'Позитивный настрой заметен' };
  }
  if (stress < 40 && anxiety < 40 && joy >= 35) {
    return {
      emoji: '😌',
      label: 'Спокойно',
      sub: 'Эмоции ровные. Стресс не превышает норму.'
    };
  }
  if (joy > stress && joy > anxiety) {
    return { emoji: '🙂', label: 'Стабильно', sub: 'Больше ресурса, чем давления' };
  }
  return { emoji: '😐', label: 'Смешанно', sub: 'Есть и напряжение, и нейтральные зоны' };
}