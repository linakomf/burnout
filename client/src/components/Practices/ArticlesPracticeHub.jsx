import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Flame,
  Heart,
  LayoutGrid,
  MessageCircle,
  Moon,
  Scale,
  Smile,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import filmsCatalogHeroPhoto from '../../assets/films-catalog-hero-clouds.png';
import { buildShelves, getFilteredArticles } from './articlesHubData';
import './ArticlesPracticeHub.css';

/** Плашки фильтров: иконка + текст */
const FILTER_ITEMS = [
  { id: 'all', labelKey: 'articlesFilterAll', Icon: LayoutGrid },
  { id: 'burnout', labelKey: 'articlesFilterBurnout', Icon: Flame },
  { id: 'stress', labelKey: 'articlesFilterStress', Icon: Activity },
  { id: 'motivation', labelKey: 'articlesFilterMotivation', Icon: TrendingUp },
  { id: 'rest', labelKey: 'articlesFilterRest', Icon: Moon },
  { id: 'emotions', labelKey: 'articlesFilterEmotions', Icon: Smile },
  { id: 'balance', labelKey: 'articlesFilterBalance', Icon: Scale },
  { id: 'communication', labelKey: 'articlesFilterCommunication', Icon: MessageCircle },
];

const SHELF_META = [
  { id: 'popular', titleKey: 'articlesShelfPopular' },
  { id: 'recent', titleKey: 'articlesShelfRecent' },
  { id: 'recommended', titleKey: 'articlesShelfRecommended' },
];

function ArticlesPracticeHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [category, setCategory] = useState('all');

  const shelves = useMemo(() => {
    const filtered = getFilteredArticles(category);
    return buildShelves(filtered);
  }, [category]);

  const catLabel = (cat) => t(`pages.articlesCat${cat}`);

  return (
    <section className="articles-hub articles-books--fullbleed fade-in">
      <div className="articles-hub-ambient" aria-hidden />
      <div className="articles-hub-panel">
        <header className="articles-hub-catalog-header">
          <div className="articles-hub-mock">
            <div className="articles-hub-hero-stage">
              <button type="button" className="articles-hub-back" onClick={() => navigate('/practices')}>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                {t('pages.practicesBackToHub')}
              </button>
              <div
                className="articles-hub-hero-photo"
                style={{ backgroundImage: `url(${filmsCatalogHeroPhoto})` }}
                role="img"
                aria-label={t('pages.articlesHeroPhotoAlt')}
              />
            </div>
            <div className="articles-hub-sheet">
              <div className="articles-hub-sheet-notch" aria-hidden />
              <div className="articles-hub-sheet-inner">
                <p className="articles-hub-care">
                  <Heart className="articles-hub-care-icon" size={18} strokeWidth={2} aria-hidden />
                  {t('pages.filmsCatalogCareLine')}
                </p>
                <div className="articles-hub-header-block">
                  <h1 className="articles-hub-title">
                    {t('pages.articlesHeroTitle')}
                    <BookOpen className="articles-hub-title-icon" size={28} strokeWidth={1.65} aria-hidden />
                  </h1>
                  <p className="articles-hub-lead">{t('pages.articlesHeroSubtitle')}</p>
                  <div className="articles-hub-filters" role="tablist" aria-label={t('pages.articlesHeroTitle')}>
                    {FILTER_ITEMS.map(({ id: fid, labelKey, Icon }) => {
                      const isActive = category === fid;
                      return (
                        <div key={fid} className="articles-hub-filter-wrap">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`articles-hub-filter-pill ${isActive ? 'is-active' : ''}`}
                            onClick={() => setCategory(fid)}
                          >
                            <Icon size={18} strokeWidth={2.1} aria-hidden />
                            <span className="articles-hub-filter-pill-text">{t(`pages.${labelKey}`)}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="articles-hub-shelves">
          {SHELF_META.map((shelf, shelfIdx) => (
            <section key={shelf.id} id={`articles-shelf-${shelfIdx}`} className="articles-books-shelf-section">
              <div className="articles-books-shelf-head">
                <h2 className="articles-books-shelf-title">{t(`pages.${shelf.titleKey}`)}</h2>
              </div>

              <div className="articles-books-shelf-row-wrap">
                <div className="articles-books-shelf-row">
                  {shelves[shelfIdx].map((article, i) => (
                    <a
                      key={`${shelf.id}-${article.id}-${i}`}
                      className="articles-books-card"
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="articles-books-card-stack">
                        <div className="articles-books-card-page-shadow" aria-hidden />
                        <div className="articles-books-card-poster-wrap">
                          <div
                            className="articles-books-card-poster"
                            style={{ backgroundImage: `url(${article.image})` }}
                            aria-hidden
                          />
                          <span className="articles-books-card-tag">{catLabel(article.category)}</span>
                        </div>
                      </div>
                      <h3 className="articles-books-card-title">{t(`pages.${article.titleKey}`)}</h3>
                    </a>
                  ))}
                </div>
                <div className="articles-books-shelf-board" aria-hidden />
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ArticlesPracticeHub;
