import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  Search,
  SlidersHorizontal,
  Smile,
  User,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { spaceHubHref } from './practiceSpaceConfig';
import api from '../../utils/api';
import { apiGetCatalog } from '../../utils/apiCatalog';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import { mapRemoteEventPayload } from './eventsHubData';
import {
  HERO_GROUP_BG,
  HERO_SOLO_BG,
  TB_DATE,
  TB_LOC,
  TB_MOOD,
  TB_PRICE,
  TB_TIME,
  matchesToolbarFilters,
  tbPillLabel,
} from './eventsPracticeHubConfig';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';
import { EventGridCard, ToolbarDropdown } from './EventsPracticeHubParts';
import './FilmsPracticeHub.css';
import './EventsPracticeHub.css';

export default function EventsPracticeHubView({ embedded = false }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const filtersSectionRef = useRef(null);
  const [mode, setMode] = useState('solo');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [filtersToolbarVisible, setFiltersToolbarVisible] = useState(false);
  const [openToolbarKey, setOpenToolbarKey] = useState(null);
  const [tfLocation, setTfLocation] = useState(null);
  const [tfDate, setTfDate] = useState(null);
  const [tfTime, setTfTime] = useState(null);
  const [tfPrice, setTfPrice] = useState(null);
  const [tfMood, setTfMood] = useState(null);
  const [listOnlyView, setListOnlyView] = useState(false);
  const [remoteSolo, setRemoteSolo] = useState([]);
  const [remoteGroup, setRemoteGroup] = useState([]);
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.events));

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.events, favorites);
  }, [favorites]);

  useEffect(() => {
    let cancelled = false;
    apiGetCatalog('/events', { events: [] }, 'events')
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data?.events || []).map((row) => mapRemoteEventPayload(row, backendPublicUrl));
        setRemoteSolo(rows.filter((event) => event.kind === 'solo'));
        setRemoteGroup(rows.filter((event) => event.kind === 'group'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const soloCatalog = useMemo(() => remoteSolo, [remoteSolo]);
  const groupCatalog = useMemo(() => remoteGroup, [remoteGroup]);
  const allEventsFlat = useMemo(() => [...soloCatalog, ...groupCatalog], [soloCatalog, groupCatalog]);
  const baseCatalog = listOnlyView ? allEventsFlat : mode === 'solo' ? soloCatalog : groupCatalog;

  const filteredEvents = useMemo(() => {
    let list = baseCatalog;
    list = list.filter((item) => matchesToolbarFilters(item, tfLocation, tfDate, tfTime, tfPrice, tfMood));
    const query = eventSearchQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
  }, [baseCatalog, eventSearchQuery, tfDate, tfLocation, tfMood, tfPrice, tfTime]);

  useEffect(() => {
    if (!openToolbarKey) return undefined;
    const onDoc = (event) => {
      const root = filtersSectionRef.current;
      if (!root) return;
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      const inside =
        path.length > 0 ? path.includes(root) : event.target instanceof Node && root.contains(event.target);
      if (!inside) setOpenToolbarKey(null);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setOpenToolbarKey(null);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [openToolbarKey]);

  const activeToolbarChips = [
    tfLocation != null ? { id: `loc-${tfLocation}`, label: tbPillLabel(tfLocation, TB_LOC, 'eventsTbPhLocation', t), Icon: MapPin, onRemove: () => setTfLocation(null) } : null,
    tfDate != null ? { id: `date-${tfDate}`, label: tbPillLabel(tfDate, TB_DATE, 'eventsFilterDate', t), Icon: Calendar, onRemove: () => setTfDate(null) } : null,
    tfTime != null ? { id: `time-${tfTime}`, label: tbPillLabel(tfTime, TB_TIME, 'eventsFilterTime', t), Icon: Clock, onRemove: () => setTfTime(null) } : null,
    tfPrice != null ? { id: `price-${tfPrice}`, label: tbPillLabel(tfPrice, TB_PRICE, 'eventsFilterPrice', t), Icon: Banknote, onRemove: () => setTfPrice(null) } : null,
    tfMood != null ? { id: `mood-${tfMood}`, label: tbPillLabel(tfMood, TB_MOOD, 'eventsFilterMood', t), Icon: Smile, onRemove: () => setTfMood(null) } : null,
  ].filter(Boolean);

  const heroTitleKey = mode === 'solo' ? 'eventsModeSolo' : 'eventsModeGroup';
  const heroLeadKey = mode === 'solo' ? 'eventsHeroSoloModeLead' : 'eventsHeroGroupModeLead';
  const sectionTitle = listOnlyView ? t('pages.eventsAllTitle') : t(`pages.${heroTitleKey}`);

  return (
    <section className={`flix-scope flix-scope--catalog flix-scope--mindwell events-flix-page fade-in${embedded ? ' flix-scope--embedded' : ''}`}>
      <div className="flix-ambient" aria-hidden />
      <div className="flix-panel flix-panel--catalog">
        {!listOnlyView ? (
          <header className="flix-catalog-header">
            <div className="flix-catalog-mock">
              <div className="flix-catalog-hero-stage">
                {!embedded ? (
                  <button type="button" className="flix-back flix-catalog-back" onClick={() => navigate(spaceHubHref())}>
                    <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                    {t('pages.practicesBack')}
                  </button>
                ) : null}
                <div className="flix-catalog-hero-photo events-flix-hero-photo" style={{ backgroundImage: `url(${mode === 'solo' ? HERO_SOLO_BG : HERO_GROUP_BG})` }} />
              </div>
              <div className="flix-catalog-sheet">
                <div className="flix-catalog-sheet-notch" aria-hidden />
                <div className="flix-catalog-sheet-inner">
                  <div className="flix-catalog-header-v2 events-flix-header-grid">
                    <div className="flix-catalog-header-main">
                        <div className="events-flix-mode-stack" role="group" aria-label={t('pages.eventsModesAria')}>
                          <button type="button" className={`events-flix-mode-card ${mode === 'solo' ? 'is-active' : ''}`} onClick={() => { setMode('solo'); setListOnlyView(false); }}>
                            <span className="events-flix-mode-icon" aria-hidden><User size={20} strokeWidth={2.1} /></span>
                            <span className="events-flix-mode-text"><strong>{t('pages.eventsModeSolo')}</strong><span>{t('pages.eventsModeSoloDesc')}</span></span>
                          </button>
                          <button type="button" className={`events-flix-mode-card ${mode === 'group' ? 'is-active' : ''}`} onClick={() => { setMode('group'); setListOnlyView(false); }}>
                            <span className="events-flix-mode-icon" aria-hidden><Users size={20} strokeWidth={2.1} /></span>
                            <span className="events-flix-mode-text"><strong>{t('pages.eventsModeGroup')}</strong><span>{t('pages.eventsModeGroupDesc')}</span></span>
                          </button>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        ) : (
          <div className="events-flix-catalog-top">
            {!embedded ? (
              <button type="button" className="events-flix-inline-btn events-flix-inline-btn--ghost" onClick={() => setListOnlyView(false)}>
                <ArrowLeft size={18} strokeWidth={2} aria-hidden />
                {t('pages.practicesBack')}
              </button>
            ) : null}
            <h1 className="events-flix-catalog-title">{t('pages.eventsAllTitle')}</h1>
          </div>
        )}

        <div ref={filtersSectionRef} className="flix-catalog-filters-stack events-flix-filters-shell">
          <div className="flix-catalog-search-row events-flix-search-row">
            <div className="flix-catalog-search" role="search">
              <Search size={17} strokeWidth={2} aria-hidden />
              <input type="search" placeholder={t('pages.eventsSearchPlaceholder')} value={eventSearchQuery} onChange={(e) => setEventSearchQuery(e.target.value)} autoComplete="off" aria-label={t('pages.eventsSearchAria')} />
            </div>
            <button type="button" className={`flix-catalog-filter-btn${filtersToolbarVisible ? ' is-open' : ''}`} aria-label={t('pages.eventsToolbarAria')} aria-expanded={filtersToolbarVisible} onClick={() => { if (filtersToolbarVisible) setOpenToolbarKey(null); setFiltersToolbarVisible((prev) => !prev); }}>
              <SlidersHorizontal size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>

          {filtersToolbarVisible ? (
            <div className="flix-film-filter-toolbar" role="toolbar" aria-label={t('pages.eventsToolbarAria')}>
              {[
                { key: 'loc', value: tfLocation, setter: setTfLocation, options: TB_LOC, label: tbPillLabel(tfLocation, TB_LOC, 'eventsTbPhLocation', t), Icon: MapPin },
                { key: 'date', value: tfDate, setter: setTfDate, options: TB_DATE, label: tbPillLabel(tfDate, TB_DATE, 'eventsFilterDate', t), Icon: Calendar },
                { key: 'time', value: tfTime, setter: setTfTime, options: TB_TIME, label: tbPillLabel(tfTime, TB_TIME, 'eventsFilterTime', t), Icon: Clock },
                { key: 'price', value: tfPrice, setter: setTfPrice, options: TB_PRICE, label: tbPillLabel(tfPrice, TB_PRICE, 'eventsFilterPrice', t), Icon: Banknote },
                { key: 'mood', value: tfMood, setter: setTfMood, options: TB_MOOD, label: tbPillLabel(tfMood, TB_MOOD, 'eventsFilterMood', t), Icon: Smile, alignEnd: true, tall: true },
              ].map(({ key, value, setter, options, label, Icon, alignEnd, tall }) => (
                <div key={key} className="flix-film-filter-pill-wrap">
                  <button type="button" className={`flix-film-filter-pill ${value != null ? 'is-active' : ''}`} aria-expanded={openToolbarKey === key} aria-haspopup="listbox" onClick={() => setOpenToolbarKey((prev) => (prev === key ? null : key))}>
                    <Icon size={18} strokeWidth={2.1} aria-hidden />
                    <span className="flix-film-filter-pill-text">{label}</span>
                    <ChevronDown size={16} strokeWidth={2.5} className={`flix-film-filter-pill-chevron ${openToolbarKey === key ? 'is-open' : ''}`} aria-hidden />
                  </button>
                  <ToolbarDropdown isOpen={openToolbarKey === key} options={options} value={value} t={t} onPick={(id) => { setter(id); setOpenToolbarKey(null); }} alignEnd={alignEnd} tall={tall} />
                </div>
              ))}
            </div>
          ) : null}

          {activeToolbarChips.length > 0 ? (
            <div className="flix-film-filter-chips" role="group" aria-label={t('pages.eventsFiltersAria')}>
              {activeToolbarChips.map(({ id, label, Icon, onRemove }) => (
                <span key={id} className="flix-film-filter-chip">
                  <Icon className="flix-film-filter-chip-icon" size={15} strokeWidth={2.1} aria-hidden />
                  <span className="flix-film-filter-chip-text">{label}</span>
                  <button type="button" className="flix-film-filter-chip-remove" onClick={onRemove} aria-label={label}>
                    <X size={14} strokeWidth={2.5} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          ) : null}

        </div>

        <section className="flix-catalog-section events-flix-results hub-cover-cards">
          <div className="flix-catalog-section-head">
            <div className="flix-catalog-section-intro">
              <h2 className="flix-section-heading--primary">{sectionTitle}</h2>
              <p className="flix-section-desc">{t(`pages.${heroLeadKey}`)}</p>
            </div>
          </div>
          {filteredEvents.length === 0 ? (
            <p className="flix-catalog-empty">{t('pages.eventsNoMatches')}</p>
          ) : (
            <div className="events-flix-grid">
              {filteredEvents.map((item) => (
                <EventGridCard
                  key={item.id}
                  item={item}
                  t={t}
                  isFavorite={favorites.has(item.id)}
                  onToggleFavorite={() => setFavorites((prev) => toggleInFavoriteSet(prev, item.id))}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
