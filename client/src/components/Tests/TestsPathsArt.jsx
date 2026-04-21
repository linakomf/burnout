import React, { useId } from 'react';

export function IlluHealing({ className }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`h-bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff5f7" />
          <stop offset="50%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#f7fee7" />
        </linearGradient>
        <radialGradient id={`h-blob1-${uid}`} cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#fecdd3" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fecdd3" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`h-blob2-${uid}`} cx="70%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#d9f99d" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#d9f99d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`h-heart-${uid}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="36" fill={`url(#h-bg-${uid})`} />
      <circle cx="100" cy="100" r="78" fill={`url(#h-blob1-${uid})`} />
      <circle cx="100" cy="100" r="72" fill={`url(#h-blob2-${uid})`} />
      <path
        d="M100 72c-12 0-22 10-22 22 0 18 22 38 22 38s22-20 22-38c0-12-10-22-22-22z"
        fill={`url(#h-heart-${uid})`}
        opacity="0.88"
      />
      <circle cx="52" cy="56" r="4" fill="#fda4af" opacity="0.5" />
      <circle cx="152" cy="64" r="3" fill="#a3c617" opacity="0.4" />
      <circle cx="44" cy="140" r="3.5" fill="#93c5fd" opacity="0.45" />
    </svg>
  );
}

export function IlluDiscovery({ className }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`d-bg-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ecfeff" />
          <stop offset="45%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#fffbeb" />
        </linearGradient>
        <linearGradient id={`d-sun-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={`d-hill-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#86efac" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="36" fill={`url(#d-bg-${uid})`} />
      <ellipse cx="100" cy="200" rx="120" ry="48" fill={`url(#d-hill-${uid})`} />
      <circle cx="100" cy="72" r="36" fill={`url(#d-sun-${uid})`} opacity="0.95" />
      <circle cx="100" cy="72" r="44" fill="#fef08a" opacity="0.2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const r = 52;
        const x = 100 + r * Math.cos((deg * Math.PI) / 180);
        const y = 72 + r * Math.sin((deg * Math.PI) / 180);
        return <circle key={i} cx={x} cy={y} r="5" fill="#fde68a" opacity="0.55" />;
      })}
      <circle cx="48" cy="118" r="6" fill="#a5f3fc" opacity="0.6" />
      <circle cx="152" cy="124" r="5" fill="#c4b5fd" opacity="0.45" />
      <circle cx="100" cy="148" r="4" fill="#a3c617" opacity="0.35" />
    </svg>
  );
}

export function IlluInsight({ className }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id={`i-bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="50%" stopColor="#f0fdf4" />
          <stop offset="100%" stopColor="#fff7ed" />
        </linearGradient>
        <radialGradient id={`i-glow-${uid}`} cx="50%" cy="42%" r="45%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`i-star-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecfccb" />
          <stop offset="100%" stopColor="#a3c617" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="36" fill={`url(#i-bg-${uid})`} />
      <circle cx="100" cy="88" r="56" fill={`url(#i-glow-${uid})`} />
      <path
        d="M100 52l8 18 20 2-14 14 4 20-18-10-18 10 4-20-14-14 20-2z"
        fill={`url(#i-star-${uid})`}
        opacity="0.9"
      />
      <circle cx="52" cy="64" r="3" fill="#7dd3fc" opacity="0.55" />
      <circle cx="156" cy="72" r="2.5" fill="#fda4af" opacity="0.5" />
      <circle cx="44" cy="120" r="2.5" fill="#c4b5fd" opacity="0.45" />
      <circle cx="160" cy="132" r="3" fill="#a3c617" opacity="0.35" />
      <ellipse cx="100" cy="168" rx="40" ry="8" fill="rgba(163,198,23,0.12)" />
    </svg>
  );
}
