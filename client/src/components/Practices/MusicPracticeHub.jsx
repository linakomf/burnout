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
  Play,
  Radio,
  Search,
  Sparkles,
  Trees,
  Waves,
  Wind,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spaceHubHref } from './practiceSpaceConfig';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import MeditationAudioPlayer from './MeditationAudioPlayer';
import {
  FEATURED_TRACK_ID,
  findPlayableById,
  mapRemoteMusicTrack,
  mapRemoteQuickSound,
  MOOD_PLAYLISTS,
  musicArtist,
  musicGenre,
  musicTitle,
  MUSIC_HERO_IMG,
  MUSIC_TRACKS,
  QUICK_SOUNDS,
  STATE_CARDS,
} from './musicHubData';
import PracticeCoverFavorite from './PracticeCoverFavorite';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';
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

function MusicPracticeHub({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.music));

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.music, favorites);
  }, [favorites]);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [remoteQuick, setRemoteQuick] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/music')
      .then((res) => {
        if (cancelled) return;
        const items = res.data?.items || [];
        setRemoteTracks(
          items.filter((r) => r.kind === 'track').map((r) => mapRemoteMusicTrack(r, backendPublicUrl))
        );
        setRemoteQuick(
          items.filter((r) => r.kind === 'quick').map((r) => mapRemoteQuickSound(r, backendPublicUrl))
        );
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteTracks([]);
          setRemoteQuick([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allTracks = useMemo(
    () => [...MUSIC_TRACKS, ...remoteTracks],
    [remoteTracks]
  );
  const allQuick = useMemo(() => [...QUICK_SOUNDS, ...remoteQuick], [remoteQuick]);

  const q = search.trim().toLowerCase();

  const recommended = useMemo(() => allTracks, [allTracks]);

  const visibleRecommended = useMemo(() => {
    if (!q) return recommended.slice(0, 12);
    return recommended.filter((item) => {
      const title = musicTitle(item, t).toLowerCase();
      const artist = musicArtist(item, t).toLowerCase();
      return title.includes(q) || artist.includes(q);
    });
  }, [q, recommended, t]);

  const active = activeId ? findPlayableById(activeId, allTracks, allQuick) : null;

  const featured = findPlayableById(FEATURED_TRACK_ID, allTracks, allQuick);

  const playTrack = (id) => {
    setActiveId(id);
  };

  const toggleFav = (id) => {
    setFavorites((prev) => toggleInFavoriteSet(prev, id));
  };

  const titleFor = (item) => musicTitle(item, t);
  const artistFor = (item) => musicArtist(item, t);
  const genreFor = (item) => musicGenre(item, t);

  const playerPractice = active
    ? {
        id: active.id,
        title: titleFor(active),
        durationMin: active.durationMin || 3,
        audioSource:
          active.audioSource || (active.embedUrl ? 'youtube' : active.audioUrl ? 'url' : 'youtube'),
        embedUrl: active.embedUrl || '',
        audioUrl: active.audioUrl || '',
      }
    : null;

  return (
    <div className={`music-hub music-hub--fullbleed fade-in${embedded ? ' music-hub--embedded' : ''}`}>
      <div className="music-hub-layout">
        <div className="music-hub-main">
          {!embedded ? (
            <button
              type="button"
              className="music-hub-back"
              onClick={() => navigate(spaceHubHref())}>
              <ArrowLeft size={18} strokeWidth={2} aria-hidden />
              {t('pages.practicesBack')}
            </button>
          ) : null}

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
                    const first = allTracks.find((tr) => tr.mood === item.mood);
                    if (first) playTrack(first.id);
                  }}
                >
                  <span
                    className="music-hub-mood-media"
                    style={{ backgroundImage: `url(${item.image})` }}
                  />
                  <PracticeCoverFavorite
                    isFavorite={favorites.has(item.id)}
                    onToggle={() => toggleFav(item.id)}
                    ariaLabel={t('pages.meditationModalFavorite')}
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
              {allQuick.map((s) => {
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
                  <span className="music-hub-rec-thumb-wrap">
                    <span
                      className="music-hub-rec-thumb"
                      style={{ backgroundImage: `url(${item.poster})` }}
                    />
                    <PracticeCoverFavorite
                      isFavorite={favorites.has(item.id)}
                      onToggle={() => toggleFav(item.id)}
                      ariaLabel={t('pages.meditationModalFavorite')}
                    />
                  </span>
                  <div className="music-hub-rec-meta">
                    <strong className="music-hub-rec-title">{titleFor(item)}</strong>
                    <span className="music-hub-rec-sub">
                      {artistFor(item)} · {genreFor(item)}
                    </span>
                  </div>
                  <span className="music-hub-rec-dur">{item.durationShort}</span>
                  {item.watchUrl ? (
                    <a
                      className="music-hub-rec-more"
                      href={item.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('pages.musicOpenYoutube')}
                    >
                      <MoreHorizontal size={20} aria-hidden />
                    </a>
                  ) : null}
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
                    const first = allTracks.find((tr) => tr.mood === st.mood);
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
                  {playerPractice && (active.embedUrl || active.audioUrl) ? (
                    <div className="music-hub-player-audio">
                      <MeditationAudioPlayer
                        practice={playerPractice}
                        favorite={favorites.has(active.id)}
                        onToggleFavorite={() =>
                          setFavorites((prev) => {
                            const next = new Set(prev);
                            if (next.has(active.id)) next.delete(active.id);
                            else next.add(active.id);
                            return next;
                          })
                        }
                        t={t}
                      />
                    </div>
                  ) : (
                    <p className="music-hub-player-empty-hint">{t('pages.musicPlayerEmpty')}</p>
                  )}
                  {active.watchUrl ? (
                    <a
                      className="music-hub-player-yt"
                      href={active.watchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} aria-hidden />
                      {t('pages.musicOpenYoutube')}
                    </a>
                  ) : null}
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
