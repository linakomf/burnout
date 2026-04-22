import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import { PRACTICE_CATEGORIES, PRACTICES } from './practicesData';
import './Practices.css';

const CHIP_PASTEL = {
  all: null,
  breath: 'practices-chip--breath',
  focus: 'practices-chip--meditation',
  grounding: 'practices-chip--reflection',
  video: 'practices-chip--video',
};

function matchCategory(practice, activeCategory) {
  if (activeCategory === 'all') return true;
  if (activeCategory === 'video') {
    return practice.category === 'restore' || practice.category === 'sleep';
  }
  return practice.category === activeCategory;
}

function Practices() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => new Set(['night-exhale', 'focus-single']));
  const [selectedPractice, setSelectedPractice] = useState(null);

  const practicesByCategory = useMemo(
    () => PRACTICES.filter((practice) => matchCategory(practice, activeCategory)),
    [activeCategory]
  );

  const toggleFavorite = (practiceId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(practiceId)) next.delete(practiceId);
      else next.add(practiceId);
      return next;
    });
  };

  return (
    <div className="practices-page fade-in">
      <header className="practices-hero">
        <h1 className="practices-title">{t('pages.practicesTitle')}</h1>
        <p className="practices-subtitle">{t('pages.practicesSub')}</p>
      </header>

      <div className="practices-chips" role="tablist" aria-label={t('pages.practicesFilter')}>
        {PRACTICE_CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          const pastel = CHIP_PASTEL[category.id];
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`practices-chip ${pastel || ''} ${isActive ? 'practices-chip--active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {t(`practiceCats.${category.id}`)}
            </button>
          );
        })}
      </div>

      <div className="practices-section-head">
        <h2 className="practices-section-title">{t('pages.practicesShort')}</h2>
      </div>

      <div className="practices-grid">
        {practicesByCategory.map((practice, index) => (
          <PracticeCard
            key={practice.id}
            practice={practice}
            isFavorite={favorites.has(practice.id)}
            onToggleFavorite={toggleFavorite}
            onPlay={setSelectedPractice}
            index={index}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedPractice && (
          <PracticeModal
            practice={selectedPractice}
            onClose={() => setSelectedPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Practices;
