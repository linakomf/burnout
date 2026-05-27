import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flower2, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import api from '../../utils/api';
import filmsCatalogHeroPhoto from '../../assets/films-catalog-hero-clouds.png';
import { loadMeditationFavorites, saveMeditationFavorites } from './meditationFavorites';
import { mapRemoteMeditationPayload } from './meditationHubData';
import { spaceHubHref } from './practiceSpaceConfig';
import SidebarCollapseButton from '../Layout/SidebarCollapseButton';

void SidebarCollapseButton;

const MEDITATION_FILTERS = [
  { id: 'all', labelKey: 'meditationFilterAll' },
  { id: 'anxiety', labelKey: 'meditationFilterAnxiety' },
  { id: 'sleep', labelKey: 'meditationFilterSleep' },
  { id: 'recovery', labelKey: 'meditationFilterRecovery' },
  { id: 'focus', labelKey: 'meditationFilterFocus' },
  { id: 'sounds', labelKey: 'meditationFilterSounds' },
];

export default function MeditationPracticeSection({ embedded = false }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const bodyRef = useRef(null);
  const [favorites, setFavorites] = useState(loadMeditationFavorites);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [remoteMeditations, setRemoteMeditations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/meditations')
      .then((res) => {
        const rows = res.data?.meditations || [];
        if (!cancelled) setRemoteMeditations(rows.map(mapRemoteMeditationPayload));
      })
      .catch(() => {
        if (!cancelled) setRemoteMeditations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => remoteMeditations, [remoteMeditations]);

  useEffect(() => {
    const openId = new URLSearchParams(location.search).get('open');
    if (!openId || !remoteMeditations.length) return;
    const found = remoteMeditations.find((p) => String(p.id) === String(openId));
    if (found) setSelectedPractice(found);
  }, [location.search, remoteMeditations]);

  const filteredList = useMemo(() => {
    const matchesFilter = (practice) => {
      if (activeFilter === 'all') {
        return !practice.meditationTopics?.includes('sounds');
      }
      return practice.meditationTopics?.includes(activeFilter);
    };
    return list.filter(matchesFilter);
  }, [list, activeFilter]);

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

  return (
    <div className={`meditation-hub meditation-hub--fullbleed hub-cover-cards fade-in${embedded ? ' meditation-hub--embedded' : ''}`}>
      <header className="meditation-hub-catalog-header">
        <div className="meditation-hub-mock">
          {!embedded ? (
            <div className="meditation-hub-hero-stage">
              <button
                type="button"
                className="meditation-hub-back"
                onClick={() => navigate(spaceHubHref())}>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                {t('pages.practicesBack')}
              </button>
              <div
                className="meditation-hub-hero-photo"
                style={{ backgroundImage: `url(${filmsCatalogHeroPhoto})` }}
                role="img"
                aria-label={t('pages.filmsCatalogHeroPhotoAlt')}
              />
            </div>
          ) : null}

          <div className={`meditation-hub-sheet${embedded ? ' meditation-hub-sheet--embedded' : ''}`}>
            {!embedded ? <div className="meditation-hub-sheet-notch" aria-hidden /> : null}

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
          </div>
        </div>
      </header>

      <section ref={bodyRef} className="meditation-hub-body" id="meditation-practices">
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
