import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Download,
  Heart,
  MoreHorizontal,
  Play,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spaceHubHref } from './practiceSpaceConfig';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import MeditationAudioPlayer from './MeditationAudioPlayer';
import {
  findEpisodeById,
  mapRemotePodcastPayload,
  PODCAST_EPISODES,
  PODCAST_PICK_IDS,
  PODCAST_TOPICS,
  podcastDesc,
  podcastMeta,
  podcastShow,
  podcastTitle,
} from './podcastHubData';
import PracticeCoverFavorite from './PracticeCoverFavorite';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';
import './PodcastsPracticeHub.css';

function PodcastsPracticeHub({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState(null);
  const [activeId, setActiveId] = useState('pc1');
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.podcasts));

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.podcasts, favorites);
  }, [favorites]);
  const [remoteEpisodes, setRemoteEpisodes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/podcasts')
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.episodes || []).map((r) =>
          mapRemotePodcastPayload(r, backendPublicUrl)
        );
        setRemoteEpisodes(rows);
        if (rows.length > 0 && !findEpisodeById(activeId, [...PODCAST_EPISODES, ...rows])) {
          setActiveId(rows[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteEpisodes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allEpisodes = useMemo(
    () => [...PODCAST_EPISODES, ...remoteEpisodes],
    [remoteEpisodes]
  );

  const q = search.trim().toLowerCase();

  const staticPicks = useMemo(
    () => PODCAST_PICK_IDS.map((id) => findEpisodeById(id, allEpisodes)).filter(Boolean),
    [allEpisodes]
  );

  const remotePicks = useMemo(
    () => remoteEpisodes.filter((ep) => ep.isFeaturedPick),
    [remoteEpisodes]
  );

  const picks = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const ep of [...remotePicks, ...staticPicks]) {
      if (!seen.has(ep.id)) {
        seen.add(ep.id);
        out.push(ep);
      }
    }
    return out.slice(0, 8);
  }, [remotePicks, staticPicks]);

  const recentVisible = useMemo(() => {
    let list = allEpisodes;
    if (topicFilter) {
      list = list.filter((ep) => ep.topic === topicFilter);
    }
    if (!q) return list;
    return list.filter((ep) => {
      const title = podcastTitle(ep, t).toLowerCase();
      const show = podcastShow(ep, t).toLowerCase();
      const desc = podcastDesc(ep, t).toLowerCase();
      return title.includes(q) || show.includes(q) || desc.includes(q);
    });
  }, [allEpisodes, topicFilter, q, t]);

  const active = activeId ? findEpisodeById(activeId, allEpisodes) : null;

  const titleFor = (ep) => podcastTitle(ep, t);
  const showFor = (ep) => podcastShow(ep, t);

  const playEpisode = (id) => {
    setActiveId(id);
  };

  const toggleFav = (id) => {
    setFavorites((prev) => toggleInFavoriteSet(prev, id));
  };

  const playerPractice = active
    ? {
        id: active.id,
        title: titleFor(active),
        durationMin: active.durationMin || 24,
        audioSource:
          active.audioSource || (active.embedUrl ? 'youtube' : active.audioUrl ? 'url' : 'youtube'),
        embedUrl: active.embedUrl || '',
        audioUrl: active.audioUrl || '',
      }
    : null;

  return (
    <div className={`podcast-hub podcast-hub--fullbleed fade-in${embedded ? ' podcast-hub--embedded' : ''}`}>
      <div className="podcast-hub-layout">
        <div className="podcast-hub-main">
          {!embedded ? (
            <button
              type="button"
              className="podcast-hub-back"
              onClick={() => navigate(spaceHubHref())}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              {t('pages.practicesBack')}
            </button>
          ) : null}

          <header className="podcast-hub-head">
            <h1 className="podcast-hub-title">{t('pages.podcastsPageTitle')}</h1>
            <p className="podcast-hub-lead">{t('pages.podcastsPageLead')}</p>
          </header>

          {picks.length > 0 ? (
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
                      <PracticeCoverFavorite
                        isFavorite={favorites.has(ep.id)}
                        onToggle={() => toggleFav(ep.id)}
                        ariaLabel={t('pages.meditationModalFavorite')}
                      />
                      <span className="podcast-hub-pick-overlay" />
                      <span className="podcast-hub-pick-play" aria-hidden>
                        <Play size={22} fill="currentColor" strokeWidth={0} />
                      </span>
                    </button>
                    <div className="podcast-hub-pick-body">
                      <strong>{titleFor(ep)}</strong>
                      <p>{podcastDesc(ep, t)}</p>
                      <span className="podcast-hub-pick-meta">{podcastMeta(ep, t)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

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
                  <span className="podcast-hub-recent-thumb-wrap">
                    <span
                      className="podcast-hub-recent-thumb"
                      style={{ backgroundImage: `url(${ep.poster})` }}
                    />
                    <PracticeCoverFavorite
                      isFavorite={favorites.has(ep.id)}
                      onToggle={() => toggleFav(ep.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                  </span>
                  <div className="podcast-hub-recent-meta">
                    <strong className="podcast-hub-recent-title">{titleFor(ep)}</strong>
                    <span className="podcast-hub-recent-sub">
                      {showFor(ep)} · {t('pages.podcastsEpisodeLabel', { n: ep.episodeNum })}
                    </span>
                  </div>
                  <span className="podcast-hub-recent-dur">{ep.duration}</span>
                  {ep.watchUrl ? (
                    <a
                      className="podcast-hub-recent-more"
                      href={ep.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('pages.podcastsOpenYoutube')}
                    >
                      <MoreHorizontal size={20} aria-hidden />
                    </a>
                  ) : null}
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
                  {playerPractice && (active.embedUrl || active.audioUrl) ? (
                    <div className="podcast-hub-player-audio">
                      <MeditationAudioPlayer
                        practice={playerPractice}
                        favorite={favorites.has(active.id)}
                        onToggleFavorite={() => toggleFav(active.id)}
                        t={t}
                      />
                    </div>
                  ) : (
                    <p className="podcast-hub-player-empty-hint">{t('pages.podcastsPlayerEmpty')}</p>
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
                    {active.watchUrl ? (
                      <a
                        className="podcast-hub-foot-btn"
                        href={active.watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download size={18} strokeWidth={2} />
                        {t('pages.podcastsDownload')}
                      </a>
                    ) : null}
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
            {topicFilter ? (
              <button
                type="button"
                className="podcast-hub-topic podcast-hub-topic--clear"
                onClick={() => {
                  setTopicFilter(null);
                  setSearch('');
                }}
              >
                {t('pages.eventsFilterAll')}
              </button>
            ) : null}
            {PODCAST_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className={`podcast-hub-topic podcast-hub-topic--${topic.style} ${
                  topicFilter === topic.id ? 'is-active' : ''
                }`}
                onClick={() => {
                  setTopicFilter(topic.id);
                  setSearch('');
                }}
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
