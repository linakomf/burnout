import React from 'react';

/**
 * Общий фон и стеклянная карточка для входа, регистрации и онбординга.
 */
export default function AuthFlowBackdrop({ children, cardClassName = '' }) {
  return (
    <div className="auth-page auth-page--dashboard">
      <div className="auth-bg auth-bg--dashboard" aria-hidden />
      <div className="auth-bg auth-bg--blobs" aria-hidden>
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
        <div className="auth-blob blob-3" />
      </div>
      <div className={`auth-card fade-in ${cardClassName}`.trim()}>{children}</div>
    </div>
  );
}
