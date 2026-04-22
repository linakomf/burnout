import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, RotateCcw, Square } from 'lucide-react';

function formatClock(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, '0');
  const seconds = String(value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function PracticeTimer({ practice, onComplete, onStop }) {
  const durationSec = practice.durationMin * 60;
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

  const currentStepIndex = useMemo(() => {
    if (!practice.steps.length) return 0;
    const chunk = durationSec / practice.steps.length;
    return Math.min(Math.floor(elapsedSec / chunk), practice.steps.length - 1);
  }, [durationSec, elapsedSec, practice.steps.length]);

  const progress = Math.min(elapsedSec / durationSec * 100, 100);
  const remaining = Math.max(durationSec - elapsedSec, 0);

  const resetPractice = () => {
    setElapsedSec(0);
    setIsPaused(false);
    setIsDone(false);
  };

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
          transition={{ duration: 0.6, ease: 'easeOut' }} />
        
      </div>

      <div className="pr-timer-time">
        <div className="pr-timer-clock">
          <p className="pr-timer-label">Таймер</p>
          <p className="pr-timer-value">{formatClock(remaining)}</p>
        </div>
        {isDone &&
        <span className="pr-timer-done">
            Практика завершена
          </span>
        }
      </div>

      <div className="pr-step-box">
        <p className="pr-step-label">
          Шаг {currentStepIndex + 1} из {practice.steps.length}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={`${practice.id}-${currentStepIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="pr-step-text">
            
            {practice.steps[currentStepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="pr-timer-actions">
        <motion.button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          disabled={isDone}
          whileTap={{ scale: 0.95 }}
          className={`btn ${isDone ? 'pr-btn-disabled' : 'btn-primary'}`}>
          
          {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
          {isPaused ? 'Продолжить' : 'Пауза'}
        </motion.button>
        <motion.button
          type="button"
          onClick={resetPractice}
          whileTap={{ scale: 0.95 }}
          className="btn btn-ghost">
          
          <RotateCcw size={14} />
          Сброс
        </motion.button>
        <motion.button
          type="button"
          onClick={onStop}
          whileTap={{ scale: 0.95 }}
          className="btn btn-danger">
          
          <Square size={14} />
          Стоп
        </motion.button>
      </div>
    </div>);

}

export default PracticeTimer;