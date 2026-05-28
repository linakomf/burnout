import React from 'react';
import logoSrc from '../../assets/brand/burnout-logo.png';
import './AppLogo.css';

/**
 * Фирменный логотип (облако с сердцем).
 * @param {number} [size=44] — сторона в px
 * @param {boolean} [decorative] — скрыть от скринридеров
 * @param {string} [className]
 * @param {string} [alt]
 */
export default function AppLogo({ size = 44, decorative = false, className = '', alt = 'burnout' }) {
  const px = Math.max(16, Number(size) || 44);

  return (
    <img
      src={logoSrc}
      alt={decorative ? '' : alt}
      width={px}
      height={px}
      className={`app-logo ${className}`.trim()}
      style={{ width: px, height: px }}
      decoding="async"
      draggable={false}
      {...(decorative ? { 'aria-hidden': true } : {})}
    />
  );
}
