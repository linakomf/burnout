import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Download,
  FastForward,
  Heart,
  MoreHorizontal,
  Pause,
  Play,
  Rewind,
  Search,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  PODCAST_EPISODES,
  PODCAST_PICK_IDS,
  PODCAST_TOPICS,
  findEpisodeById,
} from './podcastHubData';
import './PodcastsPracticeHub.css';

function PodcastsPracticeHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState('pc1');
  const [playing, setPlaying] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set(['pc1']));

  const q = search.trim().toLowerCase();

  const picks = useMemo(
    () => PODCAST_PICK_IDS.map((id) => findEpisodeById(id)).filter(Boolean),
    []
  );

  const recentVisible = useMemo(() => {
    if (!q) return PODCAST_EPISODES;
    return PODCAST_EPISODES.filter((ep) => {
      const title = t(`pages.${ep.titleKey}`).toLowerCase();
      const show = t(`pages.${ep.showKey}`).toLowerCase();
      return title.includes(q) || show.includes(q);
    });
  }, [q, t]);

  const active = activeId ? findEpisodeById(activeId) : null;

  const titleFor = (ep) => (ep?.titleKey ? t(`pages.${ep.titleKey}`) : '');
  const showFor = (ep) => (ep?.showKey ? t(`pages.${ep.showKey}`) : '');

  const playEpisode = (id) => {
    setActiveId(id);
    setPlaying(true);
  };

  const toggleFav = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const topicQuery = (labelKey) => {
    setSearch(t(`pages.${labelKey}`));
  };

  return (
    <div className="podcast-hub podcast-hub--fullbleed fade-in">
      <div className="podcast-hub-layout">
        <div className="podcast-hub-main">
          <button type="button" className="podcast-hub-back" onClick={() => navigate('/practices')}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            {t('pages.practicesBackToHub')}
          </button>

          <header className="podcast-hub-head">
            <h1 className="podcast-hub-title">{t('pages.podcastsPageTitle')}</h1>
            <p className="podcast-hub-lead">{t('pages.podcastsPageLead')}</p>
          </header>

          <section className="podcast-hub-section" aria-labelledby="podcast-picks-heading">
            <h2 id="podcast-picks-heading" className="podcast-hub-section-title">
              {t('pages.podcastsPickSection')}
            </h2>
            <div className="podcast-hub-picks">
              {picks.map((ep) => (
                <article key={ep.id} className="podcast-hub-pick">
                  <button
                    type="button"
                    className={`podcast-hub-pick-visual ${activeId === ep.id ? 'is-active' : ''}`}
                    onClick={() => playEpisode(ep.id)}
                  >
                    <span
                      className="podcast-hub-pick-media"
                      style={{ backgroundImage: `url(${ep.poster})` }}
                    />
                    <span className="podcast-hub-pick-overlay" />
                    <span className="podcast-hub-pick-play" aria-hidden>
                      <Play size={22} fill="currentColor" strokeWidth={0} />
                    </span>
                  </button>
                  <div className="podcast-hub-pick-body">
                    <strong>{titleFor(ep)}</strong>
                    <p>{t(`pages.${ep.descKey}`)}</p>
                    <span className="podcast-hub-pick-meta">{t(`pages.${ep.metaKey}`)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="podcast-hub-section" aria-labelledby="podcast-recent-heading">
            <h2 id="podcast-recent-heading" className="podcast-hub-section-title">
              {t('pages.podcastsRecentSection')}
            </h2>
            <ul className="podcast-hub-recent">
              {recentVisible.map((ep) => (
                <li key={ep.id} className="podcast-hub-recent-row">
                  <button
                    type="button"
                    className="podcast-hub-recent-play"
                    onClick={() => playEpisode(ep.id)}
                    aria-label={t('pages.podcastsPlay')}
                  >
                    <Play size={18} aria-hidden />
                  </button>
                  <span
                    className="podcast-hub-recent-thumb"
                    style={{ backgroundImage: `url(${ep.poster})` }}
                  />
                  <div className="podcast-hub-recent-meta">
                    <strong className="podcast-hub-recent-title">{titleFor(ep)}</strong>
                    <span className="podcast-hub-recent-sub">
                      {showFor(ep)} · {t('pages.podcastsEpisodeLabel', { n: ep.episodeNum })}
                    </span>
                  </div>
                  <span className="podcast-hub-recent-dur">{ep.duration}</span>
                  <a
                    className="podcast-hub-recent-more"
                    href={ep.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('pages.podcastsOpenYoutube')}
                  >
                    <MoreHorizontal size={20} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="podcast-hub-side">
          <div className="podcast-hub-toolbar">
            <label className="podcast-hub-search">
              <Search size={18} strokeWidth={2} aria-hidden />
              <input
                type="search"
                placeholder={t('pages.podcastsSearchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button type="button" className="podcast-hub-bell" aria-label={t('pages.podcastsNotifications')}>
              <Bell size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="podcast-hub-player-card">
            <h3 className="podcast-hub-side-heading">{t('pages.podcastsNowPlaying')}</h3>
            {active ? (
              <>
                <div
                  className="podcast-hub-player-cover"
                  style={{ backgroundImage: `url(${active.poster})` }}
                />
                <div className="podcast-hub-player-meta-top">
                  <strong>{titleFor(active)}</strong>
                  <span>{showFor(active)}</span>
                </div>
                <div className="podcast-hub-player-body">
                  <div className="podcast-hub-player-bar-wrap">
                    <span className="podcast-hub-player-time">{active.progressDisplay}</span>
                    <div className="podcast-hub-player-bar">
                      <span className="podcast-hub-player-bar-fill" />
                    </div>
                    <span className="podcast-hub-player-time">{active.totalDisplay}</span>
                  </div>
                  <div className="podcast-hub-player-controls">
                    <button type="button" className="podcast-hub-pc-skip" tabIndex={-1} aria-hidden>
                      <Rewind size={20} strokeWidth={2} />
                      <span>15</span>
                    </button>
                    <button type="button" className="podcast-hub-pc-ico" tabIndex={-1} aria-hidden>
                      <SkipBack size={20} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className="podcast-hub-pc-play"
                      onClick={() => setPlaying((p) => !p)}
                      aria-label={playing ? t('pages.podcastsPause') : t('pages.podcastsPlay')}
                    >
                      {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                    </button>
                    <button type="button" className="podcast-hub-pc-ico" tabIndex={-1} aria-hidden>
                      <SkipForward size={20} strokeWidth={2} />
                    </button>
                    <button type="button" className="podcast-hub-pc-skip" tabIndex={-1} aria-hidden>
                      <FastForward size={20} strokeWidth={2} />
                      <span>15</span>
                    </button>
                  </div>
                  {playing && (
                    <div className="podcast-hub-player-frame">
                      <iframe
                        key={active.id}
                        title={titleFor(active)}
                        src={`${active.embedUrl}${active.embedUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <div className="podcast-hub-player-foot">
                    <button
                      type="button"
                      className={`podcast-hub-foot-btn ${favorites.has(active.id) ? 'is-on' : ''}`}
                      onClick={() => toggleFav(active.id)}
                    >
                      <Heart
                        size={18}
                        strokeWidth={2}
                        fill={favorites.has(active.id) ? 'currentColor' : 'none'}
                      />
                      {t('pages.podcastsFavorite')}
                    </button>
                    <a className="podcast-hub-foot-btn" href={active.watchUrl} target="_blank" rel="noopener noreferrer">
                      <Download size={18} strokeWidth={2} />
                      {t('pages.podcastsDownload')}
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="podcast-hub-player-empty">{t('pages.podcastsPlayerEmpty')}</div>
            )}
          </div>

          <h3 className="podcast-hub-side-heading podcast-hub-side-heading--topics">
            {t('pages.podcastsTopicsTitle')}
          </h3>
          <div className="podcast-hub-topics">
            {PODCAST_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={`podcast-hub-topic podcast-hub-topic--${topic.style}`}
                onClick={() => topicQuery(topic.labelKey)}
              >
                {t(`pages.${topic.labelKey}`)}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PodcastsPracticeHub;
