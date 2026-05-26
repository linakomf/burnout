import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Clapperboard,
  Music2,
  Play,
  Smile,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spaceHubHref } from './practiceSpaceConfig';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import MeditationAudioPlayer from './MeditationAudioPlayer';
import {
  findPlayableById,
  mapRemoteMusicTrack,
  mapRemoteQuickSound,
  mapHubCollection,
  musicArtist,
  musicGenre,
  musicTitle,
  MUSIC_HERO_IMG,
} from './musicHubData';
import {
  getTrackMoodTags,
  MUSIC_FILTER_GENRE_OPTIONS,
  MUSIC_FILTER_MOOD_OPTIONS,
  trackPassesMusicFilters,
} from './musicHubFilters';
import filmsCatalogHeroPhoto from '../../assets/films-catalog-hero-clouds.png';
import './MusicPracticeHub.css';

function orderIdsByOptions(options, ids) {
  const rank = new Map(
    options.filter((o) => o.id != null).map((o, i) => [o.id, i])
  );
  return [...ids].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
}

function labelKeyForOptionId(options, id) {
  const opt = options.find((o) => o.id === id);
  return opt ? opt.labelKey : String(id);
}

function MusicFilterDropdown({ isOpen, options, selectedIds, t, onToggleOption, alignEnd, tall }) {
  if (!isOpen) return null;
  return (
    <ul
      className={`music-hub-filter-menu${alignEnd ? ' music-hub-filter-menu--end' : ''}${tall ? ' music-hub-filter-menu--tall' : ''}`}
      role="listbox"
      aria-multiselectable="true"
    >
      {options.map((opt) => {
        const isAny = opt.id === null;
        const isSelected = isAny ? selectedIds.length === 0 : selectedIds.includes(opt.id);
        return (
          <li key={isAny ? '_all' : String(opt.id)} className="music-hub-filter-menu-item">
            <button
              type="button"
              className={`music-hub-filter-menu-btn ${isSelected ? 'is-selected' : ''}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => onToggleOption(opt.id)}
            >
              {t(`pages.${opt.labelKey}`)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MusicPracticeHub({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const filtersBlockRef = useRef(null);
  const [openFilterKey, setOpenFilterKey] = useState(null);
  const [filtMoods, setFiltMoods] = useState([]);
  const [filtGenres, setFiltGenres] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [remoteQuick, setRemoteQuick] = useState([]);
  const [hubCollections, setHubCollections] = useState([]);
  const [featuredTrackId, setFeaturedTrackId] = useState('');
  const [personalizedTracks, setPersonalizedTracks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/music/hub')
      .then((res) => {
        if (cancelled) return;
        const items = res.data?.items || [];
        setRemoteTracks(
          items.filter((r) => r.kind === 'track').map((r) => mapRemoteMusicTrack(r, backendPublicUrl))
        );
        setRemoteQuick(
          items.filter((r) => r.kind === 'quick').map((r) => mapRemoteQuickSound(r, backendPublicUrl))
        );
        const cols = (res.data?.collections || [])
          .map((c) => mapHubCollection(c))
          .filter(Boolean);
        setHubCollections(cols);
        if (res.data?.featuredTrackId) setFeaturedTrackId(res.data.featuredTrackId);
        setPersonalizedTracks(
          (res.data?.personalizedTracks || []).map((r) => mapRemoteMusicTrack(r, backendPublicUrl))
        );
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteTracks([]);
          setRemoteQuick([]);
          setHubCollections([]);
          setPersonalizedTracks([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const allTracks = useMemo(() => remoteTracks, [remoteTracks]);
  const allQuick = useMemo(() => remoteQuick, [remoteQuick]);

  const recommended = useMemo(() => allTracks, [allTracks]);

  const closeFilters = useCallback(() => setOpenFilterKey(null), []);

  useEffect(() => {
    if (!openFilterKey) return undefined;
    const onDoc = (e) => {
      const root = filtersBlockRef.current;
      if (!root) return;
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const inside =
        path.length > 0 ? path.includes(root) : e.target instanceof Node && root.contains(e.target);
      if (!inside) closeFilters();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') closeFilters();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [openFilterKey, closeFilters]);

  const toggleMoodOption = useCallback((id) => {
    if (id === null) {
      setFiltMoods([]);
      return;
    }
    setFiltMoods((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleGenreOption = useCallback((id) => {
    if (id === null) {
      setFiltGenres([]);
      return;
    }
    setFiltGenres((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const anyAdvancedFilter = filtMoods.length > 0 || filtGenres.length > 0;

  const visibleRecommended = useMemo(() => {
    const filtered = recommended.filter((item) =>
      trackPassesMusicFilters(item, { moods: filtMoods, genres: filtGenres })
    );
    return filtered.slice(0, 12);
  }, [recommended, filtMoods, filtGenres]);

  const displayCollections = useMemo(
    () =>
      hubCollections.filter((item) => {
        const count = Number(item.tracksCount) || 0;
        const idsCount = Array.isArray(item.trackIds) ? item.trackIds.length : 0;
        return count > 0 || idsCount > 0;
      }),
    [hubCollections]
  );

  const activePlaylist = useMemo(
    () => displayCollections.find((p) => p.id === activePlaylistId) || null,
    [activePlaylistId, displayCollections]
  );

  const playlistTracks = useMemo(() => {
    if (!activePlaylist) return [];
    const ids = activePlaylist.trackIds || [];
    if (ids.length > 0) {
      const byId = new Map(allTracks.map((tr) => [tr.id, tr]));
      return ids.map((id) => byId.get(id)).filter(Boolean);
    }
    return allTracks.filter((tr) => getTrackMoodTags(tr).includes(activePlaylist.mood));
  }, [activePlaylist, allTracks]);

  const playlistOtherTracks = useMemo(() => {
    if (!activeId) return playlistTracks;
    return playlistTracks.filter((tr) => tr.id !== activeId);
  }, [playlistTracks, activeId]);

  const active = activeId ? findPlayableById(activeId, allTracks, allQuick) : null;

  const featured = findPlayableById(featuredTrackId, allTracks, allQuick);

  const playTrack = (id, { clearPlaylist = false } = {}) => {
    setActiveId(id);
    if (clearPlaylist) setActivePlaylistId(null);
  };

  const openPlaylist = (playlistItem) => {
    const ids = playlistItem.trackIds || [];
    let tracks = [];
    if (ids.length > 0) {
      const byId = new Map(allTracks.map((tr) => [tr.id, tr]));
      tracks = ids.map((id) => byId.get(id)).filter(Boolean);
    } else {
      tracks = allTracks.filter((tr) => getTrackMoodTags(tr).includes(playlistItem.mood));
    }
    setActivePlaylistId(playlistItem.id);
    setActiveId(tracks[0]?.id ?? null);
  };

  const collectionLabel = (item) =>
    item.title || (item.labelKey ? t(`pages.${item.labelKey}`) : '');

  const titleFor = (item) => musicTitle(item, t);
  const artistFor = (item) => musicArtist(item, t);
  const genreFor = (item) => musicGenre(item, t);
  const featuredHeroImage = featured?.poster || MUSIC_HERO_IMG;

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
    <div
      className={`music-hub music-hub--fullbleed music-hub--catalog fade-in${embedded ? ' music-hub--embedded' : ''}`}
    >
      <div className="music-hub-ambient" aria-hidden />
      <div className="music-hub-panel">
        <header className="music-hub-catalog-header">
          <div className="music-hub-mock">
            <div className="music-hub-hero-stage">
              {!embedded ? (
                <button
                  type="button"
                  className="music-hub-back"
                  onClick={() => navigate(spaceHubHref())}
                >
                  <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                  {t('pages.practicesBack')}
                </button>
              ) : null}
              <div
                className="music-hub-hero-photo"
                style={{ backgroundImage: `url(${filmsCatalogHeroPhoto})` }}
                role="img"
                aria-label={t('pages.filmsCatalogHeroPhotoAlt')}
              />
            </div>
            <div className="music-hub-sheet">
              <div className="music-hub-sheet-notch" aria-hidden />
              <div className="music-hub-sheet-inner">
                <h1 className="music-hub-title-v2">
                  {t('pages.musicRecoveryTitle')}
                  <Music2 className="music-hub-title-icon" size={28} strokeWidth={1.65} aria-hidden />
                </h1>
                <p className="music-hub-lead-v2">{t('pages.musicRecoveryLead')}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="music-hub-layout music-hub-layout--body">
        <div className="music-hub-main">
          <section className="music-hub-hero" aria-labelledby="music-hero-heading">
            <div
              className="music-hub-hero-bg"
              style={{ backgroundImage: `url(${featuredHeroImage})` }}
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
                  onClick={() => playTrack(featuredTrackId, { clearPlaylist: true })}
                >
                  <Play size={18} fill="currentColor" aria-hidden />
                  {t('pages.musicListenSelection')}
                </button>
              )}
            </div>
          </section>

          <div ref={filtersBlockRef} className="music-hub-filters-stack">
            <div
              className="music-hub-filter-toolbar"
              role="toolbar"
              aria-label={t('pages.musicFilterToolbarAria')}
            >
              <div className="music-hub-filter-pill-wrap">
                <button
                  type="button"
                  className={`music-hub-filter-pill ${filtMoods.length > 0 ? 'is-active' : ''}`}
                  aria-expanded={openFilterKey === 'mood'}
                  aria-haspopup="listbox"
                  onClick={() => setOpenFilterKey((k) => (k === 'mood' ? null : 'mood'))}
                >
                  <Smile size={18} strokeWidth={2.1} aria-hidden />
                  <span className="music-hub-filter-pill-text">
                    {t('pages.musicFilterPillMood')}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`music-hub-filter-pill-chevron ${openFilterKey === 'mood' ? 'is-open' : ''}`}
                    aria-hidden
                  />
                </button>
                <MusicFilterDropdown
                  isOpen={openFilterKey === 'mood'}
                  options={MUSIC_FILTER_MOOD_OPTIONS}
                  selectedIds={filtMoods}
                  t={t}
                  onToggleOption={toggleMoodOption}
                  tall
                />
              </div>

              <div className="music-hub-filter-pill-wrap">
                <button
                  type="button"
                  className={`music-hub-filter-pill ${filtGenres.length > 0 ? 'is-active' : ''}`}
                  aria-expanded={openFilterKey === 'genre'}
                  aria-haspopup="listbox"
                  onClick={() => setOpenFilterKey((k) => (k === 'genre' ? null : 'genre'))}
                >
                  <Clapperboard size={18} strokeWidth={2.1} aria-hidden />
                  <span className="music-hub-filter-pill-text">
                    {t('pages.musicFilterPillGenre')}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.5}
                    className={`music-hub-filter-pill-chevron ${openFilterKey === 'genre' ? 'is-open' : ''}`}
                    aria-hidden
                  />
                </button>
                <MusicFilterDropdown
                  isOpen={openFilterKey === 'genre'}
                  options={MUSIC_FILTER_GENRE_OPTIONS}
                  selectedIds={filtGenres}
                  t={t}
                  onToggleOption={toggleGenreOption}
                  alignEnd
                  tall
                />
              </div>
            </div>

            {anyAdvancedFilter ? (
              <div className="music-hub-filter-chips" aria-label={t('pages.musicFilterChipsAria')}>
                {orderIdsByOptions(MUSIC_FILTER_MOOD_OPTIONS, filtMoods).map((id) => {
                  const lk = labelKeyForOptionId(MUSIC_FILTER_MOOD_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`m-${id}`} className="music-hub-filter-chip">
                      <Smile size={14} strokeWidth={2.1} className="music-hub-filter-chip-icon" aria-hidden />
                      <span className="music-hub-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="music-hub-filter-chip-remove"
                        aria-label={t('pages.musicFilterRemoveChip', { label })}
                        onClick={() => toggleMoodOption(id)}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
                {orderIdsByOptions(MUSIC_FILTER_GENRE_OPTIONS, filtGenres).map((id) => {
                  const lk = labelKeyForOptionId(MUSIC_FILTER_GENRE_OPTIONS, id);
                  const label = t(`pages.${lk}`);
                  return (
                    <span key={`g-${id}`} className="music-hub-filter-chip">
                      <Clapperboard
                        size={14}
                        strokeWidth={2.1}
                        className="music-hub-filter-chip-icon"
                        aria-hidden
                      />
                      <span className="music-hub-filter-chip-text">{label}</span>
                      <button
                        type="button"
                        className="music-hub-filter-chip-remove"
                        aria-label={t('pages.musicFilterRemoveChip', { label })}
                        onClick={() => toggleGenreOption(id)}
                      >
                        <X size={14} strokeWidth={2.5} aria-hidden />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>

          {displayCollections.length > 0 ? (
            <section className="music-hub-section" aria-labelledby="music-moods-heading">
              <h3 id="music-moods-heading" className="music-hub-section-title">
                {t('pages.musicMoodPlaylistsTitle')}
              </h3>
              <div className="music-hub-moods">
                {displayCollections.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`music-hub-mood-card${activePlaylistId === item.id ? ' is-active' : ''}`}
                    onClick={() => openPlaylist(item)}
                  >
                    <span
                      className="music-hub-mood-media"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    <span className="music-hub-mood-overlay" />
                    <span className="music-hub-mood-body">
                      <Sparkles size={14} strokeWidth={2} className="music-hub-mood-ico" aria-hidden />
                      <span className="music-hub-mood-label">{collectionLabel(item)}</span>
                      <span className="music-hub-mood-count">
                        {item.tracksCount} {t('pages.musicTracksUnit')}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {personalizedTracks.length > 0 ? (
            <section className="music-hub-section" aria-labelledby="music-personal-heading">
              <h3 id="music-personal-heading" className="music-hub-section-title">
                {t('pages.musicPersonalizedTitle')}
              </h3>
              <ul className="music-hub-rec-list">
                {personalizedTracks.map((item) => (
                  <li key={`personal-${item.id}`} className="music-hub-rec-row">
                    <button
                      type="button"
                      className="music-hub-rec-cover"
                      onClick={() => playTrack(item.id, { clearPlaylist: true })}
                      aria-label={t('pages.musicPlay')}
                    >
                      <span
                        className="music-hub-rec-thumb"
                        style={{ backgroundImage: `url(${item.poster})` }}
                        aria-hidden
                      />
                      <span className="music-hub-rec-cover-play" aria-hidden>
                        <Play size={20} fill="currentColor" strokeWidth={0} />
                      </span>
                    </button>
                    <div className="music-hub-rec-meta">
                      <strong className="music-hub-rec-title">{titleFor(item)}</strong>
                      <span className="music-hub-rec-sub">
                        {artistFor(item)} · {genreFor(item)}
                      </span>
                    </div>
                    <span className="music-hub-rec-dur">{item.durationShort}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="music-hub-section" aria-labelledby="music-rec-heading">
            <h3 id="music-rec-heading" className="music-hub-section-title">
              {t('pages.musicRecommendedTitle')}
            </h3>
            <ul className="music-hub-rec-list">
              {visibleRecommended.map((item) => (
                <li key={item.id} className="music-hub-rec-row">
                  <button
                    type="button"
                    className="music-hub-rec-cover"
                    onClick={() => playTrack(item.id, { clearPlaylist: true })}
                    aria-label={t('pages.musicPlay')}
                  >
                    <span
                      className="music-hub-rec-thumb"
                      style={{ backgroundImage: `url(${item.poster})` }}
                      aria-hidden
                    />
                    <span className="music-hub-rec-cover-play" aria-hidden>
                      <Play size={20} fill="currentColor" strokeWidth={0} />
                    </span>
                  </button>
                  <div className="music-hub-rec-meta">
                    <strong className="music-hub-rec-title">{titleFor(item)}</strong>
                    <span className="music-hub-rec-sub">
                      {artistFor(item)} · {genreFor(item)}
                    </span>
                  </div>
                  <span className="music-hub-rec-dur">{item.durationShort}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="music-hub-side">
          <div className={`music-hub-player${active ? ' music-hub-player--active' : ''}`}>
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
                        t={t}
                      />
                    </div>
                  ) : (
                    <p className="music-hub-player-empty-hint">{t('pages.musicPlayerEmpty')}</p>
                  )}
                </div>

                {activePlaylist && playlistOtherTracks.length > 0 ? (
                  <div className="music-hub-player-queue">
                    <p className="music-hub-player-queue-title">{collectionLabel(activePlaylist)}</p>
                    <ul className="music-hub-player-queue-list" aria-label={t('pages.musicPlaylistQueueAria')}>
                      {playlistOtherTracks.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="music-hub-queue-row"
                            onClick={() => playTrack(item.id)}
                          >
                            <span
                              className="music-hub-queue-thumb"
                              style={{ backgroundImage: `url(${item.poster})` }}
                              aria-hidden
                            />
                            <span className="music-hub-queue-meta">
                              <strong>{titleFor(item)}</strong>
                              <span>
                                {artistFor(item)} · {genreFor(item)}
                              </span>
                            </span>
                            <span className="music-hub-queue-dur">{item.durationShort}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="music-hub-player-empty">{t('pages.musicPlayerEmpty')}</div>
            )}
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
}

export default MusicPracticeHub;
