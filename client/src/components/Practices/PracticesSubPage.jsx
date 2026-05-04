import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

function PracticesSubPage({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="practices-sub-page fade-in">
      <button type="button" className="practices-sub-back" onClick={() => navigate('/practices')}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        {t('pages.practicesBackToHub')}
      </button>
      <header className="practices-sub-head">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}

export default PracticesSubPage;
