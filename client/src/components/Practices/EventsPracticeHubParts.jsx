import React from 'react';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { eventCardCategory, eventCardTitle, eventTagLabel } from './eventsHubData';
import PracticeCoverFavorite from './PracticeCoverFavorite';

export function ToolbarDropdown({ isOpen, options, value, t, onPick, alignEnd, tall }) {
  if (!isOpen) return null;
  return (
    <ul
      className={`flix-film-filter-menu${alignEnd ? ' flix-film-filter-menu--end' : ''}${tall ? ' flix-film-filter-menu--tall' : ''}`}
      role="listbox"
    >
      {options.map((opt) => (
        <li key={opt.id === null ? '_all' : opt.id} className="flix-film-filter-menu-item">
          <button
            type="button"
            className={`flix-film-filter-menu-btn ${value === opt.id ? 'is-selected' : ''}`}
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

export function EventGridCard({ item, t, isFavorite = false, onToggleFavorite = () => {} }) {
  const kindKey = item.kind === 'group' ? 'eventsModeGroup' : 'eventsModeSolo';
  const categoryLabel = eventCardCategory(item, t);
  const priceLabel = t(`pages.${item.priceKey}`);
  const clockTag = item.tags.find((tag) => tag.kind === 'clock') || null;
  const summary = item.tags
    .filter((tag) => tag.kind !== 'clock')
    .slice(0, 2)
    .map((tag) => eventTagLabel(tag, t))
    .filter(Boolean)
    .join(' • ');

  return (
    <Link to={`/practices/events/${item.id}`} className="practice-card events-flix-card">
      <div className="practice-card-inner practice-card-inner--with-cover">
        <div className="practice-card-cover">
          <div className="practice-card-cover-media">
            <img src={item.image} alt="" className="practice-card-cover-img events-flix-card__poster" loading="lazy" />
            <div className="practice-card-cover-actions">
              <PracticeCoverFavorite
                isFavorite={isFavorite}
                onToggle={onToggleFavorite}
                ariaLabel={t('pages.eventsDetailFavoriteAria')}
                className="events-flix-card__fav"
              />
              <span className="practice-card-topic events-flix-card__topic">{categoryLabel}</span>
            </div>
          </div>
        </div>

        <div className="practice-card-body events-flix-card__body">
          <h3 className="practice-card-title events-flix-card__title">{eventCardTitle(item, t)}</h3>
          <p className="practice-card-desc events-flix-card__desc">
            {summary || t(`pages.${kindKey}`)}
          </p>
          {clockTag ? (
            <p className="events-flix-card__time">
              <Clock size={14} strokeWidth={2} aria-hidden />
              {eventTagLabel(clockTag, t)}
            </p>
          ) : null}
          <div className="practice-card-footer events-flix-card__footer">
            <span className="practice-card-meta events-flix-card__meta events-flix-card__meta--price">
              {priceLabel}
            </span>
            <span className="practice-card-cta practice-card-cta--pill events-flix-card__cta">
              {t('pages.eventsDetails')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
