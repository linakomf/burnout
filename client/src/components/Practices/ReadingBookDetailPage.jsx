import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import {
  bookDescLocaleKey,
  getBookById,
  isRemoteBookId,
  mapRemoteBookPayload,
  readingItemCategoryLabel,
  readingItemTitle,
} from './articlesHubData';
import { bookDescFor } from './readingBodies';
import { spaceSectionHref } from './practiceSpaceConfig';
import './ReadingBookDetailPage.css';

export default function ReadingBookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();

  const staticBook = useMemo(() => getBookById(bookId || ''), [bookId]);
  const fetchRemote = Boolean(bookId && !staticBook && isRemoteBookId(bookId));
  const [remoteBook, setRemoteBook] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(fetchRemote);

  useEffect(() => {
    if (!fetchRemote) {
      setRemoteBook(null);
      setRemoteLoading(false);
      return undefined;
    }
    let cancelled = false;
    setRemoteLoading(true);
    setRemoteBook(null);
    api
      .get(`/reading/${bookId}`)
      .then((res) => {
        if (!cancelled) setRemoteBook(mapRemoteBookPayload(res.data, backendPublicUrl));
      })
      .catch(() => {
        if (!cancelled) setRemoteBook(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookId, fetchRemote]);

  const book = staticBook || remoteBook;
  const descKey = staticBook ? bookDescLocaleKey(staticBook.titleKey) : '';

  if (remoteLoading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>Загрузка…</div>;
  }

  if (!bookId || !book) {
    return <Navigate to={spaceSectionHref('articles')} replace />;
  }

  const categoryLabel = readingItemCategoryLabel(book, t);
  const title = readingItemTitle(book, t);
  const fromFile = staticBook ? bookDescFor(lang, staticBook.id) : '';
  const description =
    book.descriptionShort || fromFile || (descKey ? t(`pages.${descKey}`) : '');
  const readUrl = book.url || '';

  return (
    <div className="reading-book-detail fade-in">
      <button type="button" className="reading-book-back" onClick={() => navigate(spaceSectionHref('articles'))}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        {t('pages.practicesBack')}
      </button>

      <div className="reading-book-layout">
        <div
          className="reading-book-cover"
          style={{ backgroundImage: `url(${book.image})` }}
          role="img"
          aria-hidden
        />
        <div className="reading-book-main">
          <span className="reading-book-chip">{categoryLabel}</span>
          <h1 className="reading-book-title">{title}</h1>
          <div className="reading-book-desc">{description}</div>
          {readUrl ? (
            <>
              <a className="reading-book-read-btn" href={readUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={18} strokeWidth={2} aria-hidden />
                {t('pages.bookDetailReadCta')}
              </a>
              <p className="reading-book-hint">{t('pages.bookDetailExternalHint')}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
