import React, { useCallback, useMemo, useState } from 'react';
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
import { EVENT_DETAILS, findEventById } from './eventsHubData';
import './EventDetailPage.css';

function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [fav, setFav] = useState(false);

  const event = useMemo(() => findEventById(eventId), [eventId]);
  const detail = event ? EVENT_DETAILS[event.id] : null;

  const dateLine = useMemo(() => {
    if (!event) return '';
    const clockTag = event.tags.find((tag) => tag.kind === 'clock');
    return clockTag ? t(`pages.${clockTag.key}`) : '';
  }, [event, t]);

  const isGroup = useMemo(
    () => Boolean(event?.tags.some((tag) => tag.key === 'eventsEvTagInCompany')),
    [event],
  );

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: event ? t(`pages.${event.titleKey}`) : '',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* отмена или отказ буфера */
    }
  }, [event, t]);

  if (!event || !detail) {
    return <Navigate to="/practices/events" replace />;
  }

  const heroSrc = detail.heroImage || event.image;
  const formatLine = t(isGroup ? 'pages.eventsDetailFormatGroup' : 'pages.eventsDetailFormatSolo');

  const ctaInner = (
    <>
      <span
        className={`event-detail-price ${
          event.priceKey === 'eventsEvPriceFree' ? 'event-detail-price--free' : ''
        }`}
      >
        {t(`pages.${event.priceKey}`)}
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
      <button
        type="button"
        className="event-detail-back-text"
        onClick={() => navigate('/practices/events')}
      >
        <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
        {t('pages.eventsDetailBackToList')}
      </button>

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
            className="event-detail-icon-btn event-detail-icon-btn--ghost-mobile"
            onClick={() => navigate('/practices/events')}
            aria-label={t('pages.eventsDetailBackAria')}
          >
            <ArrowLeft size={20} strokeWidth={2.2} />
          </button>
          <div className="event-detail-hero-actions">
            <button
              type="button"
              className="event-detail-icon-btn"
              onClick={() => setFav((v) => !v)}
              aria-label={t('pages.eventsDetailFavoriteAria')}
              aria-pressed={fav}
            >
              <Heart size={20} strokeWidth={2.2} fill={fav ? 'currentColor' : 'none'} />
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
              <span className="event-detail-cat">{t(`pages.${event.categoryKey}`)}</span>
              <h1 className="event-detail-title">{t(`pages.${event.titleKey}`)}</h1>

              <ul className="event-detail-meta">
                <li>
                  <MapPin className="event-detail-meta-ico" aria-hidden />
                  <span>{t(`pages.${detail.venueLineKey}`)}</span>
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

              <p className="event-detail-teaser">{t(`pages.${detail.teaserKey}`)}</p>

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
                <span className="event-detail-grid-value">{t(`pages.${detail.durationKey}`)}</span>
              </div>
              <div className="event-detail-grid-item">
                <Users className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailAge')}</span>
                <span className="event-detail-grid-value">{t(`pages.${detail.ageKey}`)}</span>
              </div>
              <div className="event-detail-grid-item">
                <Music2 className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailGenre')}</span>
                <span className="event-detail-grid-value">{t(`pages.${detail.genreKey}`)}</span>
              </div>
              <div className="event-detail-grid-item">
                <Ticket className="event-detail-grid-ico" aria-hidden />
                <span className="event-detail-grid-label">{t('pages.eventsDetailRefund')}</span>
                <span className="event-detail-grid-value">{t(`pages.${detail.refundKey}`)}</span>
              </div>
            </div>

            <h2 className="event-detail-section-title">{t('pages.eventsDetailAbout')}</h2>
            <div className="event-detail-about">
              <p className="event-detail-about-text">{t(`pages.${detail.aboutKey}`)}</p>
              <div className="event-detail-venue-card">
                <img src={detail.venueImage} alt="" className="event-detail-venue-img" loading="lazy" />
                <div className="event-detail-venue-overlay">
                  <MapPin size={16} strokeWidth={2.2} aria-hidden />
                  <span>{t(`pages.${detail.venuePinKey}`)}</span>
                </div>
              </div>
            </div>

            <h2 className="event-detail-section-title">{t('pages.eventsDetailSuits')}</h2>
            <ul className="event-detail-suits">
              {detail.suitTagKeys.map((k) => (
                <li key={k} className="event-detail-suit-tag">
                  <Check size={14} strokeWidth={3} className="event-detail-suit-check" aria-hidden />
                  {t(`pages.${k}`)}
                </li>
              ))}
            </ul>

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

            <h2 className="event-detail-section-title">{t('pages.eventsDetailOrganizer')}</h2>
            <div className="event-detail-org">
              <div className="event-detail-org-avatar" aria-hidden>
                <Sparkles size={22} strokeWidth={2} />
              </div>
              <div className="event-detail-org-text">
                <strong>{t(`pages.${detail.organizerNameKey}`)}</strong>
                <span>{t(`pages.${detail.organizerDescKey}`)}</span>
              </div>
              <Link to="/practices/events" className="event-detail-org-link">
                {t('pages.eventsDetailOrganizerAll')}
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>

            <div className="event-detail-important">
              <h2 className="event-detail-important-title">{t('pages.eventsDetailImportant')}</h2>
              <ul className="event-detail-important-list">
                {detail.importantKeys.map((k) => (
                  <li key={k}>{t(`pages.${k}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetailPage;
