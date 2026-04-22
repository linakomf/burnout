import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  Zap,
  Lightbulb,
  Star,
} from 'lucide-react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { IntroSplashArt, QuestionSideArt } from './TestsDecor';
import { mergeTestRu } from '../../config/testDisplayRu';
import './Tests.css';

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
    title: 'Вдохновение',
    lead: 'Короткий опрос о перегрузке и восстановлении — с прогрессом по шагам.',
    Icon: Lightbulb,
    panelBg: '#FEEBC8',
    accent: 'heal',
  },
  {
    key: 'discover',
    preferIds: [6, 3],
    title: 'Импульс',
    lead: 'Тревога и внутреннее напряжение — взглянуть на то, что происходит сейчас.',
    Icon: Zap,
    panelBg: '#FEF3C7',
    accent: 'discover',
  },
  {
    key: 'insight',
    preferIds: [7, 5],
    title: 'Баланс дня',
    lead: 'Короткий чек-ин: настроение и ресурс — для регулярной динамики.',
    Icon: Star,
    panelBg: '#FEE2E2',
    accent: 'insight',
  },
];

export function bucketToAccent(bucket) {
  if (bucket === 'stress') return 'heal';
  if (bucket === 'anxiety') return 'discover';
  if (bucket === 'mood') return 'insight';
  if (bucket === 'esteem') return 'heal';
  return 'plain';
}

const CATALOG_FILTER_CHIPS = [
  { id: 'all', label: 'Все' },
  { id: 'quick', label: 'Быстрые опросники' },
  { id: 'basic', label: 'Базовые' },
  { id: 'clinical', label: 'Клинические тесты' },
  { id: 'practices', label: 'Практики' },
  { id: 'other', label: 'Другие' },
];

export function getTestBucket(test) {
  const s = `${test.title || ''} ${test.category_name || ''} ${test.description || ''}`.toLowerCase();
  if (/gad-7|\bgad\b|тревог|тревож|паник|беспокой|социальн/i.test(s)) return 'anxiety';
  if (/ежедневн|чек-ин|5 вопросов/i.test(s)) return 'mood';
  if (/стресс|выгоран|устал|перегруз|mbi|pss|напряжен|академическ/i.test(s)) return 'stress';
  if (/настроен|счаст|эмоцион|стабильн|радост/i.test(s)) return 'mood';
  if (/самооцен/i.test(s)) return 'esteem';
  return 'other';
}

/** Группа для фильтров каталога (макет: быстрые / базовые / клинические / …) */
export function getCatalogFilter(test) {
  const qc = Number(test.question_count) || 0;
  const blob = `${test.title || ''} ${test.description || ''} ${test.category_name || ''}`.toLowerCase();

  if (/практик|медитац|дыхани|релакс|mindful/i.test(blob)) return 'practices';

  if (
    /gad-7|\bgad\b|mbi|phq|pss|клиническ|диагностическ|шкал|выгоран|синдром|тревожн.*расстрой/i.test(blob)
  ) {
    return 'clinical';
  }

  if (qc > 0 && qc <= 7) return 'quick';
  if (/ежедневн|чек-ин|5 вопросов|быстр|коротк/i.test(blob)) return 'quick';

  if (qc >= 8 && qc <= 24) return 'basic';
  if (qc > 0) return 'basic';
  return 'other';
}

function audienceLabel(test) {
  const r = String(test.target_role || '').toLowerCase();
  if (/student|студент/i.test(r)) return 'Для студентов';
  if (/staff|персонал|препод|teacher/i.test(r)) return 'Для преподавателей';
  if (test.category_name && String(test.category_name).trim()) return String(test.category_name).trim();
  return 'Общий доступ';
}

