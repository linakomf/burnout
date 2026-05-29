import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { Heart, ArrowRight, ChevronLeft } from 'lucide-react';
import AppLogo from '../Brand/AppLogo';
import AuthFlowBackdrop from '../Auth/AuthFlowBackdrop';
import api from '../../utils/api';
import { savePendingOnboarding, clearPendingOnboarding } from '../../utils/onboardingLocalStorage';
import { getAvatarForRoleGender } from '../../config/registerAvatars';
import {
  ONBOARDING_OPTIONS,
  ONBOARDING_QUESTION_COUNT,
  ONBOARDING_MAX_RAW,
  STUDENT_BURNOUT_QUESTIONS,
  TEACHER_BURNOUT_QUESTIONS,
  burnoutLevelLabel
} from '../../data/onboardingBurnoutQuestions';
import '../Auth/Auth.css';
import './OnboardingBurnout.css';

function OnboardingProfileStep({ user, updateUser, t }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileRole, setProfileRole] = useState(() => (user?.role === 'teacher' ? 'teacher' : 'student'));
  const [gender, setGender] = useState(() => (user?.gender === 'girl' ? 'girl' : 'boy'));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const currentAvatar = useMemo(
    () => getAvatarForRoleGender(profileRole, gender),
    [profileRole, gender]
  );

  const handleBackToRegister = () => {
    logout();
    navigate('/register', { replace: true });
  };

  const save = async () => {
    setSaving(true);
    setErr('');
    try {
      const roleToSave = profileRole === 'teacher' ? 'teacher' : 'student';
      const genderToSave = gender === 'girl' ? 'girl' : 'boy';
      const avatarToSave = currentAvatar.path;
      const res = await api.put('/users/me', {
        role: roleToSave,
        gender: genderToSave,
        avatar: avatarToSave
      });
      const d = res.data && typeof res.data === 'object' ? res.data : {};
      updateUser({
        ...d,
        role: roleToSave,
        gender: genderToSave,
        avatar: avatarToSave
      });
    } catch (e) {
      setErr(e.response?.data?.message || t('burnoutOnb.errSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthFlowBackdrop cardClassName="auth-card--wide onb-profile-card">
      <div className="auth-card-top">
        <div className="auth-lang-bar">
          <LanguageSwitcher className="lang-switch--on-light-bg" />
        </div>
        <div className="auth-logo onb-brand-row">
          <div className="auth-logo-icon app-logo-wrap">
            <AppLogo size={44} />
          </div>
          <span className="brand-wordmark">burnout</span>
        </div>
      </div>

      <h1 className="auth-title">{t('burnoutOnb.profileTitle')}</h1>
      <div className="reg-grad-line" aria-hidden />

      {err && (
        <div className="auth-error onb-error" role="alert">
          <span>{err}</span>
        </div>
      )}

      <div className="auth-form onb-profile-form">
        <div className="form-group">
          <label>{t('auth.labelRole')}</label>
          <div className="role-selector">
            <button
              type="button"
              className={`role-btn ${profileRole === 'student' ? 'active' : ''}`}
              onClick={() => setProfileRole('student')}
            >
              {t('auth.roleStudent')}
            </button>
            <button
              type="button"
              className={`role-btn ${profileRole === 'teacher' ? 'active' : ''}`}
              onClick={() => setProfileRole('teacher')}
            >
              {t('auth.roleTeacher')}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>{t('auth.labelGender')}</label>
          <div className="role-selector reg-gender-row">
            <button
              type="button"
              className={`role-btn ${gender === 'boy' ? 'active' : ''}`}
              onClick={() => setGender('boy')}
            >
              {t('auth.regGenderBoy')}
            </button>
            <button
              type="button"
              className={`role-btn ${gender === 'girl' ? 'active' : ''}`}
              onClick={() => setGender('girl')}
            >
              {t('auth.regGenderGirl')}
            </button>
          </div>
          <p className="reg-hint">{t('auth.regGenderHint')}</p>
        </div>

        <div className="reg-step2-actions">
          <button
            type="button"
            className="btn btn-ghost reg-back-btn"
            onClick={handleBackToRegister}
            aria-label={t('burnoutOnb.backToRegisterAria')}
          >
            <ChevronLeft size={18} aria-hidden />
            {t('burnoutOnb.backToRegister')}
          </button>
          <button
            type="button"
            className="btn btn-primary auth-submit reg-submit-primary onb-profile-cta"
            onClick={save}
            disabled={saving}
          >
            {saving ? t('burnoutOnb.saving') : t('burnoutOnb.toSurvey')}
          </button>
        </div>
      </div>
    </AuthFlowBackdrop>
  );
}

const OnboardingBurnout = () => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [surveyPhase, setSurveyPhase] = useState('test');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(() => Array(ONBOARDING_QUESTION_COUNT).fill(null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resultPercent, setResultPercent] = useState(null);
  const [rawScore, setRawScore] = useState(null);
  const [savedOffline, setSavedOffline] = useState(false);

  const needsProfile = Boolean(user && !(user.gender && user.avatar));

  const questions = useMemo(
    () => (user?.role === 'teacher' ? TEACHER_BURNOUT_QUESTIONS : STUDENT_BURNOUT_QUESTIONS),
    [user?.role]
  );

  const prevNeedsProfile = useRef(null);
  useEffect(() => {
    if (prevNeedsProfile.current === true && needsProfile === false) {
      setStep(0);
      setAnswers(Array(ONBOARDING_QUESTION_COUNT).fill(null));
      setSurveyPhase('test');
      setError('');
      setResultPercent(null);
      setRawScore(null);
      setSavedOffline(false);
    }
    prevNeedsProfile.current = needsProfile;
  }, [needsProfile]);

  useEffect(() => {
    if (user?.role === 'admin') navigate('/admin', { replace: true });
  }, [user?.role, navigate]);

  useEffect(() => {
    setError('');
  }, [step]);

  if (!user) return null;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.onboarding_burnout_completed && surveyPhase !== 'result') {
    return <Navigate to="/dashboard" replace />;
  }

  if (needsProfile) {
    return <OnboardingProfileStep user={user} updateUser={updateUser} t={t} />;
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
      setSurveyPhase('result');
    } catch (e) {
      console.error(e);
      const sum = answers.reduce((s, v) => s + v, 0);
      const percent = Math.min(100, Math.max(0, Math.round((sum / ONBOARDING_MAX_RAW) * 100)));
      savePendingOnboarding(user.user_id, { percent, rawScore: sum, answers });
      setResultPercent(percent);
      setRawScore(sum);
      setSavedOffline(true);
      updateUser({
        ...user,
        onboarding_burnout_completed: true,
        onboarding_burnout_percent: percent
      });
      setSurveyPhase('result');
      setError('');
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (currentAnswer === null) return;
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else finishTest();
  };

  const level = resultPercent != null ? burnoutLevelLabel(resultPercent) : null;

  if (surveyPhase === 'result' && resultPercent != null && level) {
    const markerLeft = `${resultPercent}%`;
    return (
      <AuthFlowBackdrop cardClassName="auth-card--result onb-result-card">
        <div className="auth-card-top onb-result-top">
          <div className="auth-lang-bar">
            <LanguageSwitcher className="lang-switch--on-light-bg" />
          </div>
        </div>

        <div className="onb-result-head">
          <div className="auth-logo-icon app-logo-wrap onb-result-logo">
            <AppLogo size={44} />
          </div>
          <h1 className="auth-title auth-title--center">Ваш результат</h1>
          <p className="auth-subtitle auth-subtitle--tight">Оценка текущего уровня выгорания по ответам</p>
          <div className="reg-grad-line" aria-hidden />
        </div>

        <div className="onb-result-card-inner">
          <div className="onb-scale-wrap" aria-hidden>
            <div className="onb-scale-bar">
              <div className="onb-scale-gradient" />
              <div className="onb-scale-marker" style={{ left: markerLeft }} />
            </div>
          </div>

          <div className="onb-score-row">
            <span className="onb-score-pill">
              {rawScore != null ? `${rawScore} из ${ONBOARDING_MAX_RAW} баллов` : 'Итог'}
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
          className="btn btn-primary auth-submit reg-submit-primary onb-continue-btn"
          onClick={() => navigate('/dashboard', { replace: true })}
        >
          Продолжить
          <ArrowRight size={20} aria-hidden />
        </button>
        <p className="onb-result-foot">
          Далее вы попадёте на главный экран: раздел «Пространство», дневник и аналитика помогут отслеживать
          динамику.
        </p>
      </AuthFlowBackdrop>
    );
  }

  return (
    <AuthFlowBackdrop cardClassName="auth-card--survey onb-survey-card">
      <div className="auth-card-top onb-survey-top">
        <div className="auth-lang-bar">
          <LanguageSwitcher className="lang-switch--on-light-bg" />
        </div>
      </div>

      <div className="onb-brand-row onb-brand-row--center">
        <div className="auth-logo-icon app-logo-wrap">
          <AppLogo size={44} />
        </div>
        <div className="onb-brand-text">
          <h1 className="auth-title onb-survey-title">Оценка уровня выгорания</h1>
          <p className="auth-subtitle onb-survey-sub">
            Ответьте на 9 вопросов — мы покажем ориентир в процентах (не диагноз).
            {user.role === 'teacher' ? ' Вопросы для преподавателей.' : ' Вопросы для студентов.'}
          </p>
        </div>
      </div>
      <div className="reg-grad-line onb-survey-grad" aria-hidden />

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
        <div className="auth-error onb-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div className="onb-actions">
        {step > 0 ? (
          <button type="button" className="onb-back-btn" onClick={goBack}>
            <ChevronLeft size={18} aria-hidden />
            Назад
          </button>
        ) : (
          <span className="onb-actions-spacer" />
        )}
        <button
          type="button"
          className="btn btn-primary auth-submit reg-submit-primary onb-next-btn"
          onClick={goNext}
          disabled={currentAnswer === null || submitting}
        >
          {step === totalSteps - 1 ? (submitting ? 'Сохранение…' : 'Завершить') : 'Далее'}
        </button>
      </div>

      <p className="onb-foot-hint">Отвечайте честно — так рекомендации будут полезнее.</p>
    </AuthFlowBackdrop>
  );
};

export default OnboardingBurnout;
