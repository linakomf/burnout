import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Home,
  Calendar,
  BarChart2,
  ClipboardList,
  Users,
  Tag,
  Brain,
  SlidersHorizontal,
  Heart,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSidebarCollapse } from '../../context/SidebarCollapseContext';
import AppLogo from '../Brand/AppLogo';
import './Sidebar.css';
import { backendPublicUrl } from '../../utils/assetUrl';

const publicPrefix = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const DEFAULT_AVATAR = encodeURI(`${publicPrefix}/photos/character.png`);

const iconProps = { size: 22, strokeWidth: 2.25 };

function navLinkIsActive(path, pathname) {
  if (path === '/admin') return pathname === '/admin';
  if (path === '/psychologist') return pathname === '/psychologist';
  if (path === '/psychologist/profile') return pathname === '/psychologist/profile';
  if (path === '/admin/space') {
    return (
      pathname === '/admin/space' ||
      pathname.startsWith('/admin/films') ||
      pathname.startsWith('/admin/meditations') ||
      pathname.startsWith('/admin/events') ||
      pathname.startsWith('/admin/reading') ||
      pathname.startsWith('/admin/music') ||
      pathname.startsWith('/admin/podcasts')
    );
  }
  if (path === '/practices') {
    return (
      pathname === '/practices' ||
      pathname.startsWith('/space') ||
      (pathname.startsWith('/practices/') && !pathname.startsWith('/practices/favorites'))
    );
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

const Sidebar = () => {
  const { collapsed, toggle } = useSidebarCollapse();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const studentLinks = useMemo(
    () => [
    { path: '/dashboard', icon: <Home {...iconProps} />, label: t('nav.home') },
    { path: '/diary', icon: <Calendar {...iconProps} />, label: t('nav.diary') },
    {
      path: '/tests',
      icon: <ClipboardList {...iconProps} />,
      label: t('nav.tests')
    },
    { path: '/practices', icon: <SlidersHorizontal {...iconProps} />, label: t('nav.practices') },
    { path: '/practices/favorites', icon: <Heart {...iconProps} />, label: t('nav.favorites') },
    { path: '/stats', icon: <BarChart2 {...iconProps} />, label: t('nav.stats') }],

    [t]
  );

  const adminLinks = useMemo(
    () => [
    { path: '/admin', icon: <Home {...iconProps} />, label: t('nav.adminOverview') },
    { path: '/admin/users', icon: <Users {...iconProps} />, label: t('nav.adminUsers') },
    { path: '/admin/categories', icon: <Tag {...iconProps} />, label: t('nav.adminCategories') },
    { path: '/admin/tests', icon: <Brain {...iconProps} />, label: t('nav.adminTests') },
    { path: '/admin/space', icon: <SlidersHorizontal {...iconProps} />, label: t('nav.adminSpace') },
    { path: '/admin/psychologists', icon: <HeartHandshake {...iconProps} />, label: t('nav.adminPsychologists') }],

    [t]
  );

  const psychologistLinks = useMemo(
    () => [
      { path: '/psychologist', icon: <HeartHandshake {...iconProps} />, label: t('nav.psychologistRequests') },
      { path: '/psychologist/profile', icon: <Users {...iconProps} />, label: t('nav.profile') }
    ],
    [t]
  );

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'psychologist' ? psychologistLinks :
    studentLinks;

  const avatarUrl = user?.avatar ? backendPublicUrl(user.avatar) : DEFAULT_AVATAR;

  const profilePath =
    user?.role === 'psychologist' ? '/psychologist/profile' : '/profile';

  const profileActive =
    location.pathname === '/profile' || location.pathname === '/psychologist/profile';

  const anyNavActive = links.some((link) => navLinkIsActive(link.path, location.pathname));

  return (
    <aside className={`sidebar sidebar--modern ${collapsed ? 'collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-logo"
        onClick={() => navigate('/')}
        title={t('nav.landingHome')}
        aria-label={t('nav.landingHome')}
      >
        <div className="logo-icon app-logo-wrap" aria-hidden>
          <AppLogo size={collapsed ? 32 : 40} decorative />
        </div>
        {!collapsed && <span className="logo-text brand-wordmark">burnout</span>}
      </button>

      {collapsed ? (
        <button
          type="button"
          className="sidebar-expand-rail"
          onClick={toggle}
          aria-label={t('nav.expand')}
          title={t('nav.expand')}
        >
          <ChevronRight size={18} strokeWidth={2.5} aria-hidden />
        </button>
      ) : null}

      <nav className="sidebar-nav" aria-label={t('nav.mainMenu')}>
        {links.map((link) => {
          const isActive = navLinkIsActive(link.path, location.pathname);
          return (
            <div
              key={link.path}
              className={`nav-item-row${isActive ? ' nav-item-row--active' : ''}${collapsed ? ' nav-item-row--collapsed' : ''}`}
            >
              <button
                type="button"
                className="nav-item-main"
                onClick={() => navigate(link.path)}
                title={collapsed ? link.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon">{link.icon}</span>
                {!collapsed && <span className="nav-label">{link.label}</span>}
              </button>
              {!collapsed && isActive ? (
                <button
                  type="button"
                  className="nav-item-rail-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                  aria-label={t('nav.collapse')}
                  title={t('nav.collapse')}
                >
                  <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}
      </nav>

      {!collapsed && !anyNavActive && !profileActive ? (
        <div className="sidebar-collapse-fallback">
          <button
            type="button"
            className="nav-item-rail-toggle nav-item-rail-toggle--solo"
            onClick={toggle}
            aria-label={t('nav.collapse')}
            title={t('nav.collapse')}
          >
            <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="sidebar-bottom">
        <div
          className={`sidebar-profile-row${profileActive ? ' sidebar-profile-row--active' : ''}${collapsed ? ' sidebar-profile-row--collapsed' : ''}`}
        >
          <button
            type="button"
            className={`sidebar-profile ${profileActive ? 'active' : ''}`}
            onClick={() => navigate(profilePath)}
            title={collapsed ? t('nav.profile') : undefined}
            aria-current={profileActive ? 'page' : undefined}
          >
            <div className="user-avatar user-avatar--sticker">
              <img
                src={avatarUrl}
                alt=""
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
              />
            </div>
            {!collapsed && <span className="sidebar-profile-label">{t('nav.profile')}</span>}
          </button>
          {!collapsed && profileActive ? (
            <button
              type="button"
              className="nav-item-rail-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              aria-label={t('nav.collapse')}
              title={t('nav.collapse')}
            >
              <ChevronLeft size={16} strokeWidth={2.5} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </aside>);

};

export default Sidebar;