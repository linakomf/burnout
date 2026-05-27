import React from 'react';
import './SupportVerificationBadges.css';

export const SUPPORT_VERIFY_MILESTONE_LABELS = {
  contacted: 'Связь с пользователем',
  online_consultation: 'Онлайн-консультация'
};

export function SupportVerificationBadges({ confirmations = [], compact = false }) {
  if (!confirmations?.length) return null;

  return (
    <div className={`support-verify-list ${compact ? 'support-verify-list--compact' : ''}`}>
      {confirmations.map((c) => {
        let badgeClass = 'support-verify-badge--pending';
        let badgeText = 'Ожидает ответа';
        if (c.user_confirmed === true) {
          badgeClass = 'support-verify-badge--yes';
          badgeText = 'Подтвердил';
        } else if (c.user_confirmed === false) {
          badgeClass = 'support-verify-badge--no';
          badgeText = 'Не подтвердил';
        }

        return (
          <div key={c.confirmation_id} className="support-verify-item">
            <span className="support-verify-milestone">
              {SUPPORT_VERIFY_MILESTONE_LABELS[c.milestone] || c.milestone}
            </span>
            <span className={`support-verify-badge ${badgeClass}`}>{badgeText}</span>
          </div>
        );
      })}
    </div>
  );
}
