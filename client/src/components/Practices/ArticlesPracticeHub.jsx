import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BookMarked,
  BookOpen,
  Brain,
  Coffee,
  Feather,
  Flame,
  Heart,
  LayoutGrid,
  MessageCircle,
  Moon,
  Rocket,
  Scale,
  Smile,
  Sparkles,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spaceHubHref } from './practiceSpaceConfig';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import filmsCatalogHeroPhoto from '../../assets/films-catalog-hero-clouds.png';
import {
  ARTICLES_LIBRARY,
  BOOKS_LIBRARY,
  buildShelves,
  filterReadingList,
  mapRemoteArticlePayload,
  mapRemoteBookPayload,
  readingItemCategoryLabel,
  readingItemTitle,
} from './articlesHubData';
import PracticeCoverFavorite from './PracticeCoverFavorite';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';
import './ArticlesPracticeHub.css';

/** Статьи: темы контента на странице (порядок как в UX) */
const ARTICLE_FILTER_ITEMS = [
  { id: 'all', labelKey: 'articlesTabFilterAll', Icon: LayoutGrid },
  { id: 'burnout', labelKey: 'articlesFilterBurnout', Icon: Flame },
  { id: 'stress', labelKey: 'articlesFilterStress', Icon: Activity },
  { id: 'anxiety', labelKey: 'articlesFilterAnxiety', Icon: AlertCircle },
  { id: 'motivation', labelKey: 'articlesFilterMotivation', Icon: TrendingUp },
  { id: 'rest', labelKey: 'articlesFilterRest', Icon: Moon },
  { id: 'balance', labelKey: 'articlesFilterBalance', Icon: Scale },
  { id: 'emotions', labelKey: 'articlesFilterEmotions', Icon: Smile },
  { id: 'communication', labelKey: 'articlesFilterCommunication', Icon: MessageCircle },
];

/** Книги */
const BOOK_FILTER_ITEMS = [
  { id: 'all', labelKey: 'booksTabFilterAll', Icon: LayoutGrid },
  { id: 'psychology', labelKey: 'booksFilterPsychology', Icon: Brain },
  { id: 'selfgrowth', labelKey: 'booksFilterSelfgrowth', Icon: TrendingUp },
  { id: 'readsmotive', labelKey: 'booksFilterReadsmotive', Icon: Rocket },
  { id: 'lightread', labelKey: 'booksFilterLightread', Icon: Feather },
  { id: 'restreads', labelKey: 'booksFilterRestreads', Icon: Coffee },
  { id: 'fiction', labelKey: 'booksFilterFiction', Icon: BookMarked },
  { id: 'biography', labelKey: 'booksFilterBiography', Icon: UserCircle },
  { id: 'inspire', labelKey: 'booksFilterInspire', Icon: Sparkles },
];

const SHELF_META_ARTICLES = [
  { id: 'popular', titleKey: 'articlesShelfPopular' },
  { id: 'recent', titleKey: 'articlesShelfRecent' },
  { id: 'recommended', titleKey: 'articlesShelfRecommended' },
];

const SHELF_META_BOOKS = [
  { id: 'b-popular', titleKey: 'booksShelfPopular' },
  { id: 'b-new', titleKey: 'booksShelfNew' },
  { id: 'b-picks', titleKey: 'booksShelfPicks' },
];

