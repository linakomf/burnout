import React from 'react';
import { motion } from 'framer-motion';
import { Clock3, Heart, Play } from 'lucide-react';

function PracticeCard({
  practice,
  isFavorite,
  onToggleFavorite,
  onPlay,
  index,
}) {
  const accentMap = {
    breath: 'heal',
    restore: 'heal',
    grounding: 'discover',
    focus: 'discover',
    sleep: 'insight',
  };
  const accent = accentMap[practice.category] || 'plain';

  return (
    <article
      className={`tests-catalog-card tests-catalog-card--${accent} practices-catalog-card`}
      style={{ animationDelay: `${0.04 + (index % 12) * 0.035}s` }}
    >
      <motion.div
        className="tests-catalog-card-inner practices-card-inner"
        onClick={() => onPlay(practice)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onPlay(practice);
          }
        }}
        role="button"
        tabIndex={0}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="tests-catalog-card-top practices-card-top">
          <span className="tests-catalog-card-strip" />
          <button
            type="button"
            className={`practices-fav-btn ${isFavorite ? 'is-on' : ''}`}
            aria-label="Избранное"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(practice.id);
            }}
          >
            <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h3 className="tests-catalog-card-title">
          <span className="practices-emoji" aria-hidden>
            {practice.emoji || '🌿'}
          </span>{' '}
          {practice.title}
        </h3>
        <p className="tests-catalog-card-desc">{practice.description}</p>

        <p className="practices-card-meta">
          <Clock3 size={14} />
          {practice.durationMin} мин · {practice.format}
        </p>

        <span className="tests-catalog-card-cta practices-card-cta">
          <Play size={15} fill="currentColor" />
          {practice.playLabel}
        </span>
      </motion.div>
    </article>
  );
}

export default PracticeCard;
