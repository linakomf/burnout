import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Heart,
  Leaf,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SkipBack,
  SkipForward,
  Square,
} from 'lucide-react';

function formatClock(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, '0');
  const seconds = String(value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function usePracticeTimerEngine(practice, onComplete) {
  const durationSec = Math.max(1, practice.durationMin * 60);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setElapsedSec(0);
    setIsPaused(false);
    setIsDone(false);
  }, [practice.id]);

  useEffect(() => {
    if (isPaused || isDone) return undefined;
    const id = setInterval(() => {
      setElapsedSec((prev) => {
        const next = Math.min(prev + 1, durationSec);
        if (next >= durationSec) setIsDone(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [durationSec, isDone, isPaused]);

  useEffect(() => {
    if (isDone) onComplete();
  }, [isDone, onComplete]);

  const nSteps = practice.steps?.length || 1;
  const chunk = durationSec / nSteps;

  const currentStepIndex = useMemo(() => {
    if (!nSteps) return 0;
    return Math.min(Math.floor(elapsedSec / chunk), nSteps - 1);
  }, [chunk, elapsedSec, nSteps]);

  const progress = Math.min((elapsedSec / durationSec) * 100, 100);
  const remaining = Math.max(durationSec - elapsedSec, 0);

  const resetPractice = useCallback(() => {
    setElapsedSec(0);
    setIsPaused(false);
    setIsDone(false);
  }, []);

  const goToStep = useCallback(
    (idx) => {
      if (!nSteps) return;
      const safeIdx = Math.max(0, Math.min(idx, nSteps - 1));
      setElapsedSec(Math.min(safeIdx * chunk, durationSec - 1));
      setIsDone(false);
    },
    [chunk, durationSec, nSteps]
  );

  const goPrevStep = useCallback(() => goToStep(currentStepIndex - 1), [currentStepIndex, goToStep]);
  const goNextStep = useCallback(() => goToStep(currentStepIndex + 1), [currentStepIndex, goToStep]);

  return {
    durationSec,
    elapsedSec,
    isPaused,
    setIsPaused,
    isDone,
    currentStepIndex,
    progress,
    remaining,
    nSteps,
    resetPractice,
    goPrevStep,
    goNextStep,
  };
}

function PracticeTimerMeditation({
  practice,
  onComplete,
  onToggleFavorite,
  favorite,
  t,
}) {
  const {
    durationSec,
    elapsedSec,
    isPaused,
    setIsPaused,
    isDone,
    currentStepIndex,
    progress,
    resetPractice,
    goPrevStep,
    goNextStep,
  } = usePracticeTimerEngine(practice, onComplete);

  return (
    <div className="pr-meditation-timer">
      <div className="pr-meditation-bar-row">
        <span className="pr-meditation-time">{formatClock(elapsedSec)}</span>
        <div className="pr-meditation-track" style={{ '--pr-progress': `${progress}%` }}>
          <motion.div
            className="pr-meditation-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
        <span className="pr-meditation-time">{formatClock(durationSec)}</span>
      </div>

      <div className="pr-meditation-controls">
        <button
          type="button"
          className="pr-meditation-ctrl"
          onClick={resetPractice}
          aria-label={t('pages.meditationModalRepeat')}
        >
          <Repeat size={20} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="pr-meditation-ctrl"
          onClick={goPrevStep}
          disabled={currentStepIndex <= 0}
          aria-label={t('pages.meditationModalPrevStep')}
        >
          <SkipBack size={22} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="pr-meditation-play"
          onClick={() => {
            if (isDone) resetPractice();
            else setIsPaused((p) => !p);
          }}
          aria-label={
            isDone
              ? t('pages.meditationModalAgain')
              : isPaused
                ? t('pages.meditationModalResume')
                : t('pages.meditationModalPause')
          }
        >
          {isDone || isPaused ? (
            <Play size={26} fill="currentColor" strokeWidth={0} />
          ) : (
            <Pause size={26} fill="currentColor" strokeWidth={1.5} />
          )}
        </button>
        <button
          type="button"
          className="pr-meditation-ctrl"
          onClick={goNextStep}
          disabled={currentStepIndex >= (practice.steps?.length || 1) - 1}
          aria-label={t('pages.meditationModalNextStep')}
        >
          <SkipForward size={22} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={`pr-meditation-ctrl pr-meditation-heart ${favorite ? 'is-on' : ''}`}
          onClick={onToggleFavorite}
          aria-label={t('pages.meditationModalFavorite')}
        >
          <Heart size={20} strokeWidth={2} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="pr-meditation-step">
        <AnimatePresence mode="wait">
          <motion.p
            key={`${practice.id}-${currentStepIndex}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="pr-meditation-step-text"
          >
            {practice.steps?.[currentStepIndex] || ' '}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PracticeTimerDefault({ practice, onComplete, onStop }) {
  const {
    durationSec,
    elapsedSec,
    isPaused,
    setIsPaused,
    isDone,
    currentStepIndex,
    progress,
    remaining,
    resetPractice,
  } = usePracticeTimerEngine(practice, onComplete);

  return (
    <div className="pr-timer">
      <div className="pr-timer-top">
        <span>Прогресс</span>
        <strong>{Math.round(progress)}%</strong>
      </div>
      <div className="pr-timer-track">
        <motion.div
          className="pr-timer-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="pr-timer-time">
        <div className="pr-timer-clock">
          <p className="pr-timer-label">Таймер</p>
          <p className="pr-timer-value">{formatClock(remaining)}</p>
        </div>
        {isDone && <span className="pr-timer-done">Практика завершена</span>}
      </div>

      <div className="pr-step-box">
        <p className="pr-step-label">
          Шаг {currentStepIndex + 1} из {practice.steps?.length || 1}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={`${practice.id}-${currentStepIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="pr-step-text"
          >
            {(practice.steps && practice.steps[currentStepIndex]) || ''}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="pr-timer-actions">
        <motion.button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          disabled={isDone}
          whileTap={{ scale: 0.95 }}
          className={`btn ${isDone ? 'pr-btn-disabled' : 'btn-primary'}`}
        >
          {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
          {isPaused ? 'Продолжить' : 'Пауза'}
        </motion.button>
        <motion.button type="button" onClick={resetPractice} whileTap={{ scale: 0.95 }} className="btn btn-ghost">
          <RotateCcw size={14} />
          Сброс
        </motion.button>
        <motion.button type="button" onClick={onStop} whileTap={{ scale: 0.95 }} className="btn btn-danger">
          <Square size={14} />
          Стоп
        </motion.button>
      </div>
    </div>
  );
}

function PracticeTimer({
  practice,
  onComplete,
  onStop,
  layout = 'default',
  favorite,
  onToggleFavorite,
  t,
}) {
  if (layout === 'meditation' && t) {
    return (
      <PracticeTimerMeditation
        practice={practice}
        onComplete={onComplete}
        favorite={favorite}
        onToggleFavorite={onToggleFavorite || (() => {})}
        t={t}
      />
    );
  }
  return <PracticeTimerDefault practice={practice} onComplete={onComplete} onStop={onStop} />;
}

export default PracticeTimer;
