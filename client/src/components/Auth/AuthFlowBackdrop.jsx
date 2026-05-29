import React from 'react';

/**
 * Общий фон и стеклянная карточка для входа, регистрации и онбординга.
 */
export default function AuthFlowBackdrop({ children, cardClassName = '', variant = 'landing' }) {
  const isLanding = variant === 'landing';

  return (
    <div className={`auth-page ${isLanding ? 'auth-page--landing-v2' : 'auth-page--dashboard'}`}>
      <div
        className={`auth-bg ${isLanding ? 'auth-bg--landing-v2' : 'auth-bg--dashboard'}`}
        aria-hidden
      />
      <div className="auth-bg auth-bg--blobs" aria-hidden>
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
        <div className="auth-blob blob-3" />
      </div>
      <div className={`auth-card fade-in ${cardClassName}`.trim()}>{children}</div>
    </div>
  );
}
