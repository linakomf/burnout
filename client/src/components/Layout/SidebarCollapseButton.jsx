import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useSidebarCollapse } from '../../context/SidebarCollapseContext';
import { useLanguage } from '../../context/LanguageContext';
import './SidebarCollapseButton.css';

/**
 * Optional collapse control for legacy layouts.
 * Prefer collapsing from the active item in `Sidebar.jsx` (rail toggle).
 */
export default function SidebarCollapseButton({ className = '' }) {
  const { collapsed, toggle } = useSidebarCollapse();
  const { t } = useLanguage();

  if (collapsed) return null;

  return (
    <button
      type="button"
      className={`sidebar-collapse-external-btn ${className}`.trim()}
      onClick={toggle}
      aria-label={t('nav.collapse')}
      title={t('nav.collapse')}
    >
      <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
    </button>
  );
}
