import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  ChevronDown,
  Clapperboard,
  Heart,
  ListVideo,
  Search,
  SlidersHorizontal,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import filmsCatalogHeroPhoto from '../../assets/films-catalog-hero-clouds.png';
import { spaceNature } from './spaceNatureImagery';
import { FILMS } from './filmsCatalogData';
import {
  FILMS_FILTER_ATMOS_OPTIONS,
  FILMS_FILTER_GENRE_OPTIONS,
  FILMS_FILTER_MOOD_OPTIONS,
  FILMS_FILTER_TYPE_OPTIONS,
  filmPassesHubFilters,
} from './filmsHubFilters';
import './FilmsPracticeHub.css';

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

function FilmsFilterDropdown({ isOpen, options, selectedIds, t, onToggleOption, alignEnd, tall }) {
  if (!isOpen) return null;
  return (
    <ul
      className={`flix-film-filter-menu${alignEnd ? ' flix-film-filter-menu--end' : ''}${tall ? ' flix-film-filter-menu--tall' : ''}`}
      role="listbox"
      aria-multiselectable="true"
    >
      {options.map((opt) => {
        const isAny = opt.id === null;
        const isSelected = isAny
          ? selectedIds.length === 0
          : selectedIds.includes(opt.id);
        return (
          <li key={isAny ? '_all' : String(opt.id)} className="flix-film-filter-menu-item">
            <button
              type="button"
              className={`flix-film-filter-menu-btn ${isSelected ? 'is-selected' : ''}`}
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

function FilmsPracticeHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const filtersBlockRef = useRef(null);
  const [filtersToolbarVisible, setFiltersToolbarVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [openFilterKey, setOpenFilterKey] = useState(null);
  const [filtMoods, setFiltMoods] = useState([]);
  const [filtGenres, setFiltGenres] = useState([]);
  const [filtTypes, setFiltTypes] = useState([]);
  const [filtAtmospheres, setFiltAtmospheres] = useState([]);

  const closeFilters = useCallback(() => setOpenFilterKey(null), []);

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

  const toggleMoodOption = useCallback((id) => {
    if (id === null) {
      setFiltMoods([]);
      return;
    }
    setFiltMoods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);
  const toggleGenreOption = useCallback((id) => {
    if (id === null) {
      setFiltGenres([]);
      return;
    }
    setFiltGenres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);
  const toggleTypeOption = useCallback((id) => {
    if (id === null) {
      setFiltTypes([]);
      return;
    }
    setFiltTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);
  const toggleAtmosOption = useCallback((id) => {
    if (id === null) {
      setFiltAtmospheres([]);
      return;
    }
    setFiltAtmospheres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const filteredFilms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return FILMS.filter((film) => {
      if (
        !filmPassesHubFilters(film, {
          moods: filtMoods,
          genres: filtGenres,
          types: filtTypes,
          atmospheres: filtAtmospheres,
        })
      )
        return false;
      if (!query) return true;
      return (
        film.title.toLowerCase().includes(query) ||
        film.source.toLowerCase().includes(query) ||
        film.genres.toLowerCase().includes(query) ||
        t(`pages.filmPsych_${film.psychTag}`).toLowerCase().includes(query)
      );
    });
  }, [search, t, filtMoods, filtGenres, filtTypes, filtAtmospheres]);

  const anyAdvancedFilter =
    filtMoods.length > 0 ||
    filtGenres.length > 0 ||
    filtTypes.length > 0 ||
    filtAtmospheres.length > 0;

  const heroBanners = [
    {
      id: 'banner-1',
      filmId: 'f3',
      image: spaceNature.filmBannerEvening,
      badge: 'rest',
      titleKey: 'filmsBannerSoftEveningTitle',
      subtitleKey: 'filmsBannerSoftEveningSub',
    },
    {
      id: 'banner-2',
      filmId: 'f2',
      image: spaceNature.filmBannerRestore,
      badge: 'energy',
      titleKey: 'filmsBannerRestoreTitle',
      subtitleKey: 'filmsBannerRestoreSub',
    },
  ];

  return (
    <section className="flix-scope flix-scope--catalog flix-scope--mindwell fade-in">
      <div className="flix-ambient" aria-hidden />

      <div className="flix-panel flix-panel--catalog">
        <header className="flix-catalog-header">
          <div className="flix-catalog-mock">
            <div className="flix-catalog-hero-stage">
              <button type="button" className="flix-back flix-catalog-back" onClick={() => navigate('/practices')}>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                {t('pages.practicesBackToHub')}
              </button>
              <div
                className="flix-catalog-hero-photo"
                style={{ backgroundImage: `url(${filmsCatalogHeroPhoto})` }}
                role="img"
                aria-label={t('pages.filmsCatalogHeroPhotoAlt')}
              />
            </div>
            <div className="flix-catalog-sheet">
              <div className="flix-catalog-sheet-notch" aria-hidden />
              <div className="flix-catalog-sheet-inner">
                <p className="flix-catalog-care">
                  <Heart className="flix-catalog-care-icon" size={18} strokeWidth={2} aria-hidden />
                  {t('pages.filmsCatalogCareLine')}
                </p>
                <div className="flix-catalog-header-v2">
                  <div className="flix-catalog-header-main">
                    <h1 className="flix-catalog-title-v2">
                      {t('pages.filmsCatalogMindTitle')}
                      <Clapperboard className="flix-catalog-title-clapper" size={28} strokeWidth={1.65} aria-hidden />
                    </h1>
                    <p className="flix-catalog-lead-v2">{t('pages.filmsCatalogMindLead')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flix-catalog-banners" aria-label={t('pages.filmsCatalogBannersAria')}>
            {heroBanners.map((banner) => {
              const film = FILMS.find((item) => item.id === banner.filmId);
              if (!film) return null;
              const BadgeIco = banner.badge === 'rest' ? Ban : Sparkles;
              return (
                <button
                  key={banner.id}
                  type="button"
                  className="flix-catalog-banner"
                  onClick={() => navigate(`/practices/films/collections/${banner.id}`)}
                >
                  <img src={banner.image} alt="" className="flix-catalog-banner__bg" loading="lazy" />
                  <span className="flix-catalog-banner__wash" aria-hidden />
                  <span className="flix-catalog-banner__badge" aria-hidden>
                    <BadgeIco size={18} strokeWidth={2.2} />
                  </span>
                  <span className="flix-catalog-banner__title">{t(`pages.${banner.titleKey}`)}</span>
                  <span className="flix-catalog-banner__subtitle">{t(`pages.${banner.subtitleKey}`)}</span>
                  <span className="flix-catalog-banner__arrow" aria-hidden>
                    <ArrowRight size={20} strokeWidth={2.2} />
                  </span>
                </button>
              );
            })}
          </div>

          <div ref={filtersBlockRef} className="flix-catalog-filters-stack">
            <div className="flix-catalog-search-row">
              <div className="flix-catalog-search">
                <Search size={17} strokeWidth={2} aria-hidden />
                <input
                  type="search"
                  placeholder={t('pages.filmsCatalogSearchPh')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                className={`flix-catalog-filter-btn${filtersToolbarVisible ? ' is-open' : ''}`}
                aria-label={t('pages.filmsCatalogFilterAria')}
                aria-expanded={filtersToolbarVisible}
                aria-controls="flix-catalog-filters-panel"
                onClick={toggleFiltersToolbar}
              >
                <SlidersHorizontal size={20} strokeWidth={2} aria-hidden />
              </button>
            </div>

            {filtersToolbarVisible ? (
            <div
              id="flix-catalog-filters-panel"
              className="flix-film-filter-toolbar"
              role="toolbar"
              aria-label={t('pages.filmsFilterToolbarAria')}
            >
            <div className="flix-film-filter-pill-wrap">
              <button
                type="button"
                className={`flix-film-filter-pill ${filtMoods.length > 0 ? 'is-active' : ''}`}
                aria-expanded={openFilterKey === 'mood'}
                aria-haspopup="listbox"
                onClick={() => setOpenFilterKey((k) => (k === 'mood' ? null : 'mood'))}
              >
                <Smile size={18} strokeWidth={2.1} aria-hidden />
                <span className="flix-film-filter-pill-text">{t('pages.filmsFilterPillMood')}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`flix-film-filter-pill-chevron ${openFilterKey === 'mood' ? 'is-open' : ''}`}
                  aria-hidden
                />
              </button>
              <FilmsFilterDropdown
                isOpen={openFilterKey === 'mood'}
                options={FILMS_FILTER_MOOD_OPTIONS}
                selectedIds={filtMoods}
                t={t}
                onToggleOption={toggleMoodOption}
                tall
              />
            </div>
            <div className="flix-film-filter-pill-wrap">
              <button
                type="button"
                className={`flix-film-filter-pill ${filtGenres.length > 0 ? 'is-active' : ''}`}
                aria-expanded={openFilterKey === 'genre'}
                aria-haspopup="listbox"
                onClick={() => setOpenFilterKey((k) => (k === 'genre' ? null : 'genre'))}
              >
                <Clapperboard size={18} strokeWidth={2.1} aria-hidden />
                <span className="flix-film-filter-pill-text">{t('pages.filmsFilterPillGenre')}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`flix-film-filter-pill-chevron ${openFilterKey === 'genre' ? 'is-open' : ''}`}
                  aria-hidden
                />
              </button>
              <FilmsFilterDropdown
                isOpen={openFilterKey === 'genre'}
                options={FILMS_FILTER_GENRE_OPTIONS}
                selectedIds={filtGenres}
                t={t}
                onToggleOption={toggleGenreOption}
                tall
              />
            </div>
            <div className="flix-film-filter-pill-wrap">
              <button
                type="button"
                className={`flix-film-filter-pill ${filtTypes.length > 0 ? 'is-active' : ''}`}
                aria-expanded={openFilterKey === 'type'}
                aria-haspopup="listbox"
                onClick={() => setOpenFilterKey((k) => (k === 'type' ? null : 'type'))}
              >
                <ListVideo size={18} strokeWidth={2.1} aria-hidden />
                <span className="flix-film-filter-pill-text">{t('pages.filmsFilterPillType')}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`flix-film-filter-pill-chevron ${openFilterKey === 'type' ? 'is-open' : ''}`}
                  aria-hidden
                />
              </button>
              <FilmsFilterDropdown
                isOpen={openFilterKey === 'type'}
                options={FILMS_FILTER_TYPE_OPTIONS}
                selectedIds={filtTypes}
                t={t}
                onToggleOption={toggleTypeOption}
              />
            </div>
            <div className="flix-film-filter-pill-wrap">
              <button
                type="button"
                className={`flix-film-filter-pill ${filtAtmospheres.length > 0 ? 'is-active' : ''}`}
                aria-expanded={openFilterKey === 'atmos'}
                aria-haspopup="listbox"
                onClick={() => setOpenFilterKey((k) => (k === 'atmos' ? null : 'atmos'))}
              >
                <Sparkles size={18} strokeWidth={2.1} aria-hidden />
                <span className="flix-film-filter-pill-text">{t('pages.filmsFilterPillAtmos')}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.5}
                  className={`flix-film-filter-pill-chevron ${openFilterKey === 'atmos' ? 'is-open' : ''}`}
                  aria-hidden
                />
              </button>
              <FilmsFilterDropdown
                isOpen={openFilterKey === 'atmos'}
                options={FILMS_FILTER_ATMOS_OPTIONS}
                selectedIds={filtAtmospheres}
                t={t}
                onToggleOption={toggleAtmosOption}
                tall
              />
            </div>
          </div>
            ) : null}

            {anyAdvancedFilter ? (
              <div
                className="flix-film-filter-chips"
                role="group"
                aria-label={t('pages.filmsFilterChipsAria')}
              >
                {orderIdsByOptions(FILMS_FILTER_MOOD_OPTIONS, filtMoods).map((id) => {
                  const lk = labelKeyForOptionId(FILMS_FILTER_MOOD_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`m-${id}`} className="flix-film-filter-chip">
                      <Smile className="flix-film-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="flix-film-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="flix-film-filter-chip-remove"
                        onClick={() => setFiltMoods((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.filmsFilterRemoveChip', { label })}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {orderIdsByOptions(FILMS_FILTER_GENRE_OPTIONS, filtGenres).map((id) => {
                  const lk = labelKeyForOptionId(FILMS_FILTER_GENRE_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`g-${id}`} className="flix-film-filter-chip">
                      <Clapperboard className="flix-film-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="flix-film-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="flix-film-filter-chip-remove"
                        onClick={() => setFiltGenres((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.filmsFilterRemoveChip', { label })}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {orderIdsByOptions(FILMS_FILTER_TYPE_OPTIONS, filtTypes).map((id) => {
                  const lk = labelKeyForOptionId(FILMS_FILTER_TYPE_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`t-${id}`} className="flix-film-filter-chip">
                      <ListVideo className="flix-film-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="flix-film-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="flix-film-filter-chip-remove"
                        onClick={() => setFiltTypes((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.filmsFilterRemoveChip', { label })}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {orderIdsByOptions(FILMS_FILTER_ATMOS_OPTIONS, filtAtmospheres).map((id) => {
                  const lk = labelKeyForOptionId(FILMS_FILTER_ATMOS_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`a-${id}`} className="flix-film-filter-chip">
                      <Sparkles className="flix-film-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                      <span className="flix-film-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="flix-film-filter-chip-remove"
                        onClick={() => setFiltAtmospheres((p) => p.filter((x) => x !== id))}
                        aria-label={t('pages.filmsFilterRemoveChip', { label })}
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

        <section className="flix-catalog-section">
          {filteredFilms.length === 0 ? (
            <p className="flix-catalog-empty">
              {anyAdvancedFilter ? t('pages.filmsFilterEmpty') : t('pages.filmsCatalogEmptyCategory')}
            </p>
          ) : (
            <div id="flix-film-grid" className="flix-film-grid">
              {filteredFilms.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  className="flix-film-card"
                  onClick={() => navigate(`/practices/films/${film.id}`)}
                >
                  <div className="flix-film-card__poster-wrap">
                    <img src={film.poster} alt="" className="flix-film-card__poster" loading="lazy" />
                  </div>
                  <h3 className="flix-film-card__title">{film.title}</h3>
                  <div className="flix-film-card__meta">
                    <span className="flix-film-card__star" aria-hidden>
                      ★
                    </span>
                    {film.rating} · {film.year}
                  </div>
                  <span className="flix-psych-tag">{t(`pages.filmPsych_${film.psychTag}`)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export default FilmsPracticeHub;
