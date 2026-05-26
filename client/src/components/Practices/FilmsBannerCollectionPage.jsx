import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { spaceSectionHref } from './practiceSpaceConfig';
import PracticeCoverFavorite from './PracticeCoverFavorite';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';

function normalizeRemoteFilm(film) {
  return {
    ...film,
    poster: backendPublicUrl(film.poster),
    gallery: Array.isArray(film.gallery) ? film.gallery.map(backendPublicUrl) : [],
  };
}

function FilmsBannerCollectionPage() {
  const navigate = useNavigate();
  const { bannerId } = useParams();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.films));
  const [remoteCollection, setRemoteCollection] = useState(null);
  const [remoteFilms, setRemoteFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.films, favorites);
  }, [favorites]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get('/films').catch(() => ({ data: { films: [] } })),
      api.get(`/films/collections/${bannerId}`).catch(() => null),
    ])
      .then(([filmsRes, collectionRes]) => {
        if (cancelled) return;
        setRemoteFilms((filmsRes.data?.films || []).map(normalizeRemoteFilm));
        setRemoteCollection(collectionRes?.data || null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  const toggleFilmFavorite = (filmId) => {
    setFavorites((prev) => toggleInFavoriteSet(prev, filmId));
  };

  const data = remoteCollection || null;

  const collectionFilms = useMemo(() => {
    if (!remoteCollection) return [];
    const byId = new Map(remoteFilms.map((film) => [film.id, film]));
    return (remoteCollection.filmIds || []).map((id) => byId.get(id)).filter(Boolean);
  }, [remoteCollection, remoteFilms]);

  return (
    <section className="films-collection-page fade-in">
      <button type="button" className="films-collection-back" onClick={() => navigate(spaceSectionHref('films'))}>
        <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
        {t('pages.practicesBack')}
      </button>

      <section className="practices-landing-services films-collection-services">
        <div className="films-collection-hero" aria-hidden>
          <svg className="films-collection-heart-svg" viewBox="0 0 320 250" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M160 228 C 45 146 8 114 8 70 C 8 36 35 10 68 10 C 103 10 128 30 160 62 C 192 30 217 10 252 10 C 285 10 312 36 312 70 C 312 114 275 146 160 228 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="8 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            className="films-collection-wave-svg"
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 112 C 220 42 420 192 610 132 C 820 72 1030 190 1200 148"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="7 11"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            className="films-collection-wave-svg films-collection-wave-svg--lower"
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 124 C 220 182 430 56 620 112 C 840 168 1050 70 1200 122"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="7 11"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {data ? (
          <>
            <header className="films-collection-headline">
              <h2 className="films-collection-headline-title">
                {data.title}
                <span className="films-collection-headline-cloud" aria-hidden>
                  ☁
                </span>
              </h2>
              <p className="films-collection-headline-lead">{data.description}</p>
            </header>

            <div className="films-collection-film-grid">
              {collectionFilms.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  className="films-collection-film-card"
                  onClick={() => navigate(`/practices/films/${film.id}`)}
                >
                  <div className="films-collection-film-card__poster-wrap">
                    <img src={film.poster} alt="" className="films-collection-film-card__poster" loading="lazy" />
                    <PracticeCoverFavorite
                      isFavorite={favorites.has(film.id)}
                      onToggle={() => toggleFilmFavorite(film.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                    <span className="films-collection-film-card__tag">{t(`pages.filmPsych_${film.psychTag}`)}</span>
                  </div>
                  <h3 className="films-collection-film-card__title">{film.title}</h3>
                  <div className="films-collection-film-card__meta">
                    <span className="films-collection-film-card__star" aria-hidden>
                      ★
                    </span>
                    {film.rating} · {film.year}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : loading ? null : (
          <header className="films-collection-headline">
            <h2 className="films-collection-headline-title">
              {t('pages.filmsCatalogMindTitle')}
              <span className="films-collection-headline-cloud" aria-hidden>
                ☁
              </span>
            </h2>
            <p className="films-collection-headline-lead">Подборка не найдена.</p>
          </header>
        )}
      </section>
    </section>
  );
}

export default FilmsBannerCollectionPage;
