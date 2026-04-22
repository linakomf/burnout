import React, { useId } from 'react';

export function HeroPsychArt() {
  return (
    <svg
      className="tests-decor-hero-svg"
      viewBox="0 0 560 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      
      <defs>
        <linearGradient id="thg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8d0f0" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#8b7ec8" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="thg2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e8d4f5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fdeee0" stopOpacity="0.5" />
        </linearGradient>
        <filter id="tsf" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
        </filter>
      </defs>
      <ellipse cx="420" cy="40" rx="90" ry="52" fill="url(#thg2)" className="tests-decor-float tests-decor-float--slow" />
      <ellipse cx="120" cy="150" rx="110" ry="40" fill="url(#thg1)" opacity="0.45" className="tests-decor-float" />
      <path
        d="M200 120c40-50 120-55 160-5 25 28 30 70 8 95-18 20-50 22-78 8-35-18-55-55-90-98z"
        fill="#ede9f7"
        opacity="0.9"
        className="tests-decor-float tests-decor-float--mid" />
      
      <g className="tests-decor-brain" transform="translate(248 52)">
        <path
          d="M32 8c-18 0-32 16-32 36 0 22 14 38 32 38 4 0 8-1 12-3 4 2 8 3 12 3 18 0 32-16 32-38 0-20-14-36-32-36-6 0-12 2-16 6-4-4-10-6-16-6z"
          fill="#9b8fd4"
          stroke="#5a4a8c"
          strokeWidth="1.5" />
        
        <path
          d="M24 36c-4 8-4 18 0 26M40 40c0 10 0 20 2 28M56 28c6 4 10 14 8 24"
          stroke="#5a4f78"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.55" />
        
      </g>
      <circle cx="80" cy="48" r="8" fill="#7a6bc9" opacity="0.5" className="tests-decor-spark" />
      <circle cx="500" cy="140" r="6" fill="#ffb347" opacity="0.45" className="tests-decor-spark tests-decor-spark--delay" />
      <circle cx="360" cy="160" r="5" fill="#9d8bff" opacity="0.4" className="tests-decor-spark tests-decor-spark--delay2" />
      <path
        d="M140 88h22M151 77v22"
        stroke="#7a6bc9"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
        className="tests-decor-plus" />
      
    </svg>);

}

export function CardBlobArt({ bucket, uid = '0' }) {
  const colors = {
    anxiety: { a: '#ede8f7', b: '#7c6ba8' },
    stress: { a: '#fdeee0', b: '#c97d3a' },
    mood: { a: '#e4e8f8', b: '#5a6a9e' },
    esteem: { a: '#fce8e4', b: '#c06050' },
    other: { a: '#f0edf8', b: '#6a6688' }
  };
  const c = colors[bucket] || colors.other;
  const gid = `cbg-${bucket}-${uid}`;
  return (
    <svg
      className="tests-decor-card-blob"
      viewBox="0 0 120 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.a} />
          <stop offset="100%" stopColor={c.b} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M95 20c12 18 18 42 8 62-14 28-48 32-72 18C-2 88-8 52 8 28 20 8 48-4 72 4c10 2 18 10 23 16z"
        opacity="0.85"
        className="tests-decor-card-blob-shape" />
      
    </svg>);

}

export function IntroSplashArt({ bucket }) {
  const uid = useId().replace(/:/g, '');
  const tint =
  bucket === 'anxiety' ?
  '#ede8f7' :
  bucket === 'stress' ?
  '#fdeee0' :
  bucket === 'mood' ?
  '#e4e8f4' :
  bucket === 'esteem' ?
  '#fce8e4' :
  '#edebf7';
  return (
    <svg
      className="tests-decor-intro-svg"
      viewBox="0 0 320 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      
      <defs>
        <linearGradient id={`insg-top-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f7f5ff" />
          <stop offset="50%" stopColor="#eef0fc" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id={`insg-${uid}`} cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#ede9f7" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#insg-top-${uid})`} rx="28" />
      <rect width="320" height="180" fill={`url(#insg-${uid})`} rx="28" />
      <g className="tests-decor-intro-float">
        <circle cx="130" cy="92" r="44" fill={tint} opacity="0.85" />
        <circle cx="175" cy="88" r="48" fill={tint} opacity="0.85" />
        <circle cx="205" cy="96" r="38" fill={tint} opacity="0.85" />
        <circle cx="160" cy="88" r="36" fill="#c4b8e8" opacity="0.35" />
        <circle cx="52" cy="48" r="7" fill="#b8aee0" opacity="0.65" className="tests-decor-spark" />
        <circle cx="268" cy="56" r="6" fill="#bae6fd" opacity="0.55" className="tests-decor-spark tests-decor-spark--delay" />
        <path
          d="M220 120c16 0 28 12 28 28s-12 28-28 28-28-12-28-28 12-28 28-28z"
          fill="none"
          stroke="#7a6bc9"
          strokeWidth="2"
          opacity="0.35"
          className="tests-decor-pulse" />
        
      </g>
      <text x="160" y="162" textAnchor="middle" fontSize="11" fill="#7a8494" fontFamily="Nunito, sans-serif" fontWeight="600">
        Отвечайте честно — так точнее
      </text>
    </svg>);

}

export function QuestionSideArt() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      className="tests-decor-q-side"
      viewBox="0 0 64 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      
      <defs>
        <linearGradient id={`qside-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e4dff5" />
          <stop offset="100%" stopColor="#c4b8e8" />
        </linearGradient>
        <linearGradient id={`qside-b-${uid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7a6bc9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="40" r="22" fill={`url(#qside-a-${uid})`} opacity="0.55" className="tests-decor-float" />
      <circle cx="44" cy="120" r="16" fill={`url(#qside-b-${uid})`} className="tests-decor-float tests-decor-float--slow" />
      <circle cx="20" cy="96" r="5" fill="#a090d0" opacity="0.4" />
      <path
        d="M24 170c8-8 16-8 24 0"
        stroke="#7a6bc9"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.45" />
      
    </svg>);

}