import React from 'react';
import { Heart } from 'lucide-react';



export default function PracticeCoverFavorite({
  isFavorite,
  onToggle,
  ariaLabel,
  className = '',
}) {
  return (
    <button
      type="button"
      className={`hub-cover-fav practice-card-fav practice-card-fav--cover ${isFavorite ? 'is-on' : ''} ${className}`.trim()}
      aria-label={ariaLabel}
      aria-pressed={isFavorite}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onToggle();
      }}
    >
      <Heart size={18} strokeWidth={2} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}
