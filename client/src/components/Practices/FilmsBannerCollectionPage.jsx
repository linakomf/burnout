import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getFilmById } from './filmsCatalogData';

const COLLECTIONS = {
  'banner-1': {
    kicker: 'Мягкий вечер',
    title: 'Мягкий вечер',
    lead:
      'Фильмы, которые помогают переключиться после насыщенного дня, немного выдохнуть и провести вечер в спокойной атмосфере.',
    filmIds: ['f13', 'f14', 'f21', 'f11', 'f8', 'f5'],
  },
  'banner-2': {
    kicker: 'Вернуть силы',
    title: 'Вернуть силы',
    lead: 'Подборка для дней, когда чувствуешь усталость и выгорание.',
    filmIds: ['f1', 'f7', 'f6', 'f15', 'f2', 'f9'],
  },
};

function FilmsBannerCollectionPage() {
  const navigate = useNavigate();
  const { bannerId } = useParams();
  const { t } = useLanguage();
  const data = COLLECTIONS[bannerId] || COLLECTIONS['banner-1'];

  return (
    <section className="films-collection-page fade-in">
      <button type="button" className="films-collection-back" onClick={() => navigate('/practices/films')}>
        <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
        {t('pages.filmDetailBack')}
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

        <header className="films-collection-headline">
          <h2 className="films-collection-headline-title">
            {data.title}
            <span className="films-collection-headline-cloud" aria-hidden>
              ☁
            </span>
          </h2>
          <p className="films-collection-headline-lead">{data.lead}</p>
        </header>

        <div className="films-collection-film-grid">
          {data.filmIds.map((id) => {
            const film = getFilmById(id);
            if (!film) return null;
            return (
              <button
                key={id}
                type="button"
                className="films-collection-film-card"
                onClick={() => navigate(`/practices/films/${film.id}`)}
              >
                <div className="films-collection-film-card__poster-wrap">
                  <img src={film.poster} alt="" className="films-collection-film-card__poster" loading="lazy" />
                </div>
                <h3 className="films-collection-film-card__title">{film.title}</h3>
                <div className="films-collection-film-card__meta">
                  <span className="films-collection-film-card__star" aria-hidden>
                    ★
                  </span>
                  {film.rating} · {film.year}
                </div>
                <span className="films-collection-film-card__tag">{t(`pages.filmPsych_${film.psychTag}`)}</span>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default FilmsBannerCollectionPage;
