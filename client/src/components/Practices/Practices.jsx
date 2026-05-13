import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flower2, Heart } from 'lucide-react';
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
import { loadMeditationFavorites, saveMeditationFavorites } from './meditationFavorites';
import { MEDITATION_HERO_BANNER_VIDEO, SPACE_NATURE_HERO_REF } from './spaceNatureImagery';
import './Practices.css';

function matchCategory(practice, categoryId) {
  if (categoryId === 'meditation') {
    return practice.category === 'focus' || practice.category === 'grounding';
  }
  return practice.category === categoryId;
}

const MEDITATION_FILTERS = [
  { id: 'all', labelKey: 'meditationFilterAll' },
  { id: 'anxiety', labelKey: 'meditationFilterAnxiety' },
  { id: 'sleep', labelKey: 'meditationFilterSleep' },
  { id: 'recovery', labelKey: 'meditationFilterRecovery' },
  { id: 'focus', labelKey: 'meditationFilterFocus' },
  { id: 'sounds', labelKey: 'meditationFilterSounds' },
  { id: 'favorites', labelKey: 'meditationFilterFavorites' },
];

function MeditationSection() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const bodyRef = useRef(null);
  const [favorites, setFavorites] = useState(loadMeditationFavorites);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const list = useMemo(() => PRACTICES.filter((p) => matchCategory(p, 'meditation')), []);

  const filteredList = useMemo(() => {
    if (activeFilter === 'favorites') {
      return list.filter((practice) => favorites.has(practice.id));
    }

    const matchesFilter = (practice) => {
      if (activeFilter === 'all') {
        return !practice.meditationTopics?.includes('sounds');
      }
      return practice.meditationTopics?.includes(activeFilter);
    };

    return list.filter(matchesFilter);
  }, [list, activeFilter, favorites]);

  useEffect(() => {
    saveMeditationFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = (practiceId) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(practiceId)) next.delete(practiceId);
      else next.add(practiceId);
      return next;
    });
  };

  const scrollToPractices = () => {
    bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="meditation-hub meditation-hub--fullbleed fade-in">
      <header className="meditation-hub-banner">
        <div className="meditation-hub-banner-head">
          <button type="button" className="meditation-hub-back" onClick={() => navigate('/practices')}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            {t('pages.practicesBackToHub')}
          </button>
        </div>

        <div className="practices-landing-hero practices-landing-hero--airy">
          <div className="practices-landing-hero-flowers" aria-hidden>
            <span className="practices-flower practices-flower--1" />
            <span className="practices-flower practices-flower--2" />
            <span className="practices-flower practices-flower--3" />
            <span className="practices-flower practices-flower--4" />
          </div>

          <div className="practices-landing-hero-photo" aria-hidden>
            <video
              className="practices-landing-hero-photo-media"
              autoPlay
              muted
              loop
              playsInline
              poster={SPACE_NATURE_HERO_REF}
            >
              <source src={MEDITATION_HERO_BANNER_VIDEO} type="video/mp4" />
            </video>
          </div>

          <div className="practices-landing-hero-airwash" aria-hidden />

          <div className="practices-landing-hero-inner practices-landing-hero-inner--airy">
            <h1 className="practices-hero-title practices-hero-title--airy">
              {t('pages.meditationPageTitle')}
            </h1>
            <p className="practices-landing-lead practices-landing-lead--airy">{t('pages.meditationPageLead')}</p>
            <button type="button" className="practices-space-cta" onClick={scrollToPractices}>
              <span className="practices-space-cta-label">{t('pages.meditationBannerCta')}</span>
              <span className="practices-space-cta-icon" aria-hidden>
                <ArrowRight size={20} strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <section className="meditation-formats" aria-labelledby="meditation-formats-heading">
        <div className="meditation-formats-deco" aria-hidden>
          <svg className="practices-wave-doodle" viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 100 C 200 40 400 160 600 100 S 1000 40 1200 100"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeDasharray="3 12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="meditation-formats-inner">
          <div className="meditation-formats-head">
            <p className="practices-section-eyebrow meditation-formats-eyebrow">
              <Heart className="practices-section-heart" size={16} strokeWidth={2} aria-hidden />
              {t('pages.meditationFormatsEyebrow')}
            </p>
            <h2 id="meditation-formats-heading" className="meditation-formats-title">
              <span>{t('pages.meditationFormatsTitleLead')}</span>
              <Flower2 className="meditation-formats-title-mark" size={22} strokeWidth={1.8} aria-hidden />
              <span>{t('pages.meditationFormatsTitleMid')}</span>
            </h2>
            <p className="meditation-formats-subtitle">{t('pages.meditationFormatsSubtitle')}</p>
          </div>

          <div className="meditation-formats-columns">
            <p className="meditation-formats-copy">{t('pages.meditationFormatsColLeft')}</p>
            <p className="meditation-formats-copy">{t('pages.meditationFormatsColRight')}</p>
          </div>

          <div
            className="meditation-formats-filters"
            role="group"
            aria-label={t('pages.meditationFiltersAria')}
          >
            {MEDITATION_FILTERS.map(({ id, labelKey }) => {
              const isActive = activeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`meditation-formats-filter ${isActive ? 'is-active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(id)}
                >
                  {t(`pages.${labelKey}`)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={bodyRef}
        className="meditation-hub-body"
        id="meditation-practices"
      >
        <div className="meditation-hub-grid">
          {filteredList.map((practice, index) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
              variant="meditation"
              isFavorite={favorites.has(practice.id)}
              onToggleFavorite={toggleFavorite}
              onPlay={setSelectedPractice}
              activeFilter={activeFilter}
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
            activeFilter={activeFilter}
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
  const isArticlesHubPage = pathname === '/practices/articles';

  return (
    <div
      className={`practices-page practices-page--hub fade-in${
        isEventDetailPage ? ' practices-page--event-detail' : ''
      }${isFilmDetailPage ? ' practices-page--film-detail' : ''}${
        isArticlesHubPage ? ' practices-page--articles-hub' : ''
      }`}
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
