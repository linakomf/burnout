import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSwitcher.css';

/** Полные названия языков в списке настроек (на русском). */
const LANG_FULL_LABELS = {
  ru: 'Русский',
  kk: 'Казахский',
  en: 'Английский',
};

export default function LanguageSwitcher({ className = '', variant = 'pills' }) {
  const { lang, setLang, langs, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'dropdown') {
    const currentLabel = LANG_FULL_LABELS[lang] || LANG_FULL_LABELS.ru;
    return (
      <div ref={rootRef} className={`lang-dropdown ${className}`.trim()}>
        <button
          type="button"
          className="lang-dropdown-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={t('nav.langAria')}
        >
          <span>{currentLabel}</span>
          <ChevronDown size={18} strokeWidth={2.2} className={open ? 'lang-dropdown-chevron is-open' : 'lang-dropdown-chevron'} aria-hidden />
        </button>
        {open ? (
          <ul className="lang-dropdown-menu" role="listbox" aria-label={t('nav.langAria')}>
            {langs.map((l) => {
              const label = LANG_FULL_LABELS[l.code] || l.name;
              const selected = lang === l.code;
              return (
                <li key={l.code} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`lang-dropdown-option${selected ? ' is-selected' : ''}`}
                    onClick={() => {
                      setLang(l.code);
                      setOpen(false);
                    }}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`lang-switch ${className}`.trim()}
      role="group"
      aria-label={t('nav.langAria')}
    >
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-switch-btn ${lang === l.code ? 'active' : ''}`}
          onClick={() => setLang(l.code)}
          title={l.name}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
