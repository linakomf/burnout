import React from 'react';
import { Clock, Heart, Play } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { natureAt } from './spaceNatureImagery';

export const MEDITATION_TOPIC_LABEL_KEYS = {
  anxiety: 'meditationFilterAnxiety',
  sleep: 'meditationFilterSleep',
  recovery: 'meditationFilterRecovery',
  focus: 'meditationFilterFocus',
  sounds: 'meditationFilterSounds',
};

export function resolveMeditationTopic(practice, activeFilter) {
  const topics = practice.meditationTopics || [];
  if (activeFilter && activeFilter !== 'all' && activeFilter !== 'favorites' && topics.includes(activeFilter)) {
    return activeFilter;
  }
  return topics[0];
}

function PracticeCard({
  practice,
  isFavorite,
  onToggleFavorite,
  onPlay,
  index,
  variant = 'default',
  activeFilter = 'all',
}) {
  const { t } = useLanguage();
  const showCover = variant === 'meditation';
  const practiceTitle = practice.titleKey ? t(`pages.${practice.titleKey}`) : practice.title;
  const coverSrc = practice.coverImage || natureAt(index + 2);
  const topicId = showCover ? resolveMeditationTopic(practice, activeFilter) : null;
  const topicLabelKey = topicId ? MEDITATION_TOPIC_LABEL_KEYS[topicId] : null;
  const isSoundsCard = showCover && topicId === 'sounds';

  return (
    <article
      className={`practice-card${showCover ? ' practice-card--with-cover' : ''}${isSoundsCard ? ' practice-card--sounds' : ''}`}
      style={{ animationDelay: `${0.04 + index % 12 * 0.03}s` }}>
      <div
        className={`practice-card-inner${showCover ? ' practice-card-inner--with-cover' : ''}`}
        onClick={() => onPlay(practice)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPlay(practice);
          }
        }}
        role="button"
        tabIndex={0}>
        {showCover ? (
          <div className="practice-card-cover">
            <div className="practice-card-cover-media">
              <img className="practice-card-cover-img" src={coverSrc} alt="" loading="lazy" decoding="async" />
              {isSoundsCard && (
                <span className="practice-card-cover-play" aria-hidden>
                  <span className="practice-card-cover-play-icon">
                    <Play size={16} strokeWidth={2.2} />
                  </span>
                </span>
              )}
              <div className="practice-card-cover-actions">
                {isSoundsCard ? (
                  <span className="practice-card-duration practice-card-duration--cover">
                    <Clock size={14} strokeWidth={2} aria-hidden />
                    {t('pages.meditationCardDuration', { min: practice.durationMin })}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={`practice-card-fav practice-card-fav--cover ${isFavorite ? 'is-on' : ''}`}
                    aria-label={t('pages.meditationModalFavorite')}
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleFavorite(practice.id);
                    }}>
                    <Heart size={18} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                {topicLabelKey && !isSoundsCard && (
                  <span className="practice-card-topic">{t(`pages.${topicLabelKey}`)}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="practice-card-top">
            <span className="practice-card-emoji" aria-hidden>
              {practice.emoji || '🌿'}
            </span>
            <button
              type="button"
              className={`practice-card-fav ${isFavorite ? 'is-on' : ''}`}
              aria-label={t('pages.meditationModalFavorite')}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite(practice.id);
              }}>
              <Heart size={18} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}

        <div className={showCover ? 'practice-card-body' : undefined}>
          <h3 className="practice-card-title">{practiceTitle}</h3>
          {!isSoundsCard && <p className="practice-card-desc">{practice.description}</p>}
          {showCover && !isSoundsCard ? (
            <div className="practice-card-footer">
              <span className="practice-card-meta">
                <Clock size={14} strokeWidth={2} aria-hidden />
                {t('pages.meditationCardDuration', { min: practice.durationMin })}
              </span>
              <span className="practice-card-cta practice-card-cta--pill">{t('pages.meditationCardStart')}</span>
            </div>
          ) : !showCover ? (
            <span className="practice-card-cta">{practice.playLabel}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default PracticeCard;