function ArticlesPracticeHub({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [kind, setKind] = useState('article');
  const [pill, setPill] = useState('all');

  const [remoteArticles, setRemoteArticles] = useState([]);
  const [remoteBooks, setRemoteBooks] = useState([]);
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.reading));

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.reading, favorites);
  }, [favorites]);

  const toggleReadingFavorite = (itemId) => {
    setFavorites((prev) => toggleInFavoriteSet(prev, itemId));
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get('/reading')
      .then((res) => {
        if (cancelled) return;
        const rows = res.data?.items || [];
        setRemoteArticles(
          rows.filter((r) => r.kind === 'article').map((r) => mapRemoteArticlePayload(r, backendPublicUrl))
        );
        setRemoteBooks(
          rows.filter((r) => r.kind === 'book').map((r) => mapRemoteBookPayload(r, backendPublicUrl))
        );
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteArticles([]);
          setRemoteBooks([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const readingPool = useMemo(
    () => [...ARTICLES_LIBRARY, ...remoteArticles, ...BOOKS_LIBRARY, ...remoteBooks],
    [remoteArticles, remoteBooks]
  );

  const filterItems = kind === 'article' ? ARTICLE_FILTER_ITEMS : BOOK_FILTER_ITEMS;

  const shelves = useMemo(
    () => buildShelves(filterReadingList(readingPool, kind, pill)),
    [readingPool, kind, pill]
  );

  const shelfMeta = kind === 'article' ? SHELF_META_ARTICLES : SHELF_META_BOOKS;

  const setKindResetPill = (next) => {
    setKind(next);
    setPill('all');
  };

  return (
    <section className={`articles-hub articles-books--fullbleed fade-in${embedded ? ' articles-hub--embedded' : ''}`}>
      <div className="articles-hub-ambient" aria-hidden />
      <div className="articles-hub-panel">
        <header className="articles-hub-catalog-header">
          <div className="articles-hub-mock">
            <div className="articles-hub-hero-stage">
              {!embedded ? (
                <button
                  type="button"
                  className="articles-hub-back"
                  onClick={() => navigate(spaceHubHref())}>
                  <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                  {t('pages.practicesBack')}
                </button>
              ) : null}
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

                  <div
                    className="articles-hub-type-tabs"
                    role="tablist"
                    aria-label={t('pages.articlesReadingKindTabsAria')}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={kind === 'article'}
                      className={`articles-hub-type-tab ${kind === 'article' ? 'is-active' : ''}`}
                      onClick={() => setKindResetPill('article')}
                    >
                      {t('pages.articlesHubTabArticles')}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={kind === 'book'}
                      className={`articles-hub-type-tab ${kind === 'book' ? 'is-active' : ''}`}
                      onClick={() => setKindResetPill('book')}
                    >
                      {t('pages.articlesHubTabBooks')}
                    </button>
                  </div>

                  <div
                    className="articles-hub-filters"
                    role="tablist"
                    aria-label={
                      kind === 'article'
                        ? t('pages.articlesFiltersArticlesAria')
                        : t('pages.articlesFiltersBooksAria')
                    }
                  >
                    {filterItems.map(({ id: fid, labelKey, Icon }) => {
                      const isActive = pill === fid;
                      return (
                        <div key={`${kind}-${fid}`} className="articles-hub-filter-wrap">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`articles-hub-filter-pill ${isActive ? 'is-active' : ''}`}
                            onClick={() => setPill(fid)}
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
          {shelfMeta.map((shelf, shelfIdx) => (
            <section key={shelf.id} id={`reading-shelf-${shelfIdx}`} className="articles-books-shelf-section">
              <div className="articles-books-shelf-head">
                <h2 className="articles-books-shelf-title">{t(`pages.${shelf.titleKey}`)}</h2>
              </div>

              <div className="articles-books-shelf-row-wrap">
                <div className="articles-books-shelf-row">
                  {shelves[shelfIdx].map((item, i) => (
                    <button
                      key={`${shelf.id}-${item.id}-${i}`}
                      type="button"
                      className="articles-books-card"
                      onClick={() =>
                        kind === 'article'
                          ? navigate(`/practices/articles/read/${item.id}`)
                          : navigate(`/practices/articles/book/${item.id}`)
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
                            isFavorite={favorites.has(item.id)}
                            onToggle={() => toggleReadingFavorite(item.id)}
                            ariaLabel={t('pages.meditationModalFavorite')}
                          />
                          <span className="articles-books-card-tag">{readingItemCategoryLabel(item, t)}</span>
                        </div>
                      </div>
                      <h3 className="articles-books-card-title">{readingItemTitle(item, t)}</h3>
                    </button>
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
