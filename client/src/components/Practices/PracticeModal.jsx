import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Clock, Droplets, Flower2, Leaf, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import PracticeTimer from './PracticeTimer';

const defaultMeditationCover = `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}/meditation/meditation-modal-cover.png`;

function PracticeModal({ practice, onClose, variant = 'default', favorite = false, onToggleFavorite }) {
  const { t } = useLanguage();
  const [completed, setCompleted] = useState(false);
  const isMeditation = variant === 'meditation';

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [handleClose]);

  useEffect(() => {
    setCompleted(false);
  }, [practice.id]);

  if (typeof document === 'undefined') return null;

  const coverSrc = practice.coverImage || defaultMeditationCover;
  const durationLabel = `${String(practice.durationMin).padStart(2, '0')}:00`;
  const practiceTitle = practice.titleKey ? t(`pages.${practice.titleKey}`) : practice.title;

  const meditationBody = (
    <>
      <div className="practices-modal-meditation-top">
        <span className="practices-modal-meditation-tag">
          <Droplets size={15} strokeWidth={2.2} aria-hidden />
          {t('pages.meditationModalTag')}
        </span>
        <button type="button" onClick={handleClose} className="practices-modal-close practices-modal-close--light" aria-label={t('pages.meditationModalClose')}>
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="practices-modal-meditation-hero">
        <div className="practices-modal-meditation-cover" style={{ backgroundImage: `url(${coverSrc})` }} role="img" aria-hidden />
        <div className="practices-modal-meditation-copy">
          <h2 className="practices-modal-meditation-title">{practiceTitle}</h2>
          <p className="practices-modal-meditation-subtitle">{practice.format}</p>
          <p className="practices-modal-meditation-desc">{practice.description}</p>
        </div>
      </div>

      <div className="practices-modal-meditation-meta">
        <div className="practices-modal-meditation-meta-cell">
          <Clock size={18} strokeWidth={2} className="practices-modal-meditation-meta-ico" aria-hidden />
          <strong>{durationLabel}</strong>
          <span>{t('pages.meditationModalDuration')}</span>
        </div>
        <div className="practices-modal-meditation-meta-cell">
          <BarChart3 size={18} strokeWidth={2} className="practices-modal-meditation-meta-ico" aria-hidden />
          <strong>{practice.mood}</strong>
          <span>{t('pages.meditationModalFocusLabel')}</span>
        </div>
        <div className="practices-modal-meditation-meta-cell">
          <Leaf size={18} strokeWidth={2} className="practices-modal-meditation-meta-ico" aria-hidden />
          <strong>{t('pages.meditationModalLevelBeginner')}</strong>
          <span>{t('pages.meditationModalLevelLabel')}</span>
        </div>
      </div>

      <PracticeTimer
        practice={practice}
        layout="meditation"
        favorite={favorite}
        onToggleFavorite={() => onToggleFavorite?.(practice.id)}
        t={t}
        onComplete={() => setCompleted(true)}
        onStop={handleClose}
      />

      <div className="practices-modal-meditation-tip">
        <Flower2 size={22} strokeWidth={2} className="practices-modal-meditation-tip-flower" aria-hidden />
        <div className="practices-modal-meditation-tip-copy">
          <strong>{t('pages.meditationModalTipTitle')}</strong>
          <p>{completed ? t('pages.meditationModalTipDone') : t('pages.meditationModalTipBody')}</p>
        </div>
        <span className="practices-modal-meditation-tip-deco" aria-hidden />
      </div>
    </>
  );

  const defaultBody = (
    <>
      <button type="button" onClick={handleClose} className="practices-modal-close" aria-label={t('pages.meditationModalClose')}>
        <X size={18} />
      </button>

      <p className="practices-modal-format">{practice.format}</p>
      <h2 className="practices-modal-title">
        <span aria-hidden>{practice.emoji || '🌸'}</span> {practiceTitle}
      </h2>
      <p className="practices-modal-desc">{practice.description}</p>

      <PracticeTimer practice={practice} onComplete={() => setCompleted(true)} onStop={handleClose} />

      <div className="practices-modal-note">
        {completed
          ? t('pages.meditationModalCompleteNote')
          : t('pages.meditationModalDefaultNote')}
      </div>
    </>
  );

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={`modal-overlay practices-modal-overlay${isMeditation ? ' practices-modal-overlay--meditation' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`modal-card card practices-modal-card practices-theme${isMeditation ? ' practices-modal-card--meditation' : ''}`}
          onClick={(event) => event.stopPropagation()}
        >
          {isMeditation ? meditationBody : defaultBody}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default PracticeModal;
