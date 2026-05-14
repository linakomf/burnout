import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Clock,
  Drama,
  ExternalLink,
  Globe,
  Grid3x3,
  Image as ImageIcon,
  Info,
  MapPin,
  MoreHorizontal,
  Mountain,
  Music2,
  Palette,
  Search,
  Send,
  Smile,
  User,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { EVENTS_GROUP_ROW, EVENTS_SOLO_ROW } from './eventsHubData';
import { natureAt, SPACE_NATURE_HERO_REF } from './spaceNatureImagery';
import './EventsPracticeHub.css';

const HOW_STEPS = [
  { Icon: Users, titleKey: 'eventsHowStep1Title', descKey: 'eventsHowStep1Desc' },
  { Icon: Search, titleKey: 'eventsHowStep2Title', descKey: 'eventsHowStep2Desc' },
  { Icon: Info, titleKey: 'eventsHowStep3Title', descKey: 'eventsHowStep3Desc' },
  { Icon: ExternalLink, titleKey: 'eventsHowStep4Title', descKey: 'eventsHowStep4Desc' },
];

const BOTTOM_HERO_BG = natureAt(60);
const NEWSLETTER_BG = natureAt(61);

const PRICE_LOW = new Set(['eventsEvPriceFrom1000', 'eventsEvPriceFrom1500']);
const PRICE_MID = new Set(['eventsEvPriceFrom2000', 'eventsEvPriceFrom3000']);
const PRICE_HIGH = new Set(['eventsEvPriceFrom4000', 'eventsEvPriceFrom5000']);

function priceTier(priceKey) {
  if (priceKey === 'eventsEvPriceFree') return 'free';
  if (PRICE_LOW.has(priceKey)) return 'low';
  if (PRICE_MID.has(priceKey)) return 'mid';
  if (PRICE_HIGH.has(priceKey)) return 'high';
  return 'high';
}

function matchesToolbarFilters(item, tfLoc, tfDate, tfTime, tfPrice, tfMood) {
  if (tfLoc && item.tf.loc !== tfLoc) return false;
  if (tfDate && item.tf.date !== tfDate) return false;
  if (tfTime && item.tf.time !== tfTime) return false;
  if (tfPrice && priceTier(item.priceKey) !== tfPrice) return false;
  if (tfMood && item.tf.mood !== tfMood) return false;
  return true;
}

function tbPillLabel(selectedId, options, placeholderKey, t) {
  if (selectedId == null) return t(`pages.${placeholderKey}`);
  const opt = options.find((o) => o.id === selectedId);
  return opt ? t(`pages.${opt.labelKey}`) : t(`pages.${placeholderKey}`);
}

const TB_LOC = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'almaty', labelKey: 'eventsEvTagAlmaty' },
];
const TB_DATE = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'today', labelKey: 'eventsTbOptDateToday' },
  { id: 'weekend', labelKey: 'eventsTbOptDateWeekend' },
  { id: 'this_month', labelKey: 'eventsTbOptDateMonth' },
];
const TB_TIME = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'morning', labelKey: 'eventsTbOptTimeMorning' },
  { id: 'afternoon', labelKey: 'eventsTbOptTimeAfternoon' },
  { id: 'evening', labelKey: 'eventsTbOptTimeEvening' },
];
const TB_PRICE = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'free', labelKey: 'eventsTbOptPriceFree' },
  { id: 'low', labelKey: 'eventsTbOptPriceLow' },
  { id: 'mid', labelKey: 'eventsTbOptPriceMid' },
  { id: 'high', labelKey: 'eventsTbOptPriceHigh' },
];
const TB_MOOD = [
  { id: null, labelKey: 'eventsTbOptAll' },
  { id: 'calm', labelKey: 'eventsTbOptMoodCalm' },
  { id: 'energy', labelKey: 'eventsTbOptMoodEnergy' },
  { id: 'social', labelKey: 'eventsTbOptMoodSocial' },
  { id: 'creative', labelKey: 'eventsTbOptMoodCreative' },
  { id: 'active', labelKey: 'eventsTbOptMoodActive' },
  { id: 'curious', labelKey: 'eventsTbOptMoodCurious' },
];