function questionCountLabel(qc) {
  const n = Number(qc) || 0;
  const m = n % 10;
  const f = n % 100;
  let word = 'вопросов';
  if (m === 1 && f !== 11) word = 'вопрос';
  else if (m >= 2 && m <= 4 && (f < 12 || f > 14)) word = 'вопроса';
  return `${n} ${word}`;
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

export const TestsList = () => {
  const { t } = useLanguage();
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

  const enriched = tests.map((t) => ({
    ...t,
    bucket: getTestBucket(t),
    catalogFilter: getCatalogFilter(t),
  }));

  const filterCounts = enriched.reduce(
    (acc, t) => {
      acc.all += 1;
      const f = t.catalogFilter;
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    },
    { all: 0, quick: 0, basic: 0, clinical: 0, practices: 0, other: 0 }
  );

  const filtered =
    filter === 'all'
      ? enriched
      : enriched.filter((t) => t.catalogFilter === filter);

  const sortedFiltered = [...filtered].sort((a, b) => Number(a.test_id) - Number(b.test_id));

  if (loading) {
    return (
      <div className="tests-catalog-page tests-mock">
        <div className="tests-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="tests-catalog-page tests-mock fade-in">
      <header className="tests-mock-hero">
        <h1 className="tests-mock-title">{t('pages.testsTitle')}</h1>
        <p className="tests-mock-lead">
          {t('pages.testsLead')}
        </p>
      </header>

      <div className="tests-mock-chips" role="tablist" aria-label={t('pages.testsFilter')}>
        {CATALOG_FILTER_CHIPS.map(({ id }) => {
          const count = filterCounts[id] ?? 0;
          const active = filter === id;
          const showCount = id !== 'all';
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`tests-mock-chip ${active ? 'tests-mock-chip--active' : ''}`}
              onClick={() => setFilter(id)}
            >
              {t(`testsFilter.${id}`)}
              {showCount ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      <section className="tests-mock-section" aria-label={t('testsUi.quickStartAria')}>
        <h2 className="tests-mock-section-title">{t('pages.testsQuick')}</h2>
        <p className="tests-mock-section-lead">{t('pages.testsQuickLead')}</p>
        <div className="tests-mock-paths">
          {TEST_PATHS.map((path, i) => {
            const chosen = pickTest(tests, path.preferIds);
            const Icon = path.Icon;
            return (
              <article
                key={path.key}
                className="tests-mock-path-card"
                style={{ animationDelay: `${0.06 + i * 0.07}s` }}
              >
                <div className="tests-mock-path-panel" style={{ background: path.panelBg }} aria-hidden>
                  <Icon className="tests-mock-path-icon" size={40} strokeWidth={2} />
                </div>
                <h3 className="tests-mock-path-card-title">{t(`testsPath.${path.key}.title`)}</h3>
                <p className="tests-mock-path-card-desc">{t(`testsPath.${path.key}.lead`)}</p>
                <button
                  type="button"
                  className="tests-mock-path-btn"
                  disabled={!chosen}
                  onClick={() => chosen && navigate(`/tests/${chosen.test_id}`)}
                >
                  {t('testsUi.goTest')}
                  <ChevronRight size={18} strokeWidth={2.2} />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {!tests.length && (
        <p className="tests-mock-fallback">
          {t('testsUi.noTests')}
        </p>
      )}

      {tests.length > 0 && (
        <section className="tests-mock-catalog-wrap" aria-label={t('pages.testsCatalog')}>
          <h2 className="tests-mock-section-title">{t('pages.testsCatalog')}</h2>
          <p className="tests-mock-section-lead">
            {t('pages.testsCatalogHint')}
          </p>

          {sortedFiltered.length === 0 ? (
            <p className="tests-mock-empty">{t('testsUi.emptyFilter')}</p>
          ) : (
            <div className="tests-mock-catalog-grid">
              {sortedFiltered.map((row, i) => {
                const qc = row.question_count != null ? Number(row.question_count) : 0;
                const disabled = qc === 0;
                return (
                  <article
                    key={row.test_id}
                    className="tests-mock-catalog-card"
                    style={{ animationDelay: `${0.04 + (i % 12) * 0.035}s` }}
                  >
                    <button
                      type="button"
                      className="tests-mock-catalog-inner"
                      disabled={disabled}
                      onClick={() => !disabled && navigate(`/tests/${row.test_id}`)}
                    >
                      <h3 className="tests-mock-catalog-title">{row.title}</h3>
                      <p className="tests-mock-catalog-meta">
                        {disabled ? 'Вопросы не загружены' : questionCountLabel(qc)}
                      </p>
                      <p className="tests-mock-catalog-meta tests-mock-catalog-meta--sub">
                        {disabled ? '—' : audienceLabel(row)}
                      </p>
                      <span className="tests-mock-catalog-cta">
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

export const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
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

  if (step === questions.length + 1 && result) {
    const level = result.level || result.result.level;
    const color = resultAccentColor(level);
    const interp = result.interpretation;
    const scoreLabel =
      result.scale === 'gad7'
        ? `балл GAD-7: ${result.result.score} / ${result.maxScore ?? 21}`
        : result.scale === 'daily5'
          ? `индекс дня: ${result.percentage}%`
          : result.scale === 'mbi_student'
            ? `индекс: ${result.percentage}%`
            : 'интенсивность по шкале';

    const showCrisisHint =
      /высокая тревож|выраженное выгорание|сильн|нужен отдых и поддержк/i.test(level || '') ||
      result.result.level === 'Высокий';

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
