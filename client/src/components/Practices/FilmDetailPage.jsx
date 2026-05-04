import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Play, Quote } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { FILM_CATEGORIES, getFilmById, posterToBackdropUrl } from './filmsCatalogData';
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

function FilmDetailPage() {
  const { filmId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [galleryOpen, setGalleryOpen] = useState(true);

  const film = useMemo(() => getFilmById(filmId || ''), [filmId]);

  if (!filmId || !film) {
    return <Navigate to="/practices/films" replace />;
  }

  const backdrop = posterToBackdropUrl(film.poster);
  const durationLabel = formatDurationString(film.duration, t);
  const metaGenres = genreTokens(film.genres).join(', ');
  const metaLine = [film.year, durationLabel, film.country, metaGenres].filter(Boolean).join(' • ');
  const tags = genreTokens(film.genres).slice(0, 5);
  const score = Math.min(10, Math.max(0, parseFloat(film.rating) || 0));
  const scoreDisplay = Number.isInteger(score) ? String(score) : score.toFixed(1);
  const r = 54;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - score / 10);
  const galleryImages =
    film.gallery && film.gallery.length > 0 ? film.gallery : Array.from({ length: 9 }, () => film.poster);
  const quoteText = film.quote || film.description;

  const categoryLabel = t(
    `pages.${FILM_CATEGORIES.find((cItem) => cItem.id === film.categoryId)?.labelKey || 'filmCatBurnout'}`
  );

  return (
    <div className="film-detail-page fade-in">
      <section className="film-detail-hero">
        <div
          className="film-detail-hero__bg"
          style={backdrop ? { backgroundImage: `url(${backdrop})` } : undefined}
          aria-hidden
        />
        <div className="film-detail-hero__gradient" aria-hidden />

        <button type="button" className="film-detail-back" onClick={() => navigate('/practices/films')}>
          <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
          {t('pages.filmDetailBack')}
        </button>

        <div className="film-detail-hero__content">
          <div className="film-detail-hero__text-block">
            <h1 className="film-detail-title">{film.title}</h1>
            <p className="film-detail-meta">{metaLine}</p>

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

            <p className="film-detail-desc">{film.description}</p>

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
                href={film.watchUrl}
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

          <div className="film-detail-rating-block">
            <div className="film-detail-rating-ring" aria-hidden>
              <svg viewBox="0 0 120 120" className="film-detail-rating-svg">
                <circle className="film-detail-rating-track" cx="60" cy="60" r={r} />
                <circle
                  className="film-detail-rating-fill"
                  cx="60"
                  cy="60"
                  r={r}
                  strokeDasharray={c}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className="film-detail-rating-num">{scoreDisplay}</span>
            </div>
            <p className="film-detail-rating-caption">{t('pages.filmDetailCommunityRating')}</p>
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
              {galleryImages.slice(0, 9).map((src, i) => (
                <div key={`${src}-${i}`} className="film-detail-gallery-cell">
                  <img src={src} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <blockquote className="film-detail-quote">
          <Quote className="film-detail-quote__icon" size={44} strokeWidth={1.5} aria-hidden />
          <p>{quoteText}</p>
        </blockquote>
      </div>
    </div>
  );
}

export default FilmDetailPage;
