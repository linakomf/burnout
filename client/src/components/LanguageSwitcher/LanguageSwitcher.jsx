import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageSwitcher.css';

/**
 * RU / KK / EN — единая точка переключения (сайдбар, лендинг, вход).
 */
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, langs, t } = useLanguage();
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
