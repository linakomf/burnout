import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import PracticeCard from './PracticeCard';
import PracticeModal from './PracticeModal';
import PracticeCoverFavorite from './PracticeCoverFavorite';
import { PRACTICES } from './practicesData';
import {
  ARTICLES_LIBRARY,
  BOOKS_LIBRARY,
  mapRemoteArticlePayload,
  mapRemoteBookPayload,
  readingItemCategoryLabel,
  readingItemTitle,
} from './articlesHubData';
import { FILMS } from './filmsCatalogData';
import {
  findPlayableById,
  mapRemoteMusicTrack,
  mapRemoteQuickSound,
  MOOD_PLAYLISTS,
  MUSIC_TRACKS,
  musicArtist,
  musicGenre,
  musicTitle,
  QUICK_SOUNDS,
} from './musicHubData';
import { loadMeditationFavorites, saveMeditationFavorites } from './meditationFavorites';
import { mapRemoteMeditationPayload } from './meditationHubData';
import {
  findEpisodeById,
  mapRemotePodcastPayload,
  PODCAST_EPISODES,
  podcastMeta,
  podcastShow,
  podcastTitle,
} from './podcastHubData';
import { spaceSectionHref } from './practiceSpaceConfig';
import './FilmsPracticeHub.css';
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
  const [activeCategory, setActiveCategory] = useState('meditation');

  const [remoteFilms, setRemoteFilms] = useState([]);
  const [remoteArticles, setRemoteArticles] = useState([]);
  const [remoteBooks, setRemoteBooks] = useState([]);
  const [remoteMeditations, setRemoteMeditations] = useState([]);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [remoteQuick, setRemoteQuick] = useState([]);
  const [remotePodcasts, setRemotePodcasts] = useState([]);

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
    ]).then(([filmsRes, readingRes, medRes, musicRes, podRes]) => {
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

  const filmCatalog = useMemo(() => [...FILMS, ...remoteFilms], [remoteFilms]);
  const meditationList = useMemo(
    () => [...PRACTICES.filter(isMeditationPractice), ...remoteMeditations],
    [remoteMeditations]
  );
  const readingCatalog = useMemo(
    () => [...ARTICLES_LIBRARY, ...BOOKS_LIBRARY, ...remoteArticles, ...remoteBooks],
    [remoteArticles, remoteBooks]
  );
  const allTracks = useMemo(() => [...MUSIC_TRACKS, ...remoteTracks], [remoteTracks]);
  const allQuick = useMemo(() => [...QUICK_SOUNDS, ...remoteQuick], [remoteQuick]);
  const allPodcasts = useMemo(() => [...PODCAST_EPISODES, ...remotePodcasts], [remotePodcasts]);

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
      const mood = MOOD_PLAYLISTS.find((m) => m.id === id);
      if (mood) {
        items.push({ type: 'mood', data: mood });
        continue;
      }
      const track = findPlayableById(id, allTracks, allQuick);
      if (track) items.push({ type: 'track', data: track });
    }
    return items;
  }, [sectionFavs.music, allTracks, allQuick]);

  const favoritePodcasts = useMemo(
    () =>
      [...sectionFavs.podcasts]
        .map((id) => findEpisodeById(id, allPodcasts))
        .filter(Boolean),
    [sectionFavs.podcasts, allPodcasts]
  );

  const countsByCategory = useMemo(
    () => ({
      films: favoriteFilms.length,
      meditation: favoriteMeditations.length,
      podcasts: favoritePodcasts.length,
      music: favoriteMusic.length,
      events: 0,
      articles: favoriteReading.length,
    }),
    [favoriteFilms, favoriteMeditations, favoritePodcasts, favoriteMusic, favoriteReading]
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
                  </div>
                  <h3 className="flix-film-card__title">{film.title}</h3>
                  <div className="flix-film-card__meta">
                    <span className="flix-film-card__star" aria-hidden>
                      ★
                    </span>
                    {(film.rating && String(film.rating).trim()) || '—'} ·{' '}
                    {(film.year && String(film.year).trim()) || '—'}
                  </div>
                  <span className="flix-psych-tag">{t(`pages.filmPsych_${film.psychTag}`)}</span>
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
          <div className="practices-favorites-music">
            {favoriteMusic.map((entry) =>
              entry.type === 'mood' ? (
                <button
                  key={entry.data.id}
                  type="button"
                  className="music-hub-mood-card practices-favorites-mood-card"
                  onClick={() => navigate(spaceSectionHref('music'))}
                >
                  <span
                    className="music-hub-mood-media"
                    style={{ backgroundImage: `url(${entry.data.image})` }}
                  />
                  <PracticeCoverFavorite
                    isFavorite
                    onToggle={() => toggleSectionFavorite('music', entry.data.id)}
                    ariaLabel={t('pages.meditationModalFavorite')}
                  />
                  <span className="music-hub-mood-overlay" />
                  <span className="music-hub-mood-body">
                    <span className="music-hub-mood-label">{t(`pages.${entry.data.labelKey}`)}</span>
                  </span>
                </button>
              ) : (
                <button
                  key={entry.data.id}
                  type="button"
                  className="practices-favorites-music-track"
                  onClick={() => navigate(spaceSectionHref('music'))}
                >
                  <span className="music-hub-rec-thumb-wrap">
                    <span
                      className="music-hub-rec-thumb"
                      style={{ backgroundImage: `url(${entry.data.poster})` }}
                    />
                    <PracticeCoverFavorite
                      isFavorite
                      onToggle={() => toggleSectionFavorite('music', entry.data.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                  </span>
                  <span className="practices-favorites-music-track-meta">
                    <strong>{musicTitle(entry.data, t)}</strong>
                    <span>
                      {musicArtist(entry.data, t)} · {musicGenre(entry.data, t)}
                    </span>
                  </span>
                </button>
              )
            )}
          </div>
        );

      case 'podcasts':
        if (favoritePodcasts.length === 0) return null;
        return (
          <ul className="practices-favorites-podcasts">
            {favoritePodcasts.map((ep) => (
              <li key={ep.id}>
                <button
                  type="button"
                  className="practices-favorites-podcast-row"
                  onClick={() => navigate(spaceSectionHref('podcasts'))}
                >
                  <span className="podcast-hub-recent-thumb-wrap">
                    <span
                      className="podcast-hub-recent-thumb"
                      style={{ backgroundImage: `url(${ep.poster})` }}
                    />
                    <PracticeCoverFavorite
                      isFavorite
                      onToggle={() => toggleSectionFavorite('podcasts', ep.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                  </span>
                  <span className="practices-favorites-podcast-meta">
                    <strong>{podcastTitle(ep, t)}</strong>
                    <span>
                      {podcastShow(ep, t)} · {podcastMeta(ep, t)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        );

      case 'meditation':
        if (favoriteMeditations.length === 0) return null;
        return (
          <div className="meditation-hub-grid">
            {favoriteMeditations.map((practice, index) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
                variant="meditation"
                isFavorite={meditationFavs.has(practice.id)}
                onToggleFavorite={toggleMeditationFavorite}
                onPlay={setSelectedPractice}
                activeFilter="favorites"
                index={index}
              />
            ))}
          </div>
        );

      case 'events':
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

      <section className="practices-space-favorites meditation-hub" aria-label={t('nav.favorites')}>
        {content || <p className="practices-space-favorites-empty">{t(`pages.${emptyKey}`)}</p>}
      </section>

      <AnimatePresence>
        {selectedPractice && (
          <PracticeModal
            practice={selectedPractice}
            variant="meditation"
            activeFilter="favorites"
            favorite={meditationFavs.has(selectedPractice.id)}
            onToggleFavorite={toggleMeditationFavorite}
            onClose={() => setSelectedPractice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default PracticesFavorites;
