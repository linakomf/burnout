import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

function PracticeCard({ practice, isFavorite, onToggleFavorite, onPlay, index }) {
  return (
    <article
      className="practice-card"
      style={{ animationDelay: `${0.04 + index % 12 * 0.03}s` }}>
      
      <motion.div
        className="practice-card-inner"
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
        transition={{ duration: 0.2 }}>
        
        <div className="practice-card-top">
          <span className="practice-card-emoji" aria-hidden>
            {practice.emoji || '🌿'}
          </span>
          <button
            type="button"
            className={`practice-card-fav ${isFavorite ? 'is-on' : ''}`}
            aria-label="Избранное"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(practice.id);
            }}>
            
            <Heart size={18} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h3 className="practice-card-title">{practice.title}</h3>
        <p className="practice-card-desc">{practice.description}</p>

        <span className="practice-card-cta">{practice.playLabel}</span>
      </motion.div>
    </article>);

}

export default PracticeCard;