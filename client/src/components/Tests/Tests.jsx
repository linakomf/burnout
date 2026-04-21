import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  Brain,
  Sparkles,
  LayoutGrid,
  Zap,
  CloudRain,
  SunMedium,
  UserCircle,
  MoreHorizontal,
} from 'lucide-react';
import api from '../../utils/api';
import { IntroSplashArt, QuestionSideArt } from './TestsDecor';
import { IlluHealing, IlluDiscovery, IlluInsight } from './TestsPathsArt';
import { mergeTestRu } from '../../config/testDisplayRu';
import './Tests.css';

const EMPTY_FILTER_COUNTS = { all: 0, stress: 0, anxiety: 0, mood: 0, esteem: 0, other: 0 };

/**  тест по приоритету id (если роль скрыла часть тестов) */
function pickTest(tests, preferIds) {
  if (!tests?.length) return null;
  for (const id of preferIds) {
    const t = tests.find((x) => Number(x.test_id) === id);
    if (t) return t;
  }
  return tests[0];
}

const TEST_PATHS = [
  {
    key: 'heal',
    preferIds: [5, 2, 4],
    title: 'Восстановление',
    lead: '10 вопросов о перегрузке и восстановлении — с прогрессом по каждому шагу.',
    Illu: IlluHealing,
    accent: 'heal',
  },
  {
    key: 'discover',
    preferIds: [6, 3],
    title: 'Исследование',
    lead: 'Тревога и внутреннее напряжение — взглянуть на то, что происходит сейчас.',
    Illu: IlluDiscovery,
    accent: 'discover',
  },
  {
    key: 'insight',
    preferIds: [7, 5],
    title: 'Баланс дня',
    lead: 'Короткий чек-ин: настроение и ресурс — для регулярной динамики.',
    Illu: IlluInsight,
    accent: 'insight',
  },
];

/** Визуальный акцент карточки (совпадает с путями heal / discover / insight) */
export function bucketToAccent(bucket) {
  if (bucket === 'stress') return 'heal';
  if (bucket === 'anxiety') return 'discover';
  if (bucket === 'mood') return 'insight';
  if (bucket === 'esteem') return 'heal';
  return 'plain';
}

const TEST_FILTER_CHIPS = [
  { id: 'all', label: 'Все', Icon: LayoutGrid },
  { id: 'stress', label: 'Стресс и перегрузка', Icon: Zap },
  { id: 'anxiety', label: 'Тревога', Icon: CloudRain },
  { id: 'mood', label: 'Настроение и день', Icon: SunMedium },
  { id: 'esteem', label: 'Самооценка', Icon: UserCircle },
  { id: 'other', label: 'Другое', Icon: MoreHorizontal },
];

/** Тематическая группа для оформления карточки (психология / самочувствие) */
export function getTestBucket(test) {
  const s = `${test.title || ''} ${test.category_name || ''} ${test.description || ''}`.toLowerCase();
  if (/gad-7|\bgad\b|тревог|тревож|паник|беспокой|социальн/i.test(s)) return 'anxiety';
  if (/ежедневн|чек-ин|5 вопросов/i.test(s)) return 'mood';
  if (/стресс|выгоран|устал|перегруз|mbi|pss|напряжен|академическ/i.test(s)) return 'stress';
  if (/настроен|счаст|эмоцион|стабильн|радост/i.test(s)) return 'mood';
  if (/самооцен/i.test(s)) return 'esteem';
  return 'other';
}

function resultAccentColor(level) {
  const l = String(level || '').toLowerCase();
  if (/высок|сильн|выражен|нужен отдых|повышенн/i.test(l)) return '#e85d5d';
  if (/средн|риск|умеренн/i.test(l)) return '#e8a84a';
  if (/низк|нет признаков|стабильн|благополуч|хорош|ресурс/i.test(l)) return '#7db05a';
  const legacy = { Низкий: '#B8D48A', Средний: '#F9C74F', Высокий: '#FF6B6B' };
  return legacy[level] || '#9CAF88';
}

function parseQuestionOptions(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildFilterCounts(enriched) {
  return enriched.reduce((acc, t) => {
    acc.all += 1;
    acc[t.bucket] = (acc[t.bucket] || 0) + 1;
    return acc;
  }, { ...EMPTY_FILTER_COUNTS });
}

function toEnrichedTests(tests) {
  return tests.map((t) => ({
    ...t,
    bucket: getTestBucket(t),
  }));
}

function buildScoreLabel(result) {
  if (result.scale === 'gad7') return `балл GAD-7: ${result.result.score} / ${result.maxScore ?? 21}`;
  if (result.scale === 'daily5') return `индекс дня: ${result.percentage}%`;
  if (result.scale === 'mbi_student') return `индекс: ${result.percentage}%`;
  return 'интенсивность по шкале';
}

function shouldShowCrisisHint(level, rawLevel) {
  return (
    /высокая тревож|выраженное выгорание|сильн|нужен отдых и поддержк/i.test(level || '') ||
    rawLevel === 'Высокий'
  );
}

// ─── Tests List ────────────────────────────────────────────────────────────────
export const TestsList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/tests')
      .then((res) => setTests(res.data || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  const enriched = toEnrichedTests(tests);
  const filterCounts = buildFilterCounts(enriched);

  const filtered =
    filter === 'all'
      ? enriched
      : enriched.filter((t) => t.bucket === filter);

  const sortedFiltered = [...filtered].sort((a, b) => Number(a.test_id) - Number(b.test_id));

  if (loading) {
    return (
      <div className="tests-catalog-page">
        <div className="tests-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="tests-catalog-page tests-paths-page fade-in">
      <header className="tests-paths-hero">
        <div className="tests-paths-hero-glow" aria-hidden />
        <h1 className="tests-paths-title">
          <span className="tests-paths-title-ico" aria-hidden>
            <Brain size={28} strokeWidth={2} />
          </span>
          Тесты
        </h1>
        <p className="tests-paths-lead">
          Выберите направление — дальше откроется опрос с шагами и полосой прогресса. Результат ориентировочный, не
          диагноз.
        </p>
      </header>

      <div className="tests-filter-bar" role="tablist" aria-label="Фильтр по типу опроса">
        {TEST_FILTER_CHIPS.map(({ id, label, Icon }) => {
          const count = filterCounts[id] ?? 0;
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`tests-filter-chip ${active ? 'tests-filter-chip--active' : ''}`}
              onClick={() => setFilter(id)}
            >
              <span className="tests-filter-chip-ico" aria-hidden>
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="tests-filter-chip-label">{label}</span>
              <span className="tests-filter-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      <section className="tests-section-block" aria-label="Быстрый старт">
        <h2 className="tests-section-title">Быстрый старт</h2>
        <p className="tests-section-lead">Три направления — откроется первый доступный для вас тест в теме.</p>
        <div className="tests-paths-grid">
          {TEST_PATHS.map((path, i) => {
            const chosen = pickTest(tests, path.preferIds);
            const Illu = path.Illu;
            return (
              <article
                key={path.key}
                className={`tests-path-card tests-path-card--${path.accent}`}
                style={{ animationDelay: `${0.06 + i * 0.07}s` }}
              >
                <div className="tests-path-card-illu" aria-hidden>
                  <Illu className="tests-path-card-svg" />
                  <span className="tests-path-card-spark" aria-hidden>
                    <Sparkles size={18} strokeWidth={2} />
                  </span>
                </div>
                <h3 className="tests-path-card-title">{path.title}</h3>
                <p className="tests-path-card-desc">{path.lead}</p>
                <button
                  type="button"
                  className="btn btn-primary tests-path-card-btn"
                  disabled={!chosen}
                  onClick={() => chosen && navigate(`/tests/${chosen.test_id}`)}
                >
                  Начать опрос
                  <ChevronRight size={18} strokeWidth={2.2} />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {!tests.length && (
        <p className="tests-paths-fallback">Сейчас нет доступных тестов для вашей роли. Зайдите позже или обратитесь к администратору.</p>
      )}

      {tests.length > 0 && (
        <section className="tests-catalog-section" aria-label="Каталог опросов">
          <h2 className="tests-section-title">Каталог опросов</h2>
          <p className="tests-section-lead">
            Те же карточки, что и выше: тема, число вопросов и категория. Используйте фильтр сверху, чтобы сузить список.
          </p>

          {sortedFiltered.length === 0 ? (
            <p className="tests-catalog-empty">Нет опросов в этой категории. Выберите другой фильтр.</p>
          ) : (
            <div className="tests-catalog-grid">
              {sortedFiltered.map((t, i) => {
                const qc = t.question_count != null ? Number(t.question_count) : 0;
                const disabled = qc === 0;
                const accent = bucketToAccent(t.bucket);
                const cat = t.category_name ? String(t.category_name) : 'Опрос';
                return (
                  <article
                    key={t.test_id}
                    className={`tests-catalog-card tests-catalog-card--${accent}`}
                    style={{ animationDelay: `${0.04 + (i % 12) * 0.035}s` }}
                  >
                    <button
                      type="button"
                      className="tests-catalog-card-inner"
                      disabled={disabled}
                      onClick={() => !disabled && navigate(`/tests/${t.test_id}`)}
                    >
                      <div className="tests-catalog-card-top" aria-hidden>
                        <span className="tests-catalog-card-strip" />
                      </div>
                      <h3 className="tests-catalog-card-title">{t.title}</h3>
                      <p className="tests-catalog-card-desc">
                        {disabled ? 'Вопросы не загружены' : `${qc} вопросов · ${cat}`}
                      </p>
                      <span className="tests-catalog-card-cta">
                        {disabled ? 'Недоступно' : 'Открыть'}
                        {!disabled && <ChevronRight size={16} strokeWidth={2.2} />}
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

// ─── Take Test ─────────────────────────────────────────────────────────────────
export const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 0=intro, 1-N=questions, N+1=result
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/tests/${id}`)
      .then((res) => setTest(mergeTestRu(res.data)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/tests/${id}/submit`, { answers });
      setResult(res.data);
      setStep(test.questions.length + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="tests-loading"><div className="loading-spinner" /></div>;
  if (!test) return <div className="tests-empty"><p>Тест не найден</p></div>;

  const questions = Array.isArray(test.questions) ? test.questions : [];
  if (questions.length === 0) {
    return (
      <div className="take-test take-test--empty fade-in">
        <button type="button" className="btn btn-ghost back-btn" onClick={() => navigate('/tests')}>
          <ChevronLeft size={16} /> К тестам
        </button>
        <div className="test-intro card test-intro--psych test-intro--warn">
          <h1>{test.title}</h1>
          <p className="test-intro-lead">
            Для этого теста в базе нет вопросов. Перезапустите сервер (подтянется каталог) или обратитесь к администратору.
          </p>
        </div>
      </div>
    );
  }

  const bucket = getTestBucket(test);
  const currentQ = questions[step - 1];
  const nQ = questions.length;
  const progress =
    step > 0 && step <= nQ ? (step / nQ) * 100 : 0;
  const allAnswered = questions.every(q => answers[q.question_id] !== undefined);

  // INTRO
  if (step === 0) {
    return (
      <div className="take-test take-test--intro fade-in">
        <button type="button" className="btn btn-ghost back-btn" onClick={() => navigate('/tests')}>
          <ChevronLeft size={16} /> К тестам
        </button>
        <div
          className="test-progress-bar test-progress-bar--shine test-progress-bar--intro"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-label="Прогресс опроса"
        >
          <div className="test-progress-fill" style={{ width: '0%' }} />
        </div>
        <p className="test-progress-hint">После «Начать тест» полоса покажет ход опроса по вопросам.</p>
        <div className="test-intro card test-intro--psych">
          <div className="test-intro-illu" aria-hidden>
            <IntroSplashArt bucket={bucket} />
          </div>
          <div className="test-intro-icon test-intro-icon--float">
            <BookOpen size={36} strokeWidth={2} />
          </div>
          <h1>{test.title}</h1>
          <p className="test-intro-lead">{test.description}</p>
          <div className="test-intro-meta">
            <span>📝 {questions.length} вопросов</span>
            <span>⏱ ~{Math.ceil(questions.length * 0.5)} мин</span>
          </div>
          <button
            type="button"
            className="btn btn-primary test-intro-start"
            disabled={questions.length === 0}
            onClick={() => setStep(1)}
          >
            Начать тест
          </button>
        </div>
      </div>
    );
  }

  // RESULT
  if (step === questions.length + 1 && result) {
    const level = result.level || result.result.level;
    const color = resultAccentColor(level);
    const interp = result.interpretation;
    const scoreLabel = buildScoreLabel(result);
    const showCrisisHint = shouldShowCrisisHint(level, result.result.level);

    return (
      <div className="take-test fade-in">
        <div className="test-result card test-result--rich test-result--pop">
          <div className="result-icon" style={{ background: `${color}22`, color }}>
            {level}
          </div>
          <h1>Тест завершён</h1>
          <p className="result-test-title">{test.title}</p>
          <div className="result-score-circle" style={{ borderColor: color }}>
            <span className="result-score-num">{result.percentage}%</span>
            <span className="result-score-label">{scoreLabel}</span>
          </div>
          {interp && (
            <div className="result-interpret">
              <h2 className="result-interpret-title">{interp.title}</h2>
              <p className="result-interpret-text">{interp.text}</p>
              <p className="result-interpret-rec">
                <strong>Рекомендация:</strong> {interp.recommendation}
              </p>
            </div>
          )}
          {showCrisisHint && (
            <div className="result-warning">
              ⚠️ При сильном дискомфорте обратитесь к специалисту. ИИ и приложение не заменяют очную помощь.
            </div>
          )}
          <div className="result-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/tests')}>
              Все тесты
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/practices')}>
              Практики для меня
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/stats')}>
              Аналитика
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUESTIONS
  const opts = parseQuestionOptions(currentQ?.options);

  return (
    <div className="take-test take-test--questions fade-in">
      <div
        className="test-progress-bar test-progress-bar--shine"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={`Прогресс опроса: ${Math.round(progress)} процентов`}
      >
        <div className="test-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="test-progress-row">
        <span className="test-progress-label">Опрос</span>
        <span className="test-progress-pct">{Math.round(progress)}%</span>
      </div>

      <div className="test-q-layout">
        <div className="test-q-side" aria-hidden>
          <QuestionSideArt />
        </div>

        <div className="test-q-main">
          <div className="test-q-header">
            <button type="button" className="btn btn-ghost back-btn" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="q-counter">
              Вопрос {step} из {questions.length}
            </span>
          </div>

          <div key={step} className="test-question card tests-q-slide tests-q-card">
            <p className="q-text">{currentQ?.question_text}</p>
            <div className="q-options q-options--stagger">
              {opts.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  style={{ animationDelay: `${0.04 + i * 0.055}s` }}
                  className={`q-option q-option--enter ${answers[currentQ.question_id] === i ? 'selected' : ''}`}
                  onClick={() => handleAnswer(currentQ.question_id, i)}
                >
                  <span className="q-option-dot" />
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="test-q-actions">
            {step < questions.length ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={answers[currentQ.question_id] === undefined}
                onClick={() => setStep((s) => s + 1)}
              >
                Дальше <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!allAnswered || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Считаем результат…' : (
                  <>
                    <CheckCircle size={16} /> Завершить тест
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
