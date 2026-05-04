import React, { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flower2 } from 'lucide-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import FilmsPracticeHub from './FilmsPracticeHub';
import PodcastsPracticeHub from './PodcastsPracticeHub';
import MusicPracticeHub from './MusicPracticeHub';
import ArticlesPracticeHub from './ArticlesPracticeHub';
import FilmsBannerCollectionPage from './FilmsBannerCollectionPage';
import FilmDetailPage from './FilmDetailPage';
import EventsPracticeHub from './EventsPracticeHub';
import EventDetailPage from './EventDetailPage';
import PracticesHome from './PracticesHome';
import { PRACTICES } from './practicesData';
import { spaceNature } from './spaceNatureImagery';
import './Practices.css';

function matchCategory(practice, categoryId) {
  if (categoryId === 'meditation') {
    return practice.category === 'focus' || practice.category === 'grounding';
  }
  return practice.category === categoryId;
}

function MeditationSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState(() => new Set(['night-exhale', 'focus-single']));
  const [selectedPractice, setSelectedPractice] = useState(null);

  const list = useMemo(() => PRACTICES.filter((p) => matchCategory(p, 'meditation')), []);

  const heroSrc = spaceNature.meditationHero;

  const toggleFavorite = (practiceId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(practiceId)) next.delete(practiceId);
      else next.add(practiceId);
      return next;
    });
  };

  return (
    <div className="meditation-hub meditation-hub--fullbleed fade-in">
      <button type="button" className="meditation-hub-back" onClick={() => navigate('/practices')}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        {t('pages.practicesBackToHub')}
      </button>

      <header className="meditation-hub-hero" aria-labelledby="meditation-hero-title">
        <div className="meditation-hub-hero-copy">
          <h1 id="meditation-hero-title" className="meditation-hub-title">
            {t('pages.meditationPageTitle')}
          </h1>
          <p className="meditation-hub-lead">{t('pages.meditationPageLead')}</p>
        </div>
        <div className="meditation-hub-hero-visual" aria-hidden>
          <span className="meditation-hub-deco meditation-hub-deco--a" />
          <span className="meditation-hub-deco meditation-hub-deco--b" />
          <img src={heroSrc} alt="" className="meditation-hub-hero-img" width={520} height={400} />
        </div>
      </header>

      <section className="meditation-hub-body" aria-labelledby="meditation-practices-heading">
        <h2 id="meditation-practices-heading" className="meditation-hub-section-title">
          {t('pages.practicesShort')}
        </h2>
        <div className="meditation-hub-grid">
          {list.map((practice, index) => (
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
      </section>

      <p className="meditation-hub-tagline">
        <Flower2 className="meditation-hub-tagline-flower" size={18} strokeWidth={2} aria-hidden />
        <span>{t('pages.meditationFooterTagline')}</span>
        <Flower2 className="meditation-hub-tagline-flower" size={18} strokeWidth={2} aria-hidden />
      </p>

      <AnimatePresence>
        {selectedPractice && (
          <PracticeModal
            practice={selectedPractice}
            variant="meditation"
            favorite={favorites.has(selectedPractice.id)}
            onToggleFavorite={toggleFavorite}
            onClose={() => setSelectedPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Practices() {
  const { pathname } = useLocation();
  const isEventDetailPage = /^\/practices\/events\/.+/.test(pathname);
  const isFilmDetailPage = /^\/practices\/films\/(?!collections)[^/]+$/.test(pathname);

  return (
    <div
      className={`practices-page practices-page--hub fade-in${
        isEventDetailPage ? ' practices-page--event-detail' : ''
      }${isFilmDetailPage ? ' practices-page--film-detail' : ''}`}
    >
      <Routes>
        <Route index element={<PracticesHome />} />
        <Route path="films/collections/:bannerId" element={<FilmsBannerCollectionPage />} />
        <Route path="films/:filmId" element={<FilmDetailPage />} />
        <Route path="films" element={<FilmsPracticeHub />} />
        <Route path="meditation" element={<MeditationSection />} />
        <Route path="podcasts" element={<PodcastsPracticeHub />} />
        <Route path="music" element={<MusicPracticeHub />} />
        <Route path="articles" element={<ArticlesPracticeHub />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
        <Route path="events" element={<EventsPracticeHub />} />
        <Route path="*" element={<Navigate to="/practices" replace />} />
      </Routes>
    </div>
  );
}

export default Practices;
