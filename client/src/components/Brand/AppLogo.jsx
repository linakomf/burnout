import React from 'react';
import logoSrc from '../../assets/brand/mindtrack-logo.png';
import './AppLogo.css';

export const APP_LOGO_ALT = 'MindTrack';

export default function AppLogo({ className = '', size = 40, alt = APP_LOGO_ALT, decorative = false }) {
  return (
    <img
      src={logoSrc}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? true : undefined}
      className={`app-logo${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      decoding="async"
      draggable={false}
    />
  );
}
