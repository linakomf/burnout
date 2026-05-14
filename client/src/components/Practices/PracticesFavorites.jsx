import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import { PRACTICES } from './practicesData';
import { loadMeditationFavorites, saveMeditationFavorites } from './meditationFavorites';

const FAVORITE_CATEGORIES = [
  { id: 'films', labelKey: 'practicesPocketFilmsTitle' },
  { id: 'meditation', labelKey: 'practicesPocketMeditationTitle' },
  { id: 'podcasts', labelKey: 'practicesPocketPodcastsTitle' },
  { id: 'music', labelKey: 'practicesPocketMusicTitle' },
  { id: 'events', labelKey: 'practicesPocketEventsTitle' },
  { id: 'articles', labelKey: 'practicesPocketArticlesTitle' },
];

function isMeditationPractice(practice) {
  return practice.category === 'focus' || practice.category === 'grounding';
}

function PracticesFavorites() {
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState(loadMeditationFavorites);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [activeCategory, setActiveCategory] = useState('meditation');

  const meditationList = useMemo(() => PRACTICES.filter(isMeditationPractice), []);
  const favoritePractices = useMemo(
    () => meditationList.filter((practice) => favorites.has(practice.id)),
    [meditationList, favorites]
  );

  const visibleFavorites = useMemo(() => {
    if (activeCategory === 'meditation') return favoritePractices;
    return [];
  }, [activeCategory, favoritePractices]);

  useEffect(() => {
    saveMeditationFavorites(favorites);
  }, [favorites]);

  useEffect(() => {
    const syncFavorites = () => setFavorites(loadMeditationFavorites());
    window.addEventListener('storage', syncFavorites);
    window.addEventListener('focus', syncFavorites);
    return () => {
      window.removeEventListener('storage', syncFavorites);
      window.removeEventListener('focus', syncFavorites);
    };
  }, []);

  const toggleFavorite = (practiceId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(practiceId)) next.delete(practiceId);
      else next.add(practiceId);
      return next;
    });
  };

  return (
    <div className="practices-favorites-page fade-in">
      <header className="practices-favorites-header">
        <div className="practices-favorites-header-main">
          <h1 className="practices-favorites-title">
            {t('nav.favorites')}
            <Heart className="practices-favorites-title-mark" size={28} strokeWidth={1.65} aria-hidden />
          </h1>
          <p className="practices-favorites-lead">{t('pages.practicesFavoritesLead')}</p>
        </div>
      </header>

      <div
        className="practices-favorites-chips"
        role="tablist"
        aria-label={t('pages.practicesFavoritesFilterAria')}
      >
        {FAVORITE_CATEGORIES.map(({ id, labelKey }) => {
          const isActive = activeCategory === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`practices-favorites-chip ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(id)}
            >
              {t(`pages.${labelKey}`)}
            </button>
          );
        })}
      </div>

      <section className="practices-space-favorites meditation-hub" aria-label={t('nav.favorites')}>
        {visibleFavorites.length > 0 ? (
          <div className="meditation-hub-grid">
            {visibleFavorites.map((practice, index) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
                variant="meditation"
                isFavorite={favorites.has(practice.id)}
                onToggleFavorite={toggleFavorite}
                onPlay={setSelectedPractice}
                activeFilter="favorites"
                index={index}
              />
            ))}
          </div>
        ) : (
          <p className="practices-space-favorites-empty">{t('pages.practicesSpaceFavoritesEmpty')}</p>
        )}
      </section>

      <AnimatePresence>
        {selectedPractice && (
          <PracticeModal
            practice={selectedPractice}
            variant="meditation"
            activeFilter="favorites"
            favorite={favorites.has(selectedPractice.id)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PracticesFavorites;
