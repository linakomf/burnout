import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Play } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { FILM_CATEGORIES, getFilmById, posterToBackdropUrl } from './filmsCatalogData';
import { spaceSectionHref } from './practiceSpaceConfig';
import './FilmDetailPage.css';

function formatDurationString(durationRaw, t) {
  const parts = durationRaw.split(':').map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !parts.some((n) => Number.isNaN(n))) {
    const hours = parts.length === 3 ? parts[0] : 0;
    const mins = parts.length === 3 ? parts[1] : parts[0];
    return t('pages.filmDetailDuration', { hours, mins });
  }
  return durationRaw;
}

function genreTokens(genresStr) {
  return genresStr
    .split(/·|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

const FILM_DETAIL_GALLERY_MAX = 6;

function isRemoteFilmId(id) {
  return /^film-\d+$/.test(String(id || ''));
}

function mapRemoteFilmPayload(data) {
  return {
    ...data,
    poster: backendPublicUrl(data.poster),
    gallery: Array.isArray(data.gallery) ? data.gallery.map(backendPublicUrl) : [],
    description: data.description || '',
    descriptionFull: data.descriptionFull || '',
    source: data.source || '',
    duration: data.duration || '',
    year: data.year || '',
    rating: data.rating || '',
    categoryId: data.categoryId || 'burnout',
    psychTag: data.psychTag || 'light',
    genres: data.genres || '',
    watchUrl: data.watchUrl || '',
    embedUrl: data.embedUrl || '',
    country: data.country || '',
    director: data.director || '',
    screenwriter: data.screenwriter || '',
    quote: data.quote || '',
  };
}

function FilmDetailPage() {
  const { filmId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [galleryOpen, setGalleryOpen] = useState(true);

  const staticFilm = useMemo(() => getFilmById(filmId || ''), [filmId]);
  const fetchRemote = Boolean(filmId && !staticFilm && isRemoteFilmId(filmId));
  const [remoteFilm, setRemoteFilm] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(fetchRemote);

  useEffect(() => {
    if (!fetchRemote) {
      setRemoteFilm(null);
      setRemoteLoading(false);
      return undefined;
    }
    let cancelled = false;
    setRemoteLoading(true);
    setRemoteFilm(null);
    api
      .get(`/films/${filmId}`)
      .then((res) => {
        if (!cancelled) setRemoteFilm(mapRemoteFilmPayload(res.data));
      })
      .catch(() => {
        if (!cancelled) setRemoteFilm(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filmId, fetchRemote]);

  const film = staticFilm || remoteFilm;

  if (!filmId) {
    return <Navigate to={spaceSectionHref('films')} replace />;
  }

  if (fetchRemote && remoteLoading) {
    return (
      <div className="film-detail-page film-detail-page--loading fade-in">
        <p className="film-detail-loading-msg">{t('pages.filmDetailLoading')}</p>
      </div>
    );
  }

  if (!film) {
    return <Navigate to={spaceSectionHref('films')} replace />;
  }

  const descShort = film.description || '';
  const descFull = typeof film.descriptionFull === 'string' ? film.descriptionFull.trim() : '';
  const showFullBlock = Boolean(descFull && descFull !== descShort.trim());

  const backdrop = posterToBackdropUrl(film.poster);
  const durationLabel = film.duration ? formatDurationString(film.duration, t) : '';
  const metaGenres = genreTokens(film.genres || '').join(', ');
  const metaLine = [film.year, durationLabel, film.country, metaGenres].filter(Boolean).join(' • ');
  const tags = genreTokens(film.genres || '').slice(0, 5);

  const ratingNum = parseFloat(film.rating);
  const hasRating =
    film.rating != null && String(film.rating).trim() !== '' && !Number.isNaN(ratingNum);
  const score = hasRating ? Math.min(10, Math.max(0, ratingNum)) : null;
  const scoreDisplay =
    score != null ? (Number.isInteger(score) ? String(score) : score.toFixed(1)) : '';

  const galleryImages =
    film.gallery && film.gallery.length > 0
      ? film.gallery.slice(0, FILM_DETAIL_GALLERY_MAX)
      : Array.from({ length: FILM_DETAIL_GALLERY_MAX }, () => film.poster);

  const categoryLabel = t(
    `pages.${FILM_CATEGORIES.find((cItem) => cItem.id === film.categoryId)?.labelKey || 'filmCatBurnout'}`
  );

  const watchHref = film.watchUrl && String(film.watchUrl).trim() ? film.watchUrl : '#';

  return (
    <div className="film-detail-page fade-in">
      <section className="film-detail-hero">
        <div
          className="film-detail-hero__bg"
          style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
          aria-hidden
        />
        <div className="film-detail-hero__gradient" aria-hidden />

        <button type="button" className="film-detail-back" onClick={() => navigate(spaceSectionHref('films'))}>
          <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
          {t('pages.practicesBack')}
        </button>

        <div className="film-detail-hero__content">
          <div className="film-detail-hero__text-block">
            <h1 className="film-detail-title">{film.title}</h1>
            <p className="film-detail-meta">{metaLine}</p>
            {score != null ? (
              <p className="film-detail-community-inline">
                <span className="film-detail-community-inline__label">
                  {t('pages.filmDetailCommunityRating')}
                </span>
                <span className="film-detail-community-inline__score">{scoreDisplay}</span>
                <span className="film-detail-community-inline__max">/10</span>
              </p>
            ) : null}

            {film.director ? (
              <p className="film-detail-credit">
                <span className="film-detail-credit__label">{t('pages.filmDetailDirector')}</span>{' '}
                {film.director}
              </p>
            ) : null}
            {film.screenwriter ? (
              <p className="film-detail-credit">
                <span className="film-detail-credit__label">{t('pages.filmDetailScreenplay')}</span>{' '}
                {film.screenwriter}
              </p>
            ) : null}

            <p className="film-detail-desc">{descShort}</p>

            {film.quote ? (
              <blockquote className="film-detail-quote">{film.quote}</blockquote>
            ) : null}

            {showFullBlock ? (
              <>
                <h2 className="film-detail-subheading">{t('pages.filmDetailAboutFull')}</h2>
                <p className="film-detail-desc film-detail-desc--full">{descFull}</p>
              </>
            ) : null}

            <div className="film-detail-tags">
              {tags.map((tag) => (
                <span key={tag} className="film-detail-tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="film-detail-actions">
              <a
                className="film-detail-watch"
                href={watchHref}
                target="_blank"
                rel="noopener noreferrer">
                <Play size={20} strokeWidth={2.2} fill="currentColor" aria-hidden />
                {t('pages.filmDetailWatch')}
              </a>
            </div>

            <p className="film-detail-micro">
              {t(`pages.filmPsych_${film.psychTag}`)} · {categoryLabel}
            </p>
          </div>
        </div>
      </section>

      <div className="film-detail-lower">
        <section className="film-detail-gallery-wrap" aria-labelledby="film-gallery-heading">
          <button
            type="button"
            id="film-gallery-heading"
            className="film-detail-gallery-head"
            onClick={() => setGalleryOpen((o) => !o)}
            aria-expanded={galleryOpen}>
            <span>{t('pages.filmDetailGallery')}</span>
            <ChevronDown size={22} className={galleryOpen ? 'film-detail-chevron--open' : ''} aria-hidden />
          </button>
          {galleryOpen ? (
            <div className="film-detail-gallery-grid">
              {galleryImages.slice(0, FILM_DETAIL_GALLERY_MAX).map((src, i) => (
                <div key={`${src}-${i}`} className="film-detail-gallery-cell">
                  <img src={src} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default FilmDetailPage;
