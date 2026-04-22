import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import PracticeTimer from './PracticeTimer';

function PracticeModal({ practice, onClose }) {
  const [completed, setCompleted] = useState(false);

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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="modal-overlay practices-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}>
        
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="modal-card card practices-modal-card practices-theme"
          onClick={(event) => event.stopPropagation()}>
          
          <button
            type="button"
            onClick={handleClose}
            className="practices-modal-close"
            aria-label="Закрыть">
            
            <X size={18} />
          </button>

          <p className="practices-modal-format">{practice.format}</p>
          <h2 className="practices-modal-title">
            <span aria-hidden>{practice.emoji || '🌸'}</span> {practice.title}
          </h2>
          <p className="practices-modal-desc">{practice.description}</p>

          <PracticeTimer
            practice={practice}
            onComplete={() => {
              setCompleted(true);
            }}
            onStop={handleClose} />
          

          <div className="practices-modal-note">
            {completed ?
            'Класс. Можно повторить практику или выбрать следующую.' :
            'Формат и управление такие же простые, как в блоке тестов.'}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default PracticeModal;