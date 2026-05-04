import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Battery,
  Bell,
  Bird,
  Brain,
  CloudRain,
  Crosshair,
  ExternalLink,
  Flame,
  Heart,
  MoreHorizontal,
  Music,
  Music2,
  Pause,
  Play,
  Radio,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trees,
  Waves,
  Wind,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  FEATURED_TRACK_ID,
  findPlayableById,
  MOOD_PLAYLISTS,
  MUSIC_HERO_IMG,
  MUSIC_TRACKS,
  QUICK_SOUNDS,
  STATE_CARDS,
} from './musicHubData';
import './MusicPracticeHub.css';

const QUICK_ICON_MAP = {
  CloudRain,
  Waves,
  Trees,
  Wind,
  Radio,
  Music,
  Flame,
  Bird,
};

const STATE_ICONS = [Brain, Battery, Crosshair, Flame, Heart, Music2];

function MusicPracticeHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set(['m2']));
  const [playing, setPlaying] = useState(false);

  const q = search.trim().toLowerCase();

  const recommended = useMemo(() => MUSIC_TRACKS.slice(0, 4), []);

  const visibleRecommended = useMemo(() => {
    if (!q) return recommended;
    return recommended.filter((item) => {
      const title = t(`pages.${item.titleKey}`).toLowerCase();
      const artist = t(`pages.${item.artistKey}`).toLowerCase();
      return title.includes(q) || artist.includes(q);
    });
  }, [q, recommended, t]);

  const active = activeId ? findPlayableById(activeId) : null;

  useEffect(() => {
    if (activeId) setPlaying(true);
  }, [activeId]);

  const featured = findPlayableById(FEATURED_TRACK_ID);

  const playTrack = (id) => {
    setActiveId(id);
  };

  const toggleFav = (id, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const titleFor = (item) => (item.titleKey ? t(`pages.${item.titleKey}`) : '');
  const artistFor = (item) => (item.artistKey ? t(`pages.${item.artistKey}`) : '');
  const genreFor = (item) => (item.genreKey ? t(`pages.${item.genreKey}`) : '');

  return (
    <div className="music-hub music-hub--fullbleed fade-in">
      <div className="music-hub-layout">
        <div className="music-hub-main">
          <button type="button" className="music-hub-back" onClick={() => navigate('/practices')}>
            <ArrowLeft size={18} strokeWidth={2} aria-hidden />
            {t('pages.practicesBackToHub')}
          </button>

          <header className="music-hub-head">
            <h1 className="music-hub-title">{t('pages.musicRecoveryTitle')}</h1>
            <p className="music-hub-lead">{t('pages.musicRecoveryLead')}</p>
          </header>

          <section className="music-hub-hero" aria-labelledby="music-hero-heading">
            <div
              className="music-hub-hero-bg"
              style={{ backgroundImage: `url(${MUSIC_HERO_IMG})` }}
              role="presentation"
              aria-hidden
            />
            <div className="music-hub-hero-wash" aria-hidden />
            <div className="music-hub-hero-copy">
              <span className="music-hub-hero-tag">{t('pages.musicPickOfDay')}</span>
              <h2 id="music-hero-heading" className="music-hub-hero-title">
                {t('pages.musicFeaturedBannerTitle')}
              </h2>
              <p className="music-hub-hero-desc">{t('pages.musicFeaturedBannerDesc')}</p>
              {featured && (
                <button
                  type="button"
                  className="music-hub-hero-cta"
                  onClick={() => playTrack(FEATURED_TRACK_ID)}
                >
                  <Play size={18} fill="currentColor" aria-hidden />
                  {t('pages.musicListenSelection')}
                </button>
              )}
            </div>
          </section>

          <section className="music-hub-section" aria-labelledby="music-moods-heading">
            <h3 id="music-moods-heading" className="music-hub-section-title">
              {t('pages.musicMoodPlaylistsTitle')}
            </h3>
            <div className="music-hub-moods">
              {MOOD_PLAYLISTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="music-hub-mood-card"
                  onClick={() => {
                    const first = MUSIC_TRACKS.find((tr) => tr.mood === item.mood);
                    if (first) playTrack(first.id);
                  }}
                >
                  <span
                    className="music-hub-mood-media"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <span className="music-hub-mood-overlay" />
                  <span className="music-hub-mood-body">
                    <Sparkles size={14} strokeWidth={2} className="music-hub-mood-ico" aria-hidden />
                    <span className="music-hub-mood-label">{t(`pages.${item.labelKey}`)}</span>
                    <span className="music-hub-mood-count">
                      {item.tracksCount} {t('pages.musicTracksUnit')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="music-hub-section" aria-labelledby="music-quick-heading">
            <h3 id="music-quick-heading" className="music-hub-section-title">
              {t('pages.musicQuickSoundsTitle')}
            </h3>
            <div className="music-hub-quick">
              {QUICK_SOUNDS.map((s) => {
                const Ico = QUICK_ICON_MAP[s.icon] || Music2;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`music-hub-quick-btn ${activeId === s.id ? 'is-active' : ''}`}
                    onClick={() => playTrack(s.id)}
                  >
                    <span className="music-hub-quick-ico">
                      <Ico size={22} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="music-hub-quick-label">{t(`pages.${s.labelKey}`)}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="music-hub-section" aria-labelledby="music-rec-heading">
            <h3 id="music-rec-heading" className="music-hub-section-title">
              {t('pages.musicRecommendedTitle')}
            </h3>
            <ul className="music-hub-rec-list">
              {visibleRecommended.map((item) => (
                <li key={item.id} className="music-hub-rec-row">
                  <button
                    type="button"
                    className="music-hub-rec-play"
                    onClick={() => playTrack(item.id)}
                    aria-label={t('pages.musicPlay')}
                  >
                    <Play size={18} aria-hidden />
                  </button>
                  <span
                    className="music-hub-rec-thumb"
                    style={{ backgroundImage: `url(${item.poster})` }}
                  />
                  <div className="music-hub-rec-meta">
                    <strong className="music-hub-rec-title">{titleFor(item)}</strong>
                    <span className="music-hub-rec-sub">
                      {artistFor(item)} · {genreFor(item)}
                    </span>
                  </div>
                  <span className="music-hub-rec-dur">{item.durationShort}</span>
                  <button
                    type="button"
                    className={`music-hub-rec-fav ${favorites.has(item.id) ? 'is-on' : ''}`}
                    onClick={(e) => toggleFav(item.id, e)}
                    aria-label={t('pages.musicFavorite')}
                  >
                    <Heart size={18} strokeWidth={2} fill={favorites.has(item.id) ? 'currentColor' : 'none'} />
                  </button>
                  <a
                    className="music-hub-rec-more"
                    href={item.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('pages.musicOpenYoutube')}
                  >
                    <MoreHorizontal size={20} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="music-hub-side">
          <div className="music-hub-side-toolbar">
            <label className="music-hub-search">
              <Search size={18} strokeWidth={2} aria-hidden />
              <input
                type="search"
                placeholder={t('pages.musicSearchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <button type="button" className="music-hub-bell" aria-label={t('pages.musicNotifications')}>
              <Bell size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <h3 className="music-hub-side-heading">{t('pages.musicStateTitle')}</h3>
          <div className="music-hub-states">
            {STATE_CARDS.map((st, idx) => {
              const Ico = STATE_ICONS[idx] || Sparkles;
              return (
                <button
                  key={st.id}
                  type="button"
                  className="music-hub-state-card"
                  style={{ background: st.tint }}
                  onClick={() => {
                    const first = MUSIC_TRACKS.find((tr) => tr.mood === st.mood);
                    if (first) playTrack(first.id);
                  }}
                >
                  <span className="music-hub-state-ico">
                    <Ico size={22} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="music-hub-state-text">
                    <strong>{t(`pages.${st.labelKey}`)}</strong>
                    <span>{t(`pages.${st.descKey}`)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="music-hub-player">
            {active ? (
              <>
                <div
                  className="music-hub-player-cover"
                  style={{ backgroundImage: `url(${active.poster})` }}
                />
                <div className="music-hub-player-body">
                  <div className="music-hub-player-meta">
                    <strong>{titleFor(active)}</strong>
                    <span>
                      {artistFor(active)} · {genreFor(active)}
                    </span>
                  </div>
                  <div className="music-hub-player-bar-wrap">
                    <span className="music-hub-player-time">1:20</span>
                    <div className="music-hub-player-bar">
                      <span className="music-hub-player-bar-fill" />
                    </div>
                    <span className="music-hub-player-time">{active.durationShort || '3:45'}</span>
                  </div>
                  <div className="music-hub-player-controls">
                    <button type="button" className="music-hub-pc-ico" tabIndex={-1} aria-hidden>
                      <Shuffle size={18} strokeWidth={2} />
                    </button>
                    <button type="button" className="music-hub-pc-ico" tabIndex={-1} aria-hidden>
                      <SkipBack size={20} strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      className="music-hub-pc-play"
                      onClick={() => setPlaying((p) => !p)}
                      aria-label={playing ? t('pages.musicPause') : t('pages.musicPlay')}
                    >
                      {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                    </button>
                    <button type="button" className="music-hub-pc-ico" tabIndex={-1} aria-hidden>
                      <SkipForward size={20} strokeWidth={2} />
                    </button>
                    <button type="button" className="music-hub-pc-ico" tabIndex={-1} aria-hidden>
                      <Repeat size={18} strokeWidth={2} />
                    </button>
                  </div>
                  {playing && (
                    <div className="music-hub-player-frame">
                      <iframe
                        key={active.id}
                        title={titleFor(active)}
                        src={`${active.embedUrl}${active.embedUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <a
                    className="music-hub-player-yt"
                    href={active.watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={14} aria-hidden />
                    {t('pages.musicOpenYoutube')}
                  </a>
                </div>
              </>
            ) : (
              <div className="music-hub-player-empty">{t('pages.musicPlayerEmpty')}</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default MusicPracticeHub;