function ToolbarDropdown({ isOpen, options, value, t, onPick, alignEnd }) {
  if (!isOpen) return null;
  return (
    <ul
      className={`events-toolbar-menu ${alignEnd ? 'events-toolbar-menu--align-end' : ''}`}
      role="listbox"
    >
      {options.map((opt) => (
        <li key={opt.id === null ? '_all' : opt.id} className="events-toolbar-menu-item">
          <button
            type="button"
            className={`events-toolbar-menu-btn ${value === opt.id ? 'is-selected' : ''}`}
            role="option"
            aria-selected={value === opt.id}
            onClick={() => onPick(opt.id)}
          >
            {t(`pages.${opt.labelKey}`)}
          </button>
        </li>
      ))}
    </ul>
  );
}

function EventTagIcon({ kind }) {
  const p = { size: 14, strokeWidth: 2, className: 'events-event-tag-ico', 'aria-hidden': true };
  switch (kind) {
    case 'globe':
      return <Globe {...p} />;
    case 'building':
      return <Building2 {...p} />;
    case 'map':
      return <MapPin {...p} />;
    case 'clock':
      return <Clock {...p} />;
    case 'users':
      return <Users {...p} />;
    default:
      return null;
  }
}

function EventFeedCard({ item, t }) {
  const isFree = item.priceKey === 'eventsEvPriceFree';
  return (
    <article className="events-event-card">
      <div className="events-event-card-body">
        <p className="events-event-cat">{t(`pages.${item.categoryKey}`)}</p>
        <h3 className="events-event-title">{t(`pages.${item.titleKey}`)}</h3>
        <ul className="events-event-tags">
          {item.tags.map((tag) => (
            <li key={`${item.id}-${tag.key}`} className="events-event-tag">
              <EventTagIcon kind={tag.kind} />
              <span>{t(`pages.${tag.key}`)}</span>
            </li>
          ))}
        </ul>
        <div className="events-event-actions">
          <span className={`events-event-price ${isFree ? 'events-event-price--free' : ''}`}>
            {t(`pages.${item.priceKey}`)}
          </span>
          <Link to={`/practices/events/${item.id}`} className="events-event-details">
            {t('pages.eventsDetails')}
          </Link>
        </div>
      </div>
      <img src={item.image} alt="" className="events-event-thumb" loading="lazy" />
    </article>
  );
}

