import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Flower2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { buildShelves, getFilteredArticles, HERO_BG } from './articlesHubData';
import './ArticlesPracticeHub.css';

const FILTER_IDS = ['all', 'science', 'students', 'adults', 'recovery'];

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

  const scrollToNextShelf = (index) => () => {
    if (index < 2) {
      document.getElementById(`articles-shelf-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      document.getElementById('articles-shelf-0')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="articles-books articles-books--fullbleed fade-in">
      <div className="articles-books-topbar">
        <button type="button" className="articles-books-back" onClick={() => navigate('/practices')}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          {t('pages.practicesBackToHub')}
        </button>
      </div>

      <header className="articles-books-hero">
        <div className="articles-books-hero-bg" style={{ backgroundImage: `url(${HERO_BG})` }} role="presentation" />
        <div className="articles-books-hero-wash" aria-hidden />
        <div className="articles-books-hero-inner">
          <h1 className="articles-books-hero-title">{t('pages.articlesHeroTitle')}</h1>
          <p className="articles-books-hero-sub">{t('pages.articlesHeroSubtitle')}</p>
          <div className="articles-books-filters" role="tablist" aria-label={t('pages.articlesHeroTitle')}>
            {FILTER_IDS.map((fid) => {
              const labelKey =
                fid === 'all'
                  ? 'articlesFilterAll'
                  : `articlesFilter${fid.charAt(0).toUpperCase() + fid.slice(1)}`;
              const isActive = category === fid;
              return (
                <button
                  key={fid}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`articles-books-filter-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => setCategory(fid)}
                >
                  {t(`pages.${labelKey}`)}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="articles-books-sheet">
        {SHELF_META.map((shelf, shelfIdx) => (
          <section key={shelf.id} id={`articles-shelf-${shelfIdx}`} className="articles-books-shelf-section">
            <div className="articles-books-shelf-head">
              <div className="articles-books-shelf-head-left">
                <span className="articles-books-shelf-flower" aria-hidden>
                  <Flower2 size={22} strokeWidth={2} />
                </span>
                <h2 className="articles-books-shelf-title">{t(`pages.${shelf.titleKey}`)}</h2>
              </div>
              <button type="button" className="articles-books-shelf-see-all" onClick={scrollToNextShelf(shelfIdx)}>
                {t('pages.articlesShelfViewAll')}
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </button>
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
                    <div
                      className="articles-books-card-cover"
                      style={{ backgroundImage: `url(${article.image})` }}
                    />
                    <div className="articles-books-card-body">
                      <strong className="articles-books-card-title">{t(`pages.${article.titleKey}`)}</strong>
                      <span className="articles-books-card-cat">{catLabel(article.category)}</span>
                    </div>
                  </a>
                ))}
              </div>
              <div className="articles-books-shelf-board" aria-hidden />
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}

export default ArticlesPracticeHub;
