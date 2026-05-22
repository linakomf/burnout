import React, { useCallback } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import AdminFilms from './AdminFilms';
import AdminMeditations from './AdminMeditations';
import AdminEvents from './AdminEvents';
import AdminReading from './AdminReading';
import AdminMusic from './AdminMusic';
import AdminPodcasts from './AdminPodcasts';
import {
  ADMIN_SPACE_SECTIONS,
  DEFAULT_ADMIN_SPACE_SECTION,
  isValidAdminSpaceSection,
} from './adminSpaceConfig';
import './Admin.css';

function AdminSpacePanel({ sectionId }) {
  switch (sectionId) {
    case 'films':
      return <AdminFilms embedded />;
    case 'meditation':
      return <AdminMeditations embedded />;
    case 'events':
      return <AdminEvents embedded />;
    case 'reading':
      return <AdminReading embedded />;
    case 'music':
      return <AdminMusic embedded />;
    case 'podcasts':
      return <AdminPodcasts embedded />;
    default:
      return null;
  }
}

export default function AdminSpace() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = searchParams.get('section') || '';
  const section = isValidAdminSpaceSection(rawSection)
    ? rawSection
    : DEFAULT_ADMIN_SPACE_SECTION;

  const selectSection = useCallback(
    (id) => {
      if (id && isValidAdminSpaceSection(id)) {
        setSearchParams({ section: id });
      } else {
        setSearchParams({ section: DEFAULT_ADMIN_SPACE_SECTION });
      }
    },
    [setSearchParams]
  );

  if (rawSection && !isValidAdminSpaceSection(rawSection)) {
    return <Navigate to={`/admin/space?section=${DEFAULT_ADMIN_SPACE_SECTION}`} replace />;
  }

  return (
    <div className="admin-space-unified fade-in">
      <header className="admin-space-chrome">
        <h1 className="page-title">{t('nav.adminSpace')}</h1>
        <p className="page-sub">{t('nav.adminSpaceSub')}</p>
        <nav className="admin-space-tabs" aria-label={t('nav.adminSpaceTabsAria')}>
          {ADMIN_SPACE_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`admin-space-tab ${section === s.id ? 'is-active' : ''}`}
              aria-current={section === s.id ? 'true' : undefined}
              onClick={() => selectSection(s.id)}
            >
              {t(`nav.${s.labelKey}`)}
            </button>
          ))}
        </nav>
      </header>

      <div className="admin-space-panel" key={section}>
        <AdminSpacePanel sectionId={section} />
      </div>
    </div>
  );
}
