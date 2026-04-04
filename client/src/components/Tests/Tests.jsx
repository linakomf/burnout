import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle, BookOpen } from 'lucide-react';
import api from '../../utils/api';
import './Tests.css';

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
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get('/tests'), api.get('/categories')])
      .then(([t, c]) => { setTests(t.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeCategory === 'all'
    ? tests
    : tests.filter(t => t.category_id === parseInt(activeCategory));

  if (loading) return <div className="tests-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="tests-page fade-in">
      <h1 className="page-title">Тесты</h1>
      <p className="page-sub">Пройдите психологическую диагностику и узнайте свой уровень</p>

      <div className="category-tabs">
        <button
          className={`cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >Все тесты</button>
        {categories.map(c => (
          <button
            key={c.category_id}
            className={`cat-tab ${activeCategory === c.category_id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.category_id)}
          >{c.name}</button>
        ))}
      </div>

      <div className="tests-grid">
        {filtered.map(test => (
          <div key={test.test_id} className="test-card card">
            <div className="test-card-icon"><BookOpen size={24} /></div>
            <h3 className="test-card-title">{test.title}</h3>
            <p className="test-card-desc">{test.description}</p>
            <div className="test-card-meta">
              <span className="test-card-cat">{test.category_name}</span>
            </div>
            <button
              className="btn btn-primary test-card-btn"
              onClick={() => navigate(`/tests/${test.test_id}`)}
            >
              Пройти тест <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="tests-empty">
          <p>В этой категории нет тестов</p>
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
    const levelColors = { 'Низкий': '#B8D48A', 'Средний': '#F9C74F', 'Высокий': '#FF6B6B' };
    const levelEmojis = { 'Низкий': '✅', 'Средний': '⚠️', 'Высокий': '🔴' };
    const color = levelColors[result.result.level] || '#BCC2F4';

    return (
      <div className="take-test fade-in">
        <div className="test-result card">
          <div className="result-icon" style={{ background: `${color}22`, color }}>
            {levelEmojis[result.result.level]} {result.result.level} уровень
          </div>
          <h1>Тест завершён!</h1>
          <p className="result-test-title">{test.title}</p>
          <div className="result-score-circle" style={{ borderColor: color }}>
            <span className="result-score-num">{result.percentage}%</span>
            <span className="result-score-label">уровень стресса</span>
          </div>
          {result.result.level === 'Высокий' && (
            <div className="result-warning">
              ⚠️ Рекомендуем обратиться к психологу или воспользоваться ИИ-ассистентом
            </div>
          )}
          <div className="result-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/tests')}>
              Все тесты
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/stats')}>
              Моя статистика
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
