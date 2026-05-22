import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ArticleReaderPage from './ArticleReaderPage';
import ReadingBookDetailPage from './ReadingBookDetailPage';
import FilmsBannerCollectionPage from './FilmsBannerCollectionPage';
import FilmDetailPage from './FilmDetailPage';
import EventDetailPage from './EventDetailPage';
import FilmsPracticeHub from './FilmsPracticeHub';
import MeditationPracticeSection from './MeditationPracticeSection';
import EventsPracticeHub from './EventsPracticeHub';
import ArticlesPracticeHub from './ArticlesPracticeHub';
import MusicPracticeHub from './MusicPracticeHub';
import PodcastsPracticeHub from './PodcastsPracticeHub';
import PracticesHome from './PracticesHome';
import PracticesFavorites from './PracticesFavorites';
import { isValidSpaceSection, spaceSectionHref } from './practiceSpaceConfig';
import './Practices.css';

/** Старые ссылки ?section=films → /practices/films */
function PracticesIndex() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const section = params.get('section') || '';
  if (section && isValidSpaceSection(section)) {
    return <Navigate to={spaceSectionHref(section)} replace />;
  }
  return <PracticesHome />;
}

function Practices() {
  const { pathname } = useLocation();
  const isEventDetailPage = /^\/practices\/events\/.+/.test(pathname);
  const isFilmDetailPage = /^\/practices\/films\/(?!collections)[^/]+$/.test(pathname);
  const isArticlesReader =
    pathname.startsWith('/practices/articles/read/') ||
    pathname.startsWith('/practices/articles/book/');
  const isHubOnly = pathname === '/practices' || pathname === '/practices/';

  return (
    <div
      className={`practices-page practices-page--hub fade-in${
        isEventDetailPage ? ' practices-page--event-detail' : ''
      }${isFilmDetailPage ? ' practices-page--film-detail' : ''}${
        isArticlesReader ? ' practices-page--articles-hub' : ''
      }${!isHubOnly ? ' practices-page--space-section' : ''}`}
    >
      <Routes>
        <Route index element={<PracticesIndex />} />
        <Route path="favorites" element={<PracticesFavorites />} />
        <Route path="films/collections/:bannerId" element={<FilmsBannerCollectionPage />} />
        <Route path="films/:filmId" element={<FilmDetailPage />} />
        <Route path="films" element={<FilmsPracticeHub />} />
        <Route path="meditation" element={<MeditationPracticeSection />} />
        <Route path="podcasts" element={<PodcastsPracticeHub />} />
        <Route path="music" element={<MusicPracticeHub />} />
        <Route path="articles/read/:articleId" element={<ArticleReaderPage />} />
        <Route path="articles/book/:bookId" element={<ReadingBookDetailPage />} />
        <Route path="articles" element={<ArticlesPracticeHub />} />
        <Route path="events/:eventId" element={<EventDetailPage />} />
        <Route path="events" element={<EventsPracticeHub />} />
        <Route path="*" element={<Navigate to="/practices" replace />} />
      </Routes>
    </div>
  );
}

export default Practices;
