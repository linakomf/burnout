import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BookOpen,
  ClipboardList,
  ListOrdered,
  Clock,
  Heart,
  Users,
  Zap,
} from 'lucide-react';
import api from '../../utils/api';
import './Tests.css';

const CATEGORY_CHIPS = [
  { id: 'all', label: 'Все', emoji: '🌈' },
  { id: 'anxiety', label: 'Тревожность', emoji: '😰' },
  { id: 'stress', label: 'Стресс', emoji: '⚡' },
  { id: 'mood', label: 'Настроение', emoji: '😊' },
  { id: 'esteem', label: 'Самооценка', emoji: '⭐' },
];

function getTestBucket(test) {
  const s = `${test.title || ''} ${test.category_name || ''} ${test.description || ''}`.toLowerCase();
  if (/gad-7|\bgad\b|тревог|тревож|паник|беспокой|социальн/i.test(s)) return 'anxiety';
  if (/ежедневн|чек-ин|5 вопросов/i.test(s)) return 'mood';
  if (/стресс|выгоран|устал|перегруз|mbi|pss|напряжен|академическ/i.test(s)) return 'stress';
  if (/настроен|счаст|эмоцион|стабильн|радост/i.test(s)) return 'mood';
  if (/самооцен/i.test(s)) return 'esteem';
  return 'other';
}

function badgeLabelForTest(test) {
  const b = getTestBucket(test);
  const map = {
    anxiety: 'Тревожность',
    stress: 'Стресс',
    mood: 'Настроение',
    esteem: 'Самооценка',
  };
  return map[b] || test.category_name || 'Общее';
}

const ESTIMATED_QUESTIONS = {
  1: 10,
  2: 9,
  3: 8,
  4: 22,
  5: 10,
  6: 7,
  7: 5,
};

function estimateQuestions(test) {
  const qc = test.question_count;
  if (qc != null && Number.isFinite(Number(qc))) return Number(qc);
  const id = test.test_id;
  if (ESTIMATED_QUESTIONS[id] != null) return ESTIMATED_QUESTIONS[id];
  return 10;
}

function TestCardIcon({ bucket }) {
  const wrap = 'tests-catalog-card-icon';
  if (bucket === 'anxiety') {
    return (
      <span className={`${wrap} tests-catalog-card-icon--lavender`}>
        <Heart size={20} strokeWidth={2.2} />
      </span>
    );
  }
  if (bucket === 'stress') {
    return (
      <span className={`${wrap} tests-catalog-card-icon--coral`}>
        <Zap size={20} strokeWidth={2.2} />
      </span>
    );
  }
  if (bucket === 'mood') {
    return (
      <span className={`${wrap} tests-catalog-card-icon--mint`}>
        <CheckCircle size={20} strokeWidth={2.2} />
      </span>
    );
  }
  if (bucket === 'esteem') {
    return (
      <span className={`${wrap} tests-catalog-card-icon--peach`}>
        <Users size={20} strokeWidth={2.2} />
      </span>
    );
  }
  return (
    <span className={`${wrap} tests-catalog-card-icon--neutral`}>
      <BookOpen size={20} strokeWidth={2.2} />
    </span>
  );
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

// ─── Tests List ────────────────────────────────────────────────────────────────
export const TestsList = () => {
  const [tests, setTests] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/tests')
      .then((res) => setTests(res.data || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return tests;
    return tests.filter((t) => getTestBucket(t) === activeCategory);
  }, [tests, activeCategory]);

  if (loading) return <div className="tests-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="tests-catalog-page fade-in">
      <header className="tests-catalog-header">
        <h1 className="tests-catalog-title">
          <span className="tests-catalog-title-ico" aria-hidden>
            <ClipboardList size={32} strokeWidth={2} />
          </span>
          Тесты
        </h1>
        <p className="tests-catalog-sub">
          Пройдите психологические тесты для самопознания
        </p>
      </header>

      <div className="tests-catalog-chips" role="tablist" aria-label="Категории">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === chip.id}
            className={`tests-catalog-chip ${activeCategory === chip.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(chip.id)}
          >
            <span className="tests-catalog-chip-emoji">{chip.emoji}</span>
            <span className="tests-catalog-chip-label">{chip.label}</span>
          </button>
        ))}
      </div>

      <div className="tests-catalog-grid">
        {filtered.map((test) => {
          const bucket = getTestBucket(test);
          const nQ = estimateQuestions(test);
          const mins = Math.max(3, Math.ceil(nQ * 0.45));
          const badge = badgeLabelForTest(test);
          return (
            <article key={test.test_id} className="tests-catalog-card">
              <div className="tests-catalog-card-top">
                <TestCardIcon bucket={bucket} />
                <span className="tests-catalog-card-badge">{badge}</span>
              </div>
              <h3 className="tests-catalog-card-title">{test.title}</h3>
              <p className="tests-catalog-card-desc">{test.description}</p>
              <div className="tests-catalog-card-meta">
                <span className="tests-catalog-meta-item">
                  <ListOrdered size={15} strokeWidth={2.2} />
                  {nQ} вопросов
                </span>
                <span className="tests-catalog-meta-item">
                  <Clock size={15} strokeWidth={2.2} />
                  {mins} мин
                </span>
              </div>
              <button
                type="button"
                className="tests-catalog-card-cta"
                onClick={() => navigate(`/tests/${test.test_id}`)}
              >
                Начать тест
                <ChevronRight size={18} strokeWidth={2.2} />
              </button>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="tests-catalog-empty">
          <p>В этой категории пока нет тестов</p>
        </div>
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
    api.get(`/tests/${id}`)
      .then(res => setTest(res.data))
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

  const questions = test.questions || [];
  const currentQ = questions[step - 1];
  const progress = step > 0 && step <= questions.length ? (step / questions.length) * 100 : 0;
  const allAnswered = questions.every(q => answers[q.question_id] !== undefined);

  // INTRO
  if (step === 0) {
    return (
      <div className="take-test fade-in">
        <button className="btn btn-ghost back-btn" onClick={() => navigate('/tests')}>
          <ChevronLeft size={16} /> Назад
        </button>
        <div className="test-intro card">
          <div className="test-intro-icon"><BookOpen size={40} /></div>
          <h1>{test.title}</h1>
          <p>{test.description}</p>
          <div className="test-intro-meta">
            <span>📝 {questions.length} вопросов</span>
            <span>⏱ ~{Math.ceil(questions.length * 0.5)} минут</span>
          </div>
          <button className="btn btn-primary" onClick={() => setStep(1)}>
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
        <div className="test-result card test-result--rich">
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
    <div className="take-test fade-in">
      <div className="test-progress-bar">
        <div className="test-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="test-q-header">
        <button className="btn btn-ghost back-btn" onClick={() => setStep(s => s - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="q-counter">{step} / {questions.length}</span>
      </div>

      <div className="test-question card">
        <p className="q-text">{currentQ?.question_text}</p>
        <div className="q-options">
          {opts.map((opt, i) => (
            <button
              key={i}
              className={`q-option ${answers[currentQ.question_id] === i ? 'selected' : ''}`}
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
            className="btn btn-primary"
            disabled={answers[currentQ.question_id] === undefined}
            onClick={() => setStep(s => s + 1)}
          >
            Следующий <ChevronRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            disabled={!allAnswered || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Обработка...' : <><CheckCircle size={16} /> Завершить тест</>}
          </button>
        )}
      </div>
    </div>
  );
};
