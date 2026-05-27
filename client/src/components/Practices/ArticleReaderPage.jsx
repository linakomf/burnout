import React, { useEffect, useMemo, useState } from 'react';
import { formatArticleBodyToHtml } from '../../utils/articleBody';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import {
  articleSummaryLocaleKey,
  getArticleById,
  isRemoteArticleId,
  mapRemoteArticlePayload,
  readingItemCategoryLabel,
  readingItemTitle,
} from './articlesHubData';
import { articleBodyFor } from './readingBodies';
import { spaceSectionHref } from './practiceSpaceConfig';
import './ArticleReaderPage.css';

export default function ArticleReaderPage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const staticArticle = useMemo(() => getArticleById(articleId || ''), [articleId]);
  const fetchRemote = Boolean(articleId && !staticArticle && isRemoteArticleId(articleId));
  const [remoteArticle, setRemoteArticle] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(fetchRemote);

  useEffect(() => {
    if (!fetchRemote) {
      setRemoteArticle(null);
      setRemoteLoading(false);
      return undefined;
    }
    let cancelled = false;
    setRemoteLoading(true);
    setRemoteArticle(null);
    api
      .get(`/reading/${articleId}`)
      .then((res) => {
        if (!cancelled) setRemoteArticle(mapRemoteArticlePayload(res.data, backendPublicUrl));
      })
      .catch(() => {
        if (!cancelled) setRemoteArticle(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [articleId, fetchRemote]);

  const article = staticArticle || remoteArticle;
  const summaryKey = staticArticle ? articleSummaryLocaleKey(staticArticle.titleKey) : '';

  if (remoteLoading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>Загрузка…</div>;
  }

  if (!articleId || !article) {
    return <Navigate to={spaceSectionHref('articles')} replace />;
  }

  const categoryLabel = readingItemCategoryLabel(article, t);
  const title = readingItemTitle(article, t);
  const fromFile = staticArticle ? articleBodyFor(lang, staticArticle.id) : '';
  const bodyRaw =
    article.bodyFull ||
    fromFile ||
    article.descriptionShort ||
    (summaryKey ? t(`pages.${summaryKey}`) : '');
  const bodyHtml = formatArticleBodyToHtml(bodyRaw);
  const sourceUrl = article.url || '';

  return (
    <div className="article-reader fade-in">
      <div
        className="article-reader-hero-thumb"
        style={{ backgroundImage: `url(${article.image})` }}
        aria-hidden
      />
      <div className="article-reader-inner">
        <div className="article-reader-topbar">
          <button type="button" className="article-reader-back" onClick={() => navigate(spaceSectionHref('articles'))}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            {t('pages.practicesBack')}
          </button>

          <span className="article-reader-chip">{categoryLabel}</span>
        </div>
        <h1 className="article-reader-title">{title}</h1>

        {article.descriptionShort && article.bodyFull ? (
          <p className="article-reader-lead">{article.descriptionShort}</p>
        ) : null}

        <div className="article-reader-body-wrap">
          <div
            className="article-reader-body"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>

        {sourceUrl ? (
          <div className="article-reader-footer">
            <a className="article-reader-original" href={sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={18} strokeWidth={2} aria-hidden />
              {t('pages.articleReaderSourceCta')}
            </a>
            <p className="article-reader-hint">{t('pages.articleReaderSourceHint')}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
