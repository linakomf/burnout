import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { spaceNature } from './spaceNatureImagery';
import { FILM_CATEGORIES, FILMS, filmSectionDescKey } from './filmsCatalogData';
import './FilmsPracticeHub.css';

const filmsHeroImg = spaceNature.filmCatalogHero;

function FilmsPracticeHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(FILM_CATEGORIES[0].id);
  const [search, setSearch] = useState('');

  const filteredFilms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return FILMS.filter((film) => {
      if (film.categoryId !== activeCategory) return false;
      if (!query) return true;
      return (
        film.title.toLowerCase().includes(query) ||
        film.source.toLowerCase().includes(query) ||
        film.genres.toLowerCase().includes(query) ||
        t(`pages.filmPsych_${film.psychTag}`).toLowerCase().includes(query)
      );
    });
  }, [activeCategory, search, t]);

  const sectionTitle = t(
    `pages.${FILM_CATEGORIES.find((c) => c.id === activeCategory)?.labelKey || 'filmCatBurnout'}`
  );

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

      <button type="button" className="flix-back" onClick={() => navigate('/practices')}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        {t('pages.practicesBackToHub')}
      </button>

      <div className="flix-panel flix-panel--catalog">
        <header className="flix-catalog-header">
          <div className="flix-catalog-hero">
            <div className="flix-catalog-hero-copy">
              <h1 className="flix-catalog-title">{t('pages.filmsCatalogMindTitle')}</h1>
              <p className="flix-catalog-lead">{t('pages.filmsCatalogMindLead')}</p>
            </div>
            <div className="flix-catalog-hero-visual" aria-hidden>
              <span className="flix-catalog-hero-dots" />
              <span className="flix-catalog-hero-butterfly" />
              <img src={filmsHeroImg} alt="" className="flix-catalog-hero-img" width={400} height={280} loading="lazy" />
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

          <div className="flix-genre-row" role="tablist" aria-label={t('pages.filmsCatalogFiltersAria')}>
            {FILM_CATEGORIES.map((cat) => {
              const Icon = cat.Icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`flix-genre-chip ${activeCategory === cat.id ? 'is-active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Icon size={17} strokeWidth={2.2} aria-hidden />
                  {t(`pages.${cat.labelKey}`)}
                </button>
              );
            })}
          </div>

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
            <button type="button" className="flix-catalog-filter-btn" aria-label={t('pages.filmsCatalogFilterAria')}>
              <SlidersHorizontal size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </header>

        <section className="flix-catalog-section" aria-labelledby="flix-section-heading">
          <div className="flix-catalog-section-head">
            <div className="flix-catalog-section-intro">
              <h2 id="flix-section-heading" className="flix-section-heading flix-section-heading--primary">
                {sectionTitle}
              </h2>
              <p className="flix-section-desc">{t(`pages.${filmSectionDescKey(activeCategory)}`)}</p>
            </div>
            <a href="#flix-film-grid" className="flix-section-seeall">
              {t('pages.filmsCatalogSeeAll')}
            </a>
          </div>

          {filteredFilms.length === 0 ? (
            <p className="flix-catalog-empty">{t('pages.filmsCatalogEmptyCategory')}</p>
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
