import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Clock,
  Heart,
  Mic2,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spaceHubHref } from './practiceSpaceConfig';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import MeditationAudioPlayer from './MeditationAudioPlayer';
import PracticeCard from './PracticeCard';
import {
  episodeToPracticeCard,
  findEpisodeById,
  mapRemotePodcastPayload,
  podcastDesc,
  podcastShow,
  podcastTitle,
} from './podcastHubData';
import {
  episodePassesHubFilters,
  PODCAST_FILTER_FORMAT_OPTIONS,
  PODCAST_FILTER_SITUATION_OPTIONS,
  PODCAST_FILTER_THEME_OPTIONS,
} from './podcastHubFilters';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';
import filmsCatalogHeroPhoto from '../../assets/films-catalog-hero-clouds.png';
import './PodcastsPracticeHub.css';

function orderIdsByOptions(options, ids) {
  const rank = new Map(
    options.filter((o) => o.id != null).map((o, i) => [o.id, i])
  );
  return [...ids].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}

function labelKeyForOptionId(options, id) {
  const opt = options.find((o) => o.id === id);
  return opt ? opt.labelKey : String(id);
}

function PodcastFilterDropdown({ isOpen, options, selectedIds, t, onToggleOption, tall }) {
  if (!isOpen) return null;
  return (
    <ul
      className={`podcast-hub-filter-menu${tall ? ' podcast-hub-filter-menu--tall' : ''}`}
      role="listbox"
      aria-multiselectable="true"
    >
      {options.map((opt) => {
        const isAny = opt.id === null;
        const isSelected = isAny
          ? selectedIds.length === 0
          : selectedIds.includes(opt.id);
        return (
          <li key={isAny ? '_all' : String(opt.id)} className="podcast-hub-filter-menu-item">
            <button
              type="button"
              className={`podcast-hub-filter-menu-btn ${isSelected ? 'is-selected' : ''}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => onToggleOption(opt.id)}
            >
              {t(`pages.${opt.labelKey}`)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PodcastsPracticeHub({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const filtersBlockRef = useRef(null);
  const [filtersToolbarVisible, setFiltersToolbarVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [openFilterKey, setOpenFilterKey] = useState(null);
  const [filtThemes, setFiltThemes] = useState([]);
  const [filtSituations, setFiltSituations] = useState([]);
  const [filtFormats, setFiltFormats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.podcasts));

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.podcasts, favorites);
  }, [favorites]);
  const [remoteEpisodes, setRemoteEpisodes] = useState([]);

  const closeFilters = useCallback(() => setOpenFilterKey(null), []);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/podcasts')
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.episodes || []).map((r) =>
          mapRemotePodcastPayload(r, backendPublicUrl)
        );
        setRemoteEpisodes(rows);
        setActiveId((prev) => {
          if (rows.length === 0) return null;
          if (prev && findEpisodeById(prev, rows)) return prev;
          return rows[0].id;
        });
      })
      .catch(() => {
        if (!cancelled) setRemoteEpisodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!openFilterKey || !filtersToolbarVisible) return undefined;
    const onDoc = (e) => {
      const root = filtersBlockRef.current;
      if (!root) return;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const inside =
        path.length > 0 ? path.includes(root) : e.target instanceof Node && root.contains(e.target);
      if (!inside) closeFilters();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') closeFilters();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openFilterKey, closeFilters, filtersToolbarVisible]);

  const toggleFiltersToolbar = useCallback(() => {
    setFiltersToolbarVisible((prev) => {
      if (prev) setOpenFilterKey(null);
      return !prev;
    });
  }, []);

  const toggleThemeOption = useCallback((id) => {
    if (id === null) {
      setFiltThemes([]);
      return;
    }
    setFiltThemes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSituationOption = useCallback((id) => {
    if (id === null) {
      setFiltSituations([]);
      return;
    }
    setFiltSituations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleFormatOption = useCallback((id) => {
    if (id === null) {
      setFiltFormats([]);
      return;
    }
    setFiltFormats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const allEpisodes = remoteEpisodes;

  const q = search.trim().toLowerCase();

  const matchesSearch = useCallback(
    (ep) => {
      if (!q) return true;
      const title = podcastTitle(ep, t).toLowerCase();
      const show = podcastShow(ep, t).toLowerCase();
      const desc = podcastDesc(ep, t).toLowerCase();
      return title.includes(q) || show.includes(q) || desc.includes(q);
    },
    [q, t]
  );

  const matchesFilters = useCallback(
    (ep) =>
      episodePassesHubFilters(ep, {
        themes: filtThemes,
        situations: filtSituations,
        formats: filtFormats,
      }),
    [filtThemes, filtSituations, filtFormats]
  );

  const filteredEpisodes = useMemo(
    () => allEpisodes.filter((ep) => matchesFilters(ep) && matchesSearch(ep)),
    [allEpisodes, matchesFilters, matchesSearch]
  );

  const picks = useMemo(
    () =>
      remoteEpisodes
        .filter((ep) => ep.isFeaturedPick && matchesFilters(ep) && matchesSearch(ep))
        .slice(0, 8),
    [remoteEpisodes, matchesFilters, matchesSearch]
  );

  const active = activeId ? findEpisodeById(activeId, allEpisodes) : null;

  const anyAdvancedFilter =
    filtThemes.length > 0 || filtSituations.length > 0 || filtFormats.length > 0;

  const titleFor = (ep) => podcastTitle(ep, t);
  const showFor = (ep) => podcastShow(ep, t);
  const descFor = (ep) => podcastDesc(ep, t);

  const playPractice = (practice) => {
    setActiveId(practice.id);
  };

  const toggleFav = (id) => {
    setFavorites((prev) => toggleInFavoriteSet(prev, id));
  };

  const playerPractice = active
    ? {
        id: active.id,
        title: titleFor(active),
        durationMin: active.durationMin || 24,
        audioSource:
          active.audioSource || (active.embedUrl ? 'youtube' : active.audioUrl ? 'url' : 'youtube'),
        embedUrl: active.embedUrl || '',
        audioUrl: active.audioUrl || '',
      }
    : null;

  return (
    <section
      className={`podcast-hub podcast-hub--fullbleed podcast-hub--catalog fade-in${embedded ? ' podcast-hub--embedded' : ''}`}
    >
      <div className="podcast-hub-ambient" aria-hidden />
      <div className="podcast-hub-panel">
        <header className="podcast-hub-catalog-header">
          <div className="podcast-hub-mock">
            <div className="podcast-hub-hero-stage">
              {!embedded ? (
                <button
                  type="button"
                  className="podcast-hub-back"
                  onClick={() => navigate(spaceHubHref())}
                >
                  <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                  {t('pages.practicesBack')}
                </button>
              ) : null}
              <div
                className="podcast-hub-hero-photo"
                style={{ backgroundImage: `url(${filmsCatalogHeroPhoto})` }}
                role="img"
                aria-label={t('pages.filmsCatalogHeroPhotoAlt')}
              />
            </div>
            <div className="podcast-hub-sheet">
              <div className="podcast-hub-sheet-notch" aria-hidden />
              <div className="podcast-hub-sheet-inner">
                <h1 className="podcast-hub-title-v2">
                  {t('pages.podcastsPageTitle')}
                  <Mic2 className="podcast-hub-title-icon" size={28} strokeWidth={1.65} aria-hidden />
                </h1>
                <p className="podcast-hub-lead-v2">{t('pages.podcastsPageLead')}</p>
              </div>
            </div>
          </div>

          <div ref={filtersBlockRef} className="podcast-hub-filters-stack">
            <div className="podcast-hub-search-row">
              <label className="podcast-hub-search podcast-hub-search--catalog">
                <Search size={17} strokeWidth={2} aria-hidden />
                <input
                  type="search"
                  placeholder={t('pages.podcastsSearchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <button
                type="button"
                className={`podcast-hub-filter-btn${filtersToolbarVisible ? ' is-open' : ''}`}
                aria-label={t('pages.podcastsCatalogFilterAria')}
                aria-expanded={filtersToolbarVisible}
                aria-controls="podcast-hub-filters-panel"
                onClick={toggleFiltersToolbar}
              >
                <SlidersHorizontal size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {filtersToolbarVisible ? (
              <div
                id="podcast-hub-filters-panel"
                className="podcast-hub-filter-toolbar"
                role="toolbar"
                aria-label={t('pages.podcastsFilterToolbarAria')}
              >
                <div className="podcast-hub-filter-pill-wrap">
                  <button
                    type="button"
                    className={`podcast-hub-filter-pill ${filtThemes.length > 0 ? 'is-active' : ''}`}
                    aria-expanded={openFilterKey === 'theme'}
                    aria-haspopup="listbox"
                    onClick={() => setOpenFilterKey((k) => (k === 'theme' ? null : 'theme'))}
                  >
                    <BookOpen size={18} strokeWidth={2.1} aria-hidden />
                    <span className="podcast-hub-filter-pill-text">
                      {t('pages.podcastsFilterPillTheme')}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`podcast-hub-filter-pill-chevron ${openFilterKey === 'theme' ? 'is-open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <PodcastFilterDropdown
                    isOpen={openFilterKey === 'theme'}
                    options={PODCAST_FILTER_THEME_OPTIONS}
                    selectedIds={filtThemes}
                    t={t}
                    onToggleOption={toggleThemeOption}
                    tall
                  />
                </div>
                <div className="podcast-hub-filter-pill-wrap">
                  <button
                    type="button"
                    className={`podcast-hub-filter-pill ${filtSituations.length > 0 ? 'is-active' : ''}`}
                    aria-expanded={openFilterKey === 'situation'}
                    aria-haspopup="listbox"
                    onClick={() =>
                      setOpenFilterKey((k) => (k === 'situation' ? null : 'situation'))
                    }
                  >
                    <Sparkles size={18} strokeWidth={2.1} aria-hidden />
                    <span className="podcast-hub-filter-pill-text">
                      {t('pages.podcastsFilterPillSituation')}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`podcast-hub-filter-pill-chevron ${openFilterKey === 'situation' ? 'is-open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <PodcastFilterDropdown
                    isOpen={openFilterKey === 'situation'}
                    options={PODCAST_FILTER_SITUATION_OPTIONS}
                    selectedIds={filtSituations}
                    t={t}
                    onToggleOption={toggleSituationOption}
                    tall
                  />
                </div>
                <div className="podcast-hub-filter-pill-wrap">
                  <button
                    type="button"
                    className={`podcast-hub-filter-pill ${filtFormats.length > 0 ? 'is-active' : ''}`}
                    aria-expanded={openFilterKey === 'format'}
                    aria-haspopup="listbox"
                    onClick={() => setOpenFilterKey((k) => (k === 'format' ? null : 'format'))}
                  >
                    <Clock size={18} strokeWidth={2.1} aria-hidden />
                    <span className="podcast-hub-filter-pill-text">
                      {t('pages.podcastsFilterPillFormat')}
                    </span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2.5}
                      className={`podcast-hub-filter-pill-chevron ${openFilterKey === 'format' ? 'is-open' : ''}`}
                      aria-hidden
                    />
                  </button>
                  <PodcastFilterDropdown
                    isOpen={openFilterKey === 'format'}
                    options={PODCAST_FILTER_FORMAT_OPTIONS}
                    selectedIds={filtFormats}
                    t={t}
                    onToggleOption={toggleFormatOption}
                  />
                </div>
              </div>
            ) : null}

            {anyAdvancedFilter ? (
              <div
                className="podcast-hub-filter-chips"
                role="group"
                aria-label={t('pages.podcastsFilterChipsAria')}
              >
                {orderIdsByOptions(PODCAST_FILTER_THEME_OPTIONS, filtThemes).map((id) => {
                  const lk = labelKeyForOptionId(PODCAST_FILTER_THEME_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`th-${id}`} className="podcast-hub-filter-chip">
                      <BookOpen className="podcast-hub-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="podcast-hub-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="podcast-hub-filter-chip-remove"
                        onClick={() => setFiltThemes((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.podcastsFilterRemoveChip', { label })}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {orderIdsByOptions(PODCAST_FILTER_SITUATION_OPTIONS, filtSituations).map((id) => {
                  const lk = labelKeyForOptionId(PODCAST_FILTER_SITUATION_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`si-${id}`} className="podcast-hub-filter-chip">
                      <Sparkles className="podcast-hub-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="podcast-hub-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="podcast-hub-filter-chip-remove"
                        onClick={() => setFiltSituations((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.podcastsFilterRemoveChip', { label })}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {orderIdsByOptions(PODCAST_FILTER_FORMAT_OPTIONS, filtFormats).map((id) => {
                  const lk = labelKeyForOptionId(PODCAST_FILTER_FORMAT_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`fo-${id}`} className="podcast-hub-filter-chip">
                      <Clock className="podcast-hub-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="podcast-hub-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="podcast-hub-filter-chip-remove"
                        onClick={() => setFiltFormats((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.podcastsFilterRemoveChip', { label })}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </header>

        <div className="podcast-hub-layout podcast-hub-layout--body">
          <div className="podcast-hub-main hub-cover-cards">
          {picks.length > 0 ? (
            <section className="podcast-hub-section" aria-labelledby="podcast-picks-heading">
              <h2 id="podcast-picks-heading" className="podcast-hub-section-title">
                {t('pages.podcastsPickSection')}
              </h2>
              <div className="meditation-hub-grid podcast-hub-grid">
                {picks.map((ep, index) => (
                  <PracticeCard
                    key={ep.id}
                    practice={episodeToPracticeCard(ep, t)}
                    variant="podcast"
                    isFavorite={favorites.has(ep.id)}
                    onToggleFavorite={toggleFav}
                    onPlay={playPractice}
                    isActive={activeId === ep.id}
                    index={index}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="podcast-hub-section" aria-labelledby="podcast-recent-heading">
            <h2 id="podcast-recent-heading" className="podcast-hub-section-title">
              {t('pages.podcastsRecentSection')}
            </h2>
            {filteredEpisodes.length === 0 ? (
              <p className="podcast-hub-empty">
                {anyAdvancedFilter || q
                  ? t('pages.podcastsFilterEmpty')
                  : t('pages.podcastsListEmpty')}
              </p>
            ) : (
              <div className="meditation-hub-grid podcast-hub-grid">
                {filteredEpisodes.map((ep, index) => (
                  <PracticeCard
                    key={ep.id}
                    practice={episodeToPracticeCard(ep, t)}
                    variant="podcast"
                    isFavorite={favorites.has(ep.id)}
                    onToggleFavorite={toggleFav}
                    onPlay={playPractice}
                    isActive={activeId === ep.id}
                    index={index}
                  />
                ))}
              </div>
            )}
          </section>
          </div>

          <aside className="podcast-hub-side">
          <div className="podcast-hub-player-card">
            <h3 className="podcast-hub-side-heading">{t('pages.podcastsNowPlaying')}</h3>
            {active ? (
              <>
                <div
                  className="podcast-hub-player-cover"
                  style={{ backgroundImage: `url(${active.poster})` }}
                />
                <div className="podcast-hub-player-meta-top">
                  <strong className="podcast-hub-player-title">{titleFor(active)}</strong>
                  {showFor(active) ? (
                    <span className="podcast-hub-player-show">{showFor(active)}</span>
                  ) : null}
                  {descFor(active) ? (
                    <p className="podcast-hub-player-desc">{descFor(active)}</p>
                  ) : null}
                </div>
                <div className="podcast-hub-player-body">
                  {playerPractice && (active.embedUrl || active.audioUrl) ? (
                    <div className="podcast-hub-player-audio">
                      <MeditationAudioPlayer
                        practice={playerPractice}
                        favorite={favorites.has(active.id)}
                        onToggleFavorite={() => toggleFav(active.id)}
                        t={t}
                      />
                    </div>
                  ) : (
                    <p className="podcast-hub-player-empty-hint">{t('pages.podcastsPlayerEmpty')}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="podcast-hub-player-empty">{t('pages.podcastsPlayerEmpty')}</div>
            )}
          </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default PodcastsPracticeHub;
