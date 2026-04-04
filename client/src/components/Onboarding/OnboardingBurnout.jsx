import React, { useMemo, useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, Heart, ArrowRight, ChevronLeft } from 'lucide-react';
import api from '../../utils/api';
import { savePendingOnboarding, clearPendingOnboarding } from '../../utils/onboardingLocalStorage';
import {
  ONBOARDING_OPTIONS,
  STUDENT_BURNOUT_QUESTIONS,
  TEACHER_BURNOUT_QUESTIONS,
  burnoutLevelLabel,
} from '../../data/onboardingBurnoutQuestions';
import './OnboardingBurnout.css';

const OnboardingBurnout = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('test');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => Array(10).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultPercent, setResultPercent] = useState(null);
  const [rawScore, setRawScore] = useState(null);
  const [savedOffline, setSavedOffline] = useState(false);

  const questions = useMemo(
    () => (user?.role === 'teacher' ? TEACHER_BURNOUT_QUESTIONS : STUDENT_BURNOUT_QUESTIONS),
    [user?.role]
  );

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
  }, [user?.role, navigate]);

  useEffect(() => {
    setError('');
  }, [step]);

  if (!user) return null;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.onboarding_burnout_completed && phase !== 'result') {
    return <Navigate to="/dashboard" replace />;
  }

  const totalSteps = questions.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const currentAnswer = answers[step];

  const pickOption = (value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = value;
      return next;
    });
  };

  const goNext = () => {
    if (currentAnswer === null) return;
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else finishTest();
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const finishTest = async () => {
    if (answers.some((a) => a === null)) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/users/onboarding-burnout', { answers });
      setSavedOffline(false);
      clearPendingOnboarding(user.user_id);
      setResultPercent(res.data.percent);
      setRawScore(res.data.rawScore ?? answers.reduce((s, v) => s + v, 0));
      updateUser(res.data.user);
      setPhase('result');
    } catch (e) {
      console.error(e);
      const sum = answers.reduce((s, v) => s + v, 0);
      const percent = Math.min(100, Math.max(0, Math.round((sum / 30) * 100)));
      savePendingOnboarding(user.user_id, { percent, rawScore: sum, answers });
      setResultPercent(percent);
      setRawScore(sum);
      setSavedOffline(true);
      updateUser({
        ...user,
        onboarding_burnout_completed: true,
        onboarding_burnout_percent: percent,
      });
      setPhase('result');
      setError('');
    } finally {
      setSubmitting(false);
    }
  };

  const level = resultPercent != null ? burnoutLevelLabel(resultPercent) : null;

  if (phase === 'result' && resultPercent != null && level) {
    const markerLeft = `${resultPercent}%`;
    return (
      <div className="onb-page">
        <div className="onb-result-inner fade-in">
          <header className="onb-result-head">
            <div className="onb-brand-mark">
              <Brain size={22} />
            </div>
            <h1 className="onb-result-title">Ваш результат</h1>
            <p className="onb-result-sub">Оценка текущего уровня выгорания по ответам</p>
          </header>

          <div className="onb-result-card">
            <div className="onb-scale-wrap" aria-hidden>
              <div className="onb-scale-bar">
                <div className="onb-scale-gradient" />
                <div className="onb-scale-marker" style={{ left: markerLeft }} />
              </div>
            </div>

            <div className="onb-score-row">
              <span className="onb-score-pill">
                {rawScore != null ? `${rawScore} из 30 баллов` : 'Итог'}
              </span>
              <span className="onb-score-pct">{resultPercent}%</span>
              <span className="onb-score-label">уровень выгорания</span>
            </div>

            <h2 className={`onb-level-title onb-level-title--${level.key}`}>{level.title}</h2>
            <p className="onb-level-desc">{level.hint}</p>
            {savedOffline && (
              <p className="onb-offline-note">
                Нет связи с сервером: результат сохранён на устройстве. При появлении сети он отправится
                автоматически при следующем входе.
              </p>
            )}
          </div>

          <button
            type="button"
            className="onb-continue-btn"
            onClick={() => navigate('/dashboard', { replace: true })}
          >
            Продолжить
            <ArrowRight size={20} />
          </button>
          <p className="onb-result-foot">
            Далее вы попадёте на главный экран: практики, дневник и аналитика помогут отслеживать динамику.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="onb-page">
      <div className="onb-shell fade-in">
        <header className="onb-header">
          <div className="onb-brand">
            <div className="onb-brand-mark">
              <Brain size={22} />
            </div>
            <div>
              <h1 className="onb-title">Оценка уровня выгорания</h1>
              <p className="onb-subtitle">
                Ответьте на 10 вопросов — мы покажем ориентир в процентах (не диагноз).
                {user.role === 'teacher' ? ' Вопросы для преподавателей.' : ' Вопросы для студентов.'}
              </p>
            </div>
          </div>
        </header>

        <div className="onb-progress-row">
          <span className="onb-progress-label">
            Вопрос {step + 1} из {totalSteps}
          </span>
          <span className="onb-progress-pct">{Math.round(progress)}%</span>
        </div>
        <div className="onb-progress-track">
          <div className="onb-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="onb-question-card">
          <div className="onb-q-icon" aria-hidden>
            <Heart size={22} strokeWidth={1.8} />
          </div>
          <p className="onb-q-text">{questions[step]}</p>
          <div className="onb-options">
            {ONBOARDING_OPTIONS.map((label, idx) => (
              <button
                key={label}
                type="button"
                className={`onb-option ${currentAnswer === idx ? 'selected' : ''}`}
                onClick={() => pickOption(idx)}
              >
                <span className="onb-option-dot" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && step === totalSteps - 1 && (
          <div className="onb-error-banner" role="alert">
            {error}
          </div>
        )}

        <div className="onb-actions">
          {step > 0 ? (
            <button type="button" className="onb-back-btn" onClick={goBack}>
              <ChevronLeft size={18} />
              Назад
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn btn-primary onb-next-btn"
            onClick={goNext}
            disabled={currentAnswer === null || submitting}
          >
            {step === totalSteps - 1 ? (submitting ? 'Сохранение…' : 'Завершить') : 'Далее'}
          </button>
        </div>

        <p className="onb-foot-hint">Отвечайте честно — так рекомендации будут полезнее.</p>
      </div>
    </div>
  );
};

export default OnboardingBurnout;
