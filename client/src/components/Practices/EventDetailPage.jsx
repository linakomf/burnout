import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Music2,
  Share2,
  Sparkles,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { spaceSectionHref } from './practiceSpaceConfig';
import {
  FAVORITES_KEYS,
  loadSectionFavorites,
  saveSectionFavorites,
  toggleInFavoriteSet,
} from './sectionFavorites';
import {
  EVENT_DETAILS,
  eventCardCategory,
  eventCardTitle,
  eventDateLine,
  eventIsGroup,
  eventPriceDisplayLabel,
  isEventPriceFree,
  findEventById,
  isRemoteEventId,
  mapRemoteEventPayload,
  resolveEventDetailView,
} from './eventsHubData';
import './EventDetailPage.css';

function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [favorites, setFavorites] = useState(() => loadSectionFavorites(FAVORITES_KEYS.events));

  const staticEvent = useMemo(() => findEventById(eventId), [eventId]);
  const fetchRemote = Boolean(eventId && !staticEvent && isRemoteEventId(eventId));
  const [remoteEvent, setRemoteEvent] = useState(null);
  const [remoteLoading, setRemoteLoading] = useState(fetchRemote);

  useEffect(() => {
    if (!fetchRemote) {
      setRemoteEvent(null);
      setRemoteLoading(false);
      return undefined;
    }
    let cancelled = false;
    setRemoteLoading(true);
    setRemoteEvent(null);
    api
      .get(`/events/${eventId}`)
      .then((res) => {
        if (!cancelled) setRemoteEvent(mapRemoteEventPayload(res.data, backendPublicUrl));
      })
      .catch(() => {
        if (!cancelled) setRemoteEvent(null);
      })
      .finally(() => {
        if (!cancelled) setRemoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, fetchRemote]);

  const event = staticEvent || remoteEvent;
  const staticDetail = staticEvent ? EVENT_DETAILS[staticEvent.id] : null;
  const detail = useMemo(
    () => resolveEventDetailView(event, staticDetail, t),
    [event, staticDetail, t]
  );

  const dateLine = useMemo(() => (event ? eventDateLine(event, t) : ''), [event, t]);
  const isGroup = useMemo(() => eventIsGroup(event), [event]);
  const isFavorite = Boolean(event && favorites.has(event.id));

  useEffect(() => {
    saveSectionFavorites(FAVORITES_KEYS.events, favorites);
  }, [favorites]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: event ? eventCardTitle(event, t) : '',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* отмена или отказ буфера */
    }
  }, [event, t]);

  if (remoteLoading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>Загрузка…</div>;
  }

  if (!event || !detail) {
    return <Navigate to={spaceSectionHref('events')} replace />;
  }

  const heroSrc = detail.heroImage || event.image;
  const formatLine = t(isGroup ? 'pages.eventsDetailFormatGroup' : 'pages.eventsDetailFormatSolo');

  const ctaInner = (
    <>
      <span
        className={`event-detail-price ${isEventPriceFree(event.priceKey) ? 'event-detail-price--free' : ''}`}
      >
        {eventPriceDisplayLabel(event.priceKey, t)}
      </span>
      <a
        href={detail.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="event-detail-buy"
      >
        <span className="event-detail-buy-label">{t('pages.eventsDetailBuyTicket')}</span>
        <span className="event-detail-buy-ico-wrap" aria-hidden>
          <ExternalLink size={17} strokeWidth={2.2} className="event-detail-buy-ico" />
        </span>
      </a>
    </>
  );

  return (
    <div className="event-detail">
      <header className="event-detail-hero">
        <div
          className="event-detail-hero-bg"
          style={{ backgroundImage: `url(${heroSrc})` }}
          role="presentation"
        />
        <div className="event-detail-hero-wash" aria-hidden />
        <div className="event-detail-hero-toolbar">
          <button
            type="button"
            className="event-detail-back-overlay"
            onClick={() => navigate(spaceSectionHref('events'))}
            aria-label={t('pages.practicesBack')}
          >
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
            <span>{t('pages.practicesBack')}</span>
          </button>
          <div className="event-detail-hero-actions">
            <button
              type="button"
              className={`event-detail-icon-btn ${isFavorite ? 'is-on' : ''}`}
              onClick={() => setFavorites((prev) => toggleInFavoriteSet(prev, event.id))}
              aria-label={t('pages.eventsDetailFavoriteAria')}
              aria-pressed={isFavorite}
            >
              <Heart size={20} strokeWidth={2.2} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="event-detail-icon-btn"
              onClick={share}
              aria-label={t('pages.eventsDetailShareAria')}
            >
              <Share2 size={20} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      <div className="event-detail-sheet">
        <div className="event-detail-sheet-inner">
          <div className="event-detail-layout">
            <div className="event-detail-main">
              <span className="event-detail-cat">{eventCardCategory(event, t)}</span>
              <h1 className="event-detail-title">{eventCardTitle(event, t)}</h1>

              <ul className="event-detail-meta">
                <li>
                  <MapPin className="event-detail-meta-ico" aria-hidden />
                  <span>{detail.venueLine}</span>
                </li>
                <li>
                  <Calendar className="event-detail-meta-ico" aria-hidden />
                  <span>{dateLine}</span>
                </li>
                <li>
                  {isGroup ? (
                    <Users className="event-detail-meta-ico" aria-hidden />
                  ) : (
                    <User className="event-detail-meta-ico" aria-hidden />
                  )}
                  <span>{formatLine}</span>
                </li>
              </ul>

              <p className="event-detail-teaser">{detail.teaser}</p>

              <div className="event-detail-cta-row event-detail-cta-row--mobile">{ctaInner}</div>
            </div>

            <aside className="event-detail-aside">
              <div className="event-detail-aside-card">
                <div className="event-detail-cta-row event-detail-cta-row--desktop">{ctaInner}</div>
              </div>
            </aside>
          </div>

          <div className="event-detail-below">
            <div className="event-detail-grid">
              <div className="event-detail-grid-item">
                <Clock className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailDuration')}</span>
                <span className="event-detail-grid-value">{detail.durationLabel}</span>
              </div>
              <div className="event-detail-grid-item">
                <Users className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailAge')}</span>
                <span className="event-detail-grid-value">{detail.ageLabel}</span>
              </div>
              <div className="event-detail-grid-item">
                <Music2 className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailGenre')}</span>
                <span className="event-detail-grid-value">{detail.genreLabel}</span>
              </div>
              <div className="event-detail-grid-item">
                <Ticket className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailRefund')}</span>
                <span className="event-detail-grid-value">{detail.refundLabel}</span>
              </div>
            </div>

            <h2 className="event-detail-section-title">{t('pages.eventsDetailAbout')}</h2>
            <div className="event-detail-about">
              <p className="event-detail-about-text">{detail.aboutText}</p>
              {detail.venueImage ? (
                <div className="event-detail-venue-card">
                  <img src={detail.venueImage} alt="" className="event-detail-venue-img" loading="lazy" />
                  <div className="event-detail-venue-overlay">
                    <MapPin size={16} strokeWidth={2.2} aria-hidden />
                    <span>{detail.venuePinText}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {detail.suitTags.length > 0 ? (
              <>
                <h2 className="event-detail-section-title">{t('pages.eventsDetailSuits')}</h2>
                <ul className="event-detail-suits">
                  {detail.suitTags.map((label) => (
                    <li key={label} className="event-detail-suit-tag">
                      <Check size={14} strokeWidth={3} className="event-detail-suit-check" aria-hidden />
                      {label}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {detail.gallery.length > 0 ? (
              <div className="event-detail-gallery">
                {detail.gallery.map((src, idx) => (
                  <img
                    key={`${event.id}-gal-${idx}`}
                    src={src}
                    alt=""
                    className="event-detail-gallery-img"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}

            {(detail.organizerName || detail.organizerDesc) && (
              <>
                <h2 className="event-detail-section-title">{t('pages.eventsDetailOrganizer')}</h2>
                <div className="event-detail-org">
                  <div className="event-detail-org-avatar" aria-hidden>
                    <Sparkles size={22} strokeWidth={2} />
                  </div>
                  <div className="event-detail-org-text">
                    {detail.organizerName ? <strong>{detail.organizerName}</strong> : null}
                    {detail.organizerDesc ? <span>{detail.organizerDesc}</span> : null}
                  </div>
                  <Link to={spaceSectionHref('events')} className="event-detail-org-link">
                    {t('pages.eventsDetailOrganizerAll')}
                    <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
                  </Link>
                </div>
              </>
            )}

            {detail.importantNotes.length > 0 ? (
              <div className="event-detail-important">
                <h2 className="event-detail-important-title">{t('pages.eventsDetailImportant')}</h2>
                <ul className="event-detail-important-list">
                  {detail.importantNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