function EventsFeedSection({ sectionId, titleKey, items, t, showSeeAll, onSeeAll }) {
  return (
    <section
      className="events-feed"
      aria-labelledby={titleKey ? sectionId : undefined}
      aria-label={titleKey ? undefined : t('pages.eventsFeedListAria')}
    >
      <div
        className={`events-feed-head ${titleKey ? '' : showSeeAll ? '' : 'events-feed-head--minimal'}`}
      >
        {titleKey ? (
          <h2 id={sectionId} className="events-feed-title">
            {t(`pages.${titleKey}`)}
          </h2>
        ) : (
          <span className="events-feed-head-spacer" aria-hidden />
        )}
        {showSeeAll ? (
          <button type="button" className="events-feed-see-all" onClick={onSeeAll}>
            {t('pages.eventsSeeAll')}
            <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="events-feed-scroll">
        {items.length === 0 ? (
          <p className="events-feed-empty">{t('pages.eventsNoMatches')}</p>
        ) : (
          <div className="events-feed-row">
            {items.map((item) => (
              <EventFeedCard key={item.id} item={item} t={t} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

const HERO_SOLO_BG = SPACE_NATURE_HERO_REF;
const HERO_GROUP_BG = natureAt(62);

function EventsPracticeHub() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const filtersSectionRef = useRef(null);
  const [mode, setMode] = useState('solo');
  const [filterCategory, setFilterCategory] = useState('all');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [newsEmail, setNewsEmail] = useState('');
  const [openToolbarKey, setOpenToolbarKey] = useState(null);
  const [tfLocation, setTfLocation] = useState(null);
  const [tfDate, setTfDate] = useState(null);
  const [tfTime, setTfTime] = useState(null);
  const [tfPrice, setTfPrice] = useState(null);
  const [tfMood, setTfMood] = useState(null);
  /** Полный каталог: все карточки, без лендинга */
  const [listOnlyView, setListOnlyView] = useState(false);
  /** После «Смотреть все» в обычном режиме - показать все карточки в ленте */
  const [showAllEvents, setShowAllEvents] = useState(false);

  const categories = useMemo(
    () => [
      { id: 'concerts', labelKey: 'eventsCatConcerts', Icon: Music2 },
      { id: 'cinema', labelKey: 'eventsCatCinema', Icon: Clapperboard },
      { id: 'exhibitions', labelKey: 'eventsCatExhibitions', Icon: ImageIcon },
      { id: 'theater', labelKey: 'eventsCatTheater', Icon: Drama },
      { id: 'workshops', labelKey: 'eventsCatWorkshops', Icon: Palette },
      { id: 'lectures', labelKey: 'eventsCatLectures', Icon: BookOpen },
      { id: 'nature', labelKey: 'eventsCatNature', Icon: Mountain },
      { id: 'other', labelKey: 'eventsCatOther', Icon: MoreHorizontal },
    ],
    [],
  );

  const filterChipCategories = useMemo(
    () => [
      { id: 'all', labelKey: 'eventsFilterAll', Icon: Grid3x3 },
      ...categories.filter((c) => c.id !== 'nature'),
    ],
    [categories],
  );

  const allEventsFlat = useMemo(() => [...EVENTS_SOLO_ROW, ...EVENTS_GROUP_ROW], []);

  const filteredEvents = useMemo(() => {
    const base = showAllEvents
      ? [...EVENTS_SOLO_ROW, ...EVENTS_GROUP_ROW]
      : mode === 'solo'
        ? EVENTS_SOLO_ROW
        : EVENTS_GROUP_ROW;
    let list = filterCategory === 'all' ? base : base.filter((x) => x.filterCat === filterCategory);
    list = list.filter((item) => matchesToolbarFilters(item, tfLocation, tfDate, tfTime, tfPrice, tfMood));
    const q = eventSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const parts = [
          t(`pages.${item.titleKey}`),
          t(`pages.${item.categoryKey}`),
          t(`pages.${item.priceKey}`),
          ...item.tags.map((tag) => t(`pages.${tag.key}`)),
        ];
        return parts.join(' ').toLowerCase().includes(q);
      });
    }
    return list;
  }, [
    mode,
    showAllEvents,
    filterCategory,
    eventSearchQuery,
    tfLocation,
    tfDate,
    tfTime,
    tfPrice,
    tfMood,
    t,
  ]);

  const hasToolbarFilters =
    tfLocation != null ||
    tfDate != null ||
    tfTime != null ||
    tfPrice != null ||
    tfMood != null;

  const hasAnyListFilter =
    hasToolbarFilters || filterCategory !== 'all' || eventSearchQuery.trim() !== '';

  const clearToolbarFilters = useCallback(() => {
    setTfLocation(null);
    setTfDate(null);
    setTfTime(null);
    setTfPrice(null);
    setTfMood(null);
    setOpenToolbarKey(null);
  }, []);

  const enterFullListView = useCallback(() => {
    setListOnlyView(true);
    setFilterCategory('all');
    setEventSearchQuery('');
    setShowAllEvents(true);
    clearToolbarFilters();
    window.scrollTo(0, 0);
  }, [clearToolbarFilters]);

  const exitFullListView = useCallback(() => {
    setListOnlyView(false);
    setShowAllEvents(false);
    setFilterCategory('all');
    setEventSearchQuery('');
    clearToolbarFilters();
    window.scrollTo(0, 0);
  }, [clearToolbarFilters]);

  useEffect(() => {
    if (!openToolbarKey) return;
    const onDoc = (e) => {
      if (filtersSectionRef.current && !filtersSectionRef.current.contains(e.target)) {
        setOpenToolbarKey(null);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [openToolbarKey]);

  useEffect(() => {
    if (!openToolbarKey) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenToolbarKey(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openToolbarKey]);

  const selectMode = (m) => {
    setMode(m);
    setListOnlyView(false);
    setShowAllEvents(false);
    setFilterCategory('all');
    setEventSearchQuery('');
    setTfLocation(null);
    setTfDate(null);
    setTfTime(null);
    setTfPrice(null);
    setTfMood(null);
    setOpenToolbarKey(null);
  };

  const heroBg = mode === 'solo' ? HERO_SOLO_BG : HERO_GROUP_BG;
  const heroTitleKey = mode === 'solo' ? 'eventsModeSolo' : 'eventsModeGroup';
  const heroLeadKey = mode === 'solo' ? 'eventsHeroSoloModeLead' : 'eventsHeroGroupModeLead';

  const locPillText = tbPillLabel(tfLocation, TB_LOC, 'eventsTbPhLocation', t);
  const datePillText = tbPillLabel(tfDate, TB_DATE, 'eventsFilterDate', t);
  const timePillText = tbPillLabel(tfTime, TB_TIME, 'eventsFilterTime', t);
  const pricePillText = tbPillLabel(tfPrice, TB_PRICE, 'eventsFilterPrice', t);
  const moodPillText = tbPillLabel(tfMood, TB_MOOD, 'eventsFilterMood', t);

  const pickToolbar = (setter) => (id) => {
    setter(id);
    setOpenToolbarKey(null);
  };

  const feedItems = listOnlyView ? allEventsFlat : filteredEvents;

  return (
    <div className={`events-hub fade-in${listOnlyView ? ' events-hub--catalog' : ''}`}>
      <div className="events-hub-topbar">
        <button type="button" className="events-hub-back" onClick={() => navigate('/practices')}>
          <ArrowLeft size={18} strokeWidth={2} aria-hidden />
          {t('pages.practicesBackToHub')}
        </button>
        {listOnlyView ? (
          <button type="button" className="events-hub-back events-hub-back--ghost" onClick={exitFullListView}>
            {t('pages.eventsBackToLanding')}
          </button>
        ) : null}
      </div>

      {!listOnlyView ? (
        <>
      <section className="events-hero" aria-labelledby="events-hero-title">
        <div
          className="events-hero-bg"
          style={{ backgroundImage: `url(${heroBg})` }}
          aria-hidden
        />
        <div className="events-hero-wash" aria-hidden />
        <div className="events-hero-flowers" aria-hidden>
          <span className="events-flower events-flower--1" />
          <span className="events-flower events-flower--2" />
        </div>
        <div className="events-hero-inner">
          <div className="events-hero-copy">
            <h1 id="events-hero-title" className="events-hero-title">
              {t(`pages.${heroTitleKey}`)}
            </h1>
            <p className="events-hero-lead">{t(`pages.${heroLeadKey}`)}</p>
          </div>
          <div className="events-hero-modes" role="group" aria-label={t('pages.eventsModesAria')}>
            <button
              type="button"
              className={`events-mode-card ${mode === 'solo' ? 'is-active' : ''}`}
              onClick={() => selectMode('solo')}
            >
              <span className="events-mode-icon">
                <User size={22} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="events-mode-text">
                <strong>{t('pages.eventsModeSolo')}</strong>
                <span>{t('pages.eventsModeSoloDesc')}</span>
              </span>
            </button>
            <button
              type="button"
              className={`events-mode-card ${mode === 'group' ? 'is-active' : ''}`}
              onClick={() => selectMode('group')}
            >
              <span className="events-mode-icon">
                <Users size={22} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="events-mode-text">
                <strong>{t('pages.eventsModeGroup')}</strong>
                <span>{t('pages.eventsModeGroupDesc')}</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <section ref={filtersSectionRef} className="events-filter-stack" aria-label={t('pages.eventsFiltersAria')}>
        <div className="events-search-row">
          <div className="events-search events-search--bar" role="search">
            <Search className="events-search-icon events-search-icon--lead" size={20} strokeWidth={2.2} aria-hidden />
            <input
              type="search"
              className="events-search-input events-search-input--bar"
              value={eventSearchQuery}
              onChange={(e) => setEventSearchQuery(e.target.value)}
              placeholder={t('pages.eventsSearchPlaceholder')}
              autoComplete="off"
              enterKeyHint="search"
              aria-label={t('pages.eventsSearchAria')}
            />
          </div>
        </div>
        <div className="events-filter-chips-row">
          <div className="events-categories-row events-subcategory-row">
            {filterChipCategories.map((cat) => {
              const Icon = cat.Icon;
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`events-category-chip ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    setFilterCategory(cat.id);
                    if (cat.id !== 'all') setShowAllEvents(false);
                  }}
                  aria-pressed={isActive}
                >
                  <span className="events-category-icon" aria-hidden>
                    <Icon size={24} strokeWidth={2} />
                  </span>
                  <span className="events-category-label">{t(`pages.${cat.labelKey}`)}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="events-toolbar" role="toolbar" aria-label={t('pages.eventsToolbarAria')}>
          <div className="events-toolbar-pill-wrap">
            <button
              type="button"
              className={`events-toolbar-pill ${tfLocation != null ? 'is-active' : ''}`}
              aria-expanded={openToolbarKey === 'loc'}
              aria-haspopup="listbox"
              onClick={() => setOpenToolbarKey(openToolbarKey === 'loc' ? null : 'loc')}
            >
              <MapPin size={18} strokeWidth={2.1} aria-hidden />
              <span className="events-toolbar-pill-text">{locPillText}</span>
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`events-toolbar-pill-chevron ${openToolbarKey === 'loc' ? 'is-open' : ''}`}
                aria-hidden
              />
            </button>
            <ToolbarDropdown
              isOpen={openToolbarKey === 'loc'}
              options={TB_LOC}
              value={tfLocation}
              t={t}
              onPick={pickToolbar(setTfLocation)}
            />
          </div>
          <div className="events-toolbar-pill-wrap">
            <button
              type="button"
              className={`events-toolbar-pill ${tfDate != null ? 'is-active' : ''}`}
              aria-expanded={openToolbarKey === 'date'}
              aria-haspopup="listbox"
              onClick={() => setOpenToolbarKey(openToolbarKey === 'date' ? null : 'date')}
            >
              <Calendar size={18} strokeWidth={2.1} aria-hidden />
              <span className="events-toolbar-pill-text">{datePillText}</span>
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`events-toolbar-pill-chevron ${openToolbarKey === 'date' ? 'is-open' : ''}`}
                aria-hidden
              />
            </button>
            <ToolbarDropdown
              isOpen={openToolbarKey === 'date'}
              options={TB_DATE}
              value={tfDate}
              t={t}
              onPick={pickToolbar(setTfDate)}
            />
          </div>
          <div className="events-toolbar-pill-wrap">
            <button
              type="button"
              className={`events-toolbar-pill ${tfTime != null ? 'is-active' : ''}`}
              aria-expanded={openToolbarKey === 'time'}
              aria-haspopup="listbox"
              onClick={() => setOpenToolbarKey(openToolbarKey === 'time' ? null : 'time')}
            >
              <Clock size={18} strokeWidth={2.1} aria-hidden />
              <span className="events-toolbar-pill-text">{timePillText}</span>
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`events-toolbar-pill-chevron ${openToolbarKey === 'time' ? 'is-open' : ''}`}
                aria-hidden
              />
            </button>
            <ToolbarDropdown
              isOpen={openToolbarKey === 'time'}
              options={TB_TIME}
              value={tfTime}
              t={t}
              onPick={pickToolbar(setTfTime)}
            />
          </div>
          <div className="events-toolbar-pill-wrap">
            <button
              type="button"
              className={`events-toolbar-pill ${tfPrice != null ? 'is-active' : ''}`}
              aria-expanded={openToolbarKey === 'price'}
              aria-haspopup="listbox"
              onClick={() => setOpenToolbarKey(openToolbarKey === 'price' ? null : 'price')}
            >
              <Banknote size={18} strokeWidth={2.1} aria-hidden />
              <span className="events-toolbar-pill-text">{pricePillText}</span>
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`events-toolbar-pill-chevron ${openToolbarKey === 'price' ? 'is-open' : ''}`}
                aria-hidden
              />
            </button>
            <ToolbarDropdown
              isOpen={openToolbarKey === 'price'}
              options={TB_PRICE}
              value={tfPrice}
              t={t}
              onPick={pickToolbar(setTfPrice)}
            />
          </div>
          <div className="events-toolbar-pill-wrap">
            <button
              type="button"
              className={`events-toolbar-pill ${tfMood != null ? 'is-active' : ''}`}
              aria-expanded={openToolbarKey === 'mood'}
              aria-haspopup="listbox"
              onClick={() => setOpenToolbarKey(openToolbarKey === 'mood' ? null : 'mood')}
            >
              <Smile size={18} strokeWidth={2.1} aria-hidden />
              <span className="events-toolbar-pill-text">{moodPillText}</span>
              <ChevronDown
                size={16}
                strokeWidth={2.5}
                className={`events-toolbar-pill-chevron ${openToolbarKey === 'mood' ? 'is-open' : ''}`}
                aria-hidden
              />
            </button>
            <ToolbarDropdown
              isOpen={openToolbarKey === 'mood'}
              options={TB_MOOD}
              value={tfMood}
              t={t}
              onPick={pickToolbar(setTfMood)}
            />
          </div>
          <div className="events-toolbar-pill-wrap events-toolbar-pill-wrap--see-all">
            <button
              type="button"
              className="events-toolbar-pill events-toolbar-pill--see-all"
              onClick={enterFullListView}
            >
              <span className="events-toolbar-pill-text">{t('pages.eventsSeeAll')}</span>
              <ChevronRight size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </div>
        </div>
      </section>
        </>
      ) : null}

      {listOnlyView ? (
        <h1 className="events-catalog-title" id="events-catalog-title">
          {t('pages.eventsAllTitle')}
        </h1>
      ) : null}

      <EventsFeedSection
        sectionId="events-feed-main"
        titleKey={null}
        items={feedItems}
        t={t}
        showSeeAll={!listOnlyView && hasAnyListFilter}
        onSeeAll={enterFullListView}
      />

      {!listOnlyView ? (
        <>
      <section className="events-bottom-hero" aria-labelledby="events-bottom-hero-title">
        <div
          className="events-bottom-hero-bg"
          style={{ backgroundImage: `url(${BOTTOM_HERO_BG})` }}
          aria-hidden
        />
        <div className="events-bottom-hero-wash" aria-hidden />
        <div className="events-bottom-hero-inner">
          <h2 id="events-bottom-hero-title" className="events-bottom-hero-title">
            {t('pages.eventsCtaHeroTitle')}
          </h2>
          <p className="events-bottom-hero-lead">{t('pages.eventsCtaHeroLead')}</p>
          <button
            type="button"
            className="events-bottom-hero-cta"
            onClick={() => filtersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            {t('pages.eventsCtaHeroButton')}
          </button>
        </div>
      </section>

      <section className="events-how" aria-labelledby="events-how-title">
        <h2 id="events-how-title" className="events-how-title">
          {t('pages.eventsHowTitle')}
        </h2>
        <div className="events-how-row">
          {HOW_STEPS.map((step, index) => {
            const StepIcon = step.Icon;
            return (
              <Fragment key={step.titleKey}>
                <div className="events-how-step">
                  <div className="events-how-blob" aria-hidden>
                    <StepIcon size={26} strokeWidth={2.1} className="events-how-blob-icon" />
                  </div>
                  <strong className="events-how-step-title">{t(`pages.${step.titleKey}`)}</strong>
                  <p className="events-how-step-desc">{t(`pages.${step.descKey}`)}</p>
                </div>
                {index < HOW_STEPS.length - 1 && (
                  <ChevronRight className="events-how-between" size={22} strokeWidth={2.2} aria-hidden />
                )}
              </Fragment>
            );
          })}
        </div>
      </section>

      <section className="events-newsletter" aria-labelledby="events-news-title">
        <div
          className="events-newsletter-bg"
          style={{ backgroundImage: `url(${NEWSLETTER_BG})` }}
          aria-hidden
        />
        <div className="events-newsletter-wash" aria-hidden />
        <div className="events-newsletter-inner">
          <h2 id="events-news-title" className="events-newsletter-title">
            {t('pages.eventsNewsTitle')}
          </h2>
          <p className="events-newsletter-lead">{t('pages.eventsNewsLead')}</p>
          <form
            className="events-newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="email"
              className="events-newsletter-input"
              placeholder={t('pages.eventsNewsPlaceholder')}
              value={newsEmail}
              onChange={(e) => setNewsEmail(e.target.value)}
              autoComplete="email"
            />
            <button type="submit" className="events-newsletter-submit" aria-label={t('pages.eventsNewsSubmitAria')}>
              <Send size={18} strokeWidth={2.2} aria-hidden />
            </button>
          </form>
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}

export default EventsPracticeHub;
