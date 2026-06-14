import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { isVideoCoverAsset } from '../Practices/practiceMedia';
import './ChatRecommendationCards.css';

const ChatRecommendationCards = ({ cards, label = 'Из вашего пространства' }) => {
  const navigate = useNavigate();

  if (!cards?.length) return null;

  return (
    <div className="chat-rec-cards" aria-label={label}>
      <p className="chat-rec-cards__label">{label}</p>
      <div className="chat-rec-cards__strip">
        {cards.map((card) => {
          const coverIsVideo = Boolean(card.image) && isVideoCoverAsset(card.image);
          const open = () => navigate(card.path);
          return (
            <article
              key={`${card.type}-${card.path}-${card.title}`}
              className="chat-rec-card"
              role="button"
              tabIndex={0}
              onClick={open}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open();
                }
              }}
            >
              <div
                className={`chat-rec-card__media${coverIsVideo ? ' chat-rec-card__media--video' : ''}`}
                style={coverIsVideo ? undefined : { backgroundImage: card.image ? `url(${card.image})` : undefined }}
              >
                {coverIsVideo ? (
                  <video src={card.image} autoPlay loop muted playsInline preload="metadata" aria-hidden />
                ) : null}
              </div>
              <div className="chat-rec-card__body">
                <span className="chat-rec-card__cat">{card.subtitle}</span>
                <h4 className="chat-rec-card__title">{card.title}</h4>
                {card.description ? <p className="chat-rec-card__desc">{card.description}</p> : null}
              </div>
              <span className="chat-rec-card__go" aria-hidden>
                <ArrowRight size={16} strokeWidth={2.4} />
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ChatRecommendationCards;
