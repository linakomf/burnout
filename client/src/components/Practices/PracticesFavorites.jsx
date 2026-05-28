import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import PracticeCoverFavorite from './PracticeCoverFavorite';
import {
  isRemoteArticleId,
  isRemoteBookId,
  mapRemoteArticlePayload,
  mapRemoteBookPayload,
  readingItemCategoryLabel,
  readingItemTitle,
} from './articlesHubData';
import { isRemoteEventId, mapRemoteEventPayload } from './eventsHubData';
import { isRemoteFilmId } from './filmsCatalogData';
import {
  findPlayableById,
  isRemoteMusicId,
  mapRemoteMusicTrack,
  mapRemoteQuickSound,
  musicArtist,
  musicGenre,
  musicTitle,
} from './musicHubData';
import { loadMeditationFavorites, saveMeditationFavorites } from './meditationFavorites';
import { isRemoteMeditationId, mapRemoteMeditationPayload } from './meditationHubData';
import { EventGridCard } from './EventsPracticeHubParts';
import {
  episodeToPracticeCard,
  findEpisodeById,
  isRemotePodcastId,
  mapRemotePodcastPayload,
} from './podcastHubData';
import { spaceSectionHref } from './practiceSpaceConfig';
import SidebarCollapseButton from '../Layout/SidebarCollapseButton';
import './FilmsPracticeHub.css';
import './EventsPracticeHub.css';
import './ArticlesPracticeHub.css';
import './MusicPracticeHub.css';
import './PodcastsPracticeHub.css';
import {
  FAVORITES_CHANGED_EVENT,
  FAVORITES_KEYS,
  loadAllSectionFavoriteSets,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';

void SidebarCollapseButton;

const FAVORITE_CATEGORIES = [
  { id: 'films', labelKey: 'practicesPocketFilmsTitle' },
  { id: 'meditation', labelKey: 'practicesPocketMeditationTitle' },
  { id: 'podcasts', labelKey: 'practicesPocketPodcastsTitle' },
  { id: 'music', labelKey: 'practicesPocketMusicTitle' },
  { id: 'events', labelKey: 'practicesPocketEventsTitle' },
  { id: 'articles', labelKey: 'practicesPocketArticlesTitle' },
];

function normalizeRemoteFilm(f) {
  return {
    ...f,
    poster: backendPublicUrl(f.poster),
  };
}

function PracticesFavorites() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [meditationFavs, setMeditationFavs] = useState(loadMeditationFavorites);
  const [sectionFavs, setSectionFavs] = useState(loadAllSectionFavoriteSets);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [modalVariant, setModalVariant] = useState('meditation');
  const [activeCategory, setActiveCategory] = useState('meditation');

  const [remoteFilms, setRemoteFilms] = useState([]);
  const [remoteArticles, setRemoteArticles] = useState([]);
  const [remoteBooks, setRemoteBooks] = useState([]);
  const [remoteMeditations, setRemoteMeditations] = useState([]);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [remoteQuick, setRemoteQuick] = useState([]);
  const [remotePodcasts, setRemotePodcasts] = useState([]);
  const [remoteEvents, setRemoteEvents] = useState([]);

  const reloadFavorites = useCallback(() => {
    setMeditationFavs(loadMeditationFavorites());
    setSectionFavs(loadAllSectionFavoriteSets());
  }, []);

  useEffect(() => {
    saveMeditationFavorites(meditationFavs);
  }, [meditationFavs]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/films').catch(() => ({ data: { films: [] } })),
      api.get('/reading').catch(() => ({ data: { items: [] } })),
      api.get('/meditations').catch(() => ({ data: { meditations: [] } })),
      api.get('/music').catch(() => ({ data: { items: [] } })),
      api.get('/podcasts').catch(() => ({ data: { episodes: [] } })),
      api.get('/events').catch(() => ({ data: { events: [] } })),
    ]).then(([filmsRes, readingRes, medRes, musicRes, podRes, eventsRes]) => {
      if (cancelled) return;
      setRemoteFilms((filmsRes.data?.films || []).map(normalizeRemoteFilm));
      const rows = readingRes.data?.items || [];
      setRemoteArticles(
        rows.filter((r) => r.kind === 'article').map((r) => mapRemoteArticlePayload(r, backendPublicUrl))
      );
      setRemoteBooks(
        rows.filter((r) => r.kind === 'book').map((r) => mapRemoteBookPayload(r, backendPublicUrl))
      );
      setRemoteMeditations((medRes.data?.meditations || []).map(mapRemoteMeditationPayload));
      const musicItems = musicRes.data?.items || [];
      setRemoteTracks(
        musicItems.filter((r) => r.kind === 'track').map((r) => mapRemoteMusicTrack(r, backendPublicUrl))
      );
      setRemoteQuick(
        musicItems.filter((r) => r.kind === 'quick').map((r) => mapRemoteQuickSound(r, backendPublicUrl))
      );
      setRemotePodcasts(
        (podRes.data?.episodes || []).map((r) => mapRemotePodcastPayload(r, backendPublicUrl))
      );
      setRemoteEvents(
        (eventsRes.data?.events || []).map((r) => mapRemoteEventPayload(r, backendPublicUrl))
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onChange = () => reloadFavorites();
    window.addEventListener('storage', onChange);
    window.addEventListener('focus', onChange);
    window.addEventListener(FAVORITES_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('focus', onChange);
      window.removeEventListener(FAVORITES_CHANGED_EVENT, onChange);
    };
  }, [reloadFavorites]);

  const filmCatalog = remoteFilms;
  const meditationList = remoteMeditations;
  const readingCatalog = useMemo(
    () => [...remoteArticles, ...remoteBooks],
    [remoteArticles, remoteBooks]
  );
  const allTracks = remoteTracks;
  const allQuick = remoteQuick;
  const podcastCatalog = remotePodcasts;
  const eventCatalog = remoteEvents;

  const pruneSectionFavoriteKey = useCallback((key, isValidId) => {
    setSectionFavs((prev) => {
      const pruned = [...prev[key]].filter((id) => isValidId(id));
      if (pruned.length === prev[key].size) return prev;
      const nextSet = new Set(pruned);
      saveSectionFavorites(FAVORITES_KEYS[key], nextSet);
      return { ...prev, [key]: nextSet };
    });
  }, []);

  useEffect(() => {
    pruneSectionFavoriteKey('films', isRemoteFilmId);
  }, [remoteFilms, pruneSectionFavoriteKey]);

  useEffect(() => {
    pruneSectionFavoriteKey('reading', (id) => isRemoteArticleId(id) || isRemoteBookId(id));
  }, [remoteArticles, remoteBooks, pruneSectionFavoriteKey]);

  useEffect(() => {
    pruneSectionFavoriteKey('music', isRemoteMusicId);
  }, [remoteTracks, remoteQuick, pruneSectionFavoriteKey]);

  useEffect(() => {
    pruneSectionFavoriteKey('podcasts', isRemotePodcastId);
  }, [remotePodcasts, pruneSectionFavoriteKey]);

  useEffect(() => {
    pruneSectionFavoriteKey('events', isRemoteEventId);
  }, [remoteEvents, pruneSectionFavoriteKey]);

  useEffect(() => {
    setMeditationFavs((prev) => {
      const pruned = [...prev].filter((id) => isRemoteMeditationId(id));
      if (pruned.length === prev.size) return prev;
      return new Set(pruned);
    });
  }, [remoteMeditations]);

  const favoriteFilms = useMemo(
    () =>
      [...sectionFavs.films]
        .map((id) => filmCatalog.find((f) => f.id === id))
        .filter(Boolean),
    [sectionFavs.films, filmCatalog]
  );

  const favoriteMeditations = useMemo(
    () => meditationList.filter((p) => meditationFavs.has(p.id)),
    [meditationList, meditationFavs]
  );

  const favoriteReading = useMemo(
    () =>
      [...sectionFavs.reading]
        .map((id) => readingCatalog.find((item) => item.id === id))
        .filter(Boolean),
    [sectionFavs.reading, readingCatalog]
  );

  const favoriteMusic = useMemo(() => {
    const items = [];
    for (const id of sectionFavs.music) {
      if (!isRemoteMusicId(id)) continue;
      const track = findPlayableById(id, allTracks, allQuick);
      if (track) items.push({ type: 'track', data: track });
    }
    return items;
  }, [sectionFavs.music, allTracks, allQuick]);

  const favoritePodcasts = useMemo(
    () =>
      [...sectionFavs.podcasts]
        .map((id) => findEpisodeById(id, podcastCatalog))
        .filter(Boolean),
    [sectionFavs.podcasts, podcastCatalog]
  );

  const favoriteEvents = useMemo(
    () =>
      [...sectionFavs.events]
        .map((id) => eventCatalog.find((item) => item.id === id))
        .filter(Boolean),
    [sectionFavs.events, eventCatalog]
  );

  const countsByCategory = useMemo(
    () => ({
      films: favoriteFilms.length,
      meditation: favoriteMeditations.length,
      podcasts: favoritePodcasts.length,
      music: favoriteMusic.length,
      events: favoriteEvents.length,
      articles: favoriteReading.length,
    }),
    [favoriteFilms, favoriteMeditations, favoritePodcasts, favoriteMusic, favoriteEvents, favoriteReading]
  );

  const toggleMeditationFavorite = (practiceId) => {
    setMeditationFavs((prev) => toggleInFavoriteSet(prev, practiceId));
  };

  const toggleSectionFavorite = (key, id) => {
    setSectionFavs((prev) => {
      const next = {
        ...prev,
        [key]: toggleInFavoriteSet(prev[key], id),
      };
      saveSectionFavorites(FAVORITES_KEYS[key], next[key]);
      return next;
    });
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'films':
        if (favoriteFilms.length === 0) return null;
        return (
          <div className="flix-scope flix-scope--mindwell practices-favorites-films-scope">
            <div className="practices-favorites-films flix-film-grid">
              {favoriteFilms.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  className="flix-film-card"
                  onClick={() => navigate(`/practices/films/${film.id}`)}
                >
                  <div className="flix-film-card__poster-wrap">
                    <img src={film.poster} alt="" className="flix-film-card__poster" loading="lazy" />
                    <PracticeCoverFavorite
                      isFavorite
                      onToggle={() => toggleSectionFavorite('films', film.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                    <span className="flix-psych-tag">{t(`pages.filmPsych_${film.psychTag}`)}</span>
                  </div>
                  <h3 className="flix-film-card__title">{film.title}</h3>
                  <div className="flix-film-card__meta">
                    <span className="flix-film-card__star" aria-hidden>
                      ★
                    </span>
                    {(film.rating && String(film.rating).trim()) || '—'} ·{' '}
                    {(film.year && String(film.year).trim()) || '—'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'articles':
        if (favoriteReading.length === 0) return null;
        return (
          <div className="practices-favorites-reading">
            {favoriteReading.map((item) => (
              <button
                key={item.id}
                type="button"
                className="articles-books-card practices-favorites-reading-card"
                onClick={() =>
                  navigate(
                    item.kind === 'book'
                      ? `/practices/articles/book/${item.id}`
                      : `/practices/articles/read/${item.id}`
                  )
                }
              >
                <div className="articles-books-card-stack">
                  <div className="articles-books-card-page-shadow" aria-hidden />
                  <div className="articles-books-card-poster-wrap">
                    <div
                      className="articles-books-card-poster"
                      style={{ backgroundImage: `url(${item.image})` }}
                      aria-hidden
                    />
                    <PracticeCoverFavorite
                      isFavorite
                      onToggle={() => toggleSectionFavorite('reading', item.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                    <span className="articles-books-card-tag">{readingItemCategoryLabel(item, t)}</span>
                  </div>
                </div>
                <h3 className="articles-books-card-title">{readingItemTitle(item, t)}</h3>
              </button>
            ))}
          </div>
        );

      case 'music':
        if (favoriteMusic.length === 0) return null;
        return (
          <div className="music-hub music-hub--favorites-strip">
            <ul className="music-hub-rec-list">
              {favoriteMusic.map((entry) => {
                const item = entry.data;
                return (
                  <li key={item.id} className="music-hub-rec-row">
                    <button
                      type="button"
                      className="music-hub-rec-cover"
                      onClick={() =>
                        navigate(`${spaceSectionHref('music')}?play=${encodeURIComponent(item.id)}`)
                      }
                      aria-label={t('pages.musicPlay')}
                    >
                      <span
                        className="music-hub-rec-thumb"
                        style={{ backgroundImage: `url(${item.poster})` }}
                        aria-hidden
                      />
                      <span className="music-hub-rec-cover-play" aria-hidden>
                        <Play size={20} fill="currentColor" strokeWidth={0} />
                      </span>
                    </button>
                    <div className="music-hub-rec-meta">
                      <strong className="music-hub-rec-title">{musicTitle(item, t)}</strong>
                      <span className="music-hub-rec-sub">
                        {musicArtist(item, t)} · {musicGenre(item, t)}
                      </span>
                    </div>
                    <span className="music-hub-rec-dur">{item.durationShort || '—'}</span>
                    <button
                      type="button"
                      className="music-hub-rec-fav is-on"
                      aria-label={t('pages.meditationModalFavorite')}
                      aria-pressed
                      onClick={() => toggleSectionFavorite('music', item.id)}
                    >
                      <Heart size={18} strokeWidth={2} fill="currentColor" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );

      case 'podcasts':
        if (favoritePodcasts.length === 0) return null;
        return (
          <div className="meditation-hub-body hub-cover-cards">
            <div className="meditation-hub-grid podcast-hub-grid">
              {favoritePodcasts.map((ep, index) => (
                <PracticeCard
                  key={ep.id}
                  practice={episodeToPracticeCard(ep, t)}
                  variant="podcast"
                  isFavorite={sectionFavs.podcasts.has(ep.id)}
                  onToggleFavorite={() => toggleSectionFavorite('podcasts', ep.id)}
                  onPlay={(practice) => {
                    setModalVariant('podcast');
                    setSelectedPractice(practice);
                  }}
                  activeFilter="favorites"
                  index={index}
                />
              ))}
            </div>
          </div>
        );

      case 'meditation':
        if (favoriteMeditations.length === 0) return null;
        return (
          <div className="meditation-hub-body hub-cover-cards">
            <div className="meditation-hub-grid">
              {favoriteMeditations.map((practice, index) => (
                <PracticeCard
                  key={practice.id}
                  practice={practice}
                  variant="meditation"
                  isFavorite={meditationFavs.has(practice.id)}
                  onToggleFavorite={toggleMeditationFavorite}
                  onPlay={(practice) => {
                    setModalVariant('meditation');
                    setSelectedPractice(practice);
                  }}
                  activeFilter="favorites"
                  index={index}
                />
              ))}
            </div>
          </div>
        );

      case 'events':
        if (favoriteEvents.length === 0) return null;
        return (
          <div className="flix-catalog-section events-flix-results hub-cover-cards">
            <div className="events-flix-grid">
              {favoriteEvents.map((item) => (
                <EventGridCard
                  key={item.id}
                  item={item}
                  t={t}
                  isFavorite={sectionFavs.events.has(item.id)}
                  onToggleFavorite={() => toggleSectionFavorite('events', item.id)}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = renderContent();
  const emptyKey =
    activeCategory === 'events'
      ? 'practicesFavoritesEmptyEvents'
      : 'practicesSpaceFavoritesEmpty';

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
          const count = countsByCategory[id];
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
              {count > 0 ? <span className="practices-favorites-chip-count">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <section className="practices-space-favorites" aria-label={t('nav.favorites')}>
        {content || <p className="practices-space-favorites-empty">{t(`pages.${emptyKey}`)}</p>}
      </section>

      <AnimatePresence>
        {selectedPractice && (
          <PracticeModal
            practice={selectedPractice}
            variant={modalVariant}
            activeFilter="favorites"
            favorite={
              modalVariant === 'podcast'
                ? sectionFavs.podcasts.has(selectedPractice.id)
                : meditationFavs.has(selectedPractice.id)
            }
            onToggleFavorite={() => {
              if (modalVariant === 'podcast') {
                toggleSectionFavorite('podcasts', selectedPractice.id);
              } else {
                toggleMeditationFavorite(selectedPractice.id);
              }
            }}
            onClose={() => setSelectedPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PracticesFavorites;
