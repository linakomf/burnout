import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import {
  Home,
  Calendar,
  BarChart2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  Tag,
  Brain,
  SlidersHorizontal } from
'lucide-react';
import './Sidebar.css';
import { backendPublicUrl } from '../../utils/assetUrl';
import testsNavIcon from '../../assets/tests-nav-icon.png';

const publicPrefix = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const DEFAULT_AVATAR = encodeURI(`${publicPrefix}/photos/character.png`);

const iconProps = { size: 22, strokeWidth: 2.25 };

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
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
      icon: <img src={testsNavIcon} alt="" className="nav-icon-img" width={22} height={22} />,
      label: t('nav.tests')
    },
    { path: '/practices', icon: <SlidersHorizontal {...iconProps} />, label: t('nav.practices') },
    { path: '/stats', icon: <BarChart2 {...iconProps} />, label: t('nav.stats') }],

    [t]
  );

  const adminLinks = useMemo(
    () => [
    { path: '/admin', icon: <Home {...iconProps} />, label: t('nav.adminOverview') },
    { path: '/admin-dashboard', icon: <BarChart3 {...iconProps} />, label: t('nav.adminCrmDashboard') },
    { path: '/admin/users', icon: <Users {...iconProps} />, label: t('nav.adminUsers') },
    { path: '/admin/categories', icon: <Tag {...iconProps} />, label: t('nav.adminCategories') },
    { path: '/admin/tests', icon: <Brain {...iconProps} />, label: t('nav.adminTests') }],

    [t]
  );

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const avatarUrl = user?.avatar ? backendPublicUrl(user.avatar) : DEFAULT_AVATAR;

  return (
    <aside className={`sidebar sidebar--modern ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon" aria-hidden>
          <Brain size={22} strokeWidth={2.25} />
        </div>
        {!collapsed && <span className="logo-text">Burnout</span>}
      </div>

      <nav className="sidebar-nav" aria-label={t('nav.mainMenu')}>
        {links.map((link) => {
          const isActive =
          link.path === '/admin' ?
          location.pathname === '/admin' :
          location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
          return (
            <button
              key={link.path}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
              title={collapsed ? link.label : ''}>
            
              <span className="nav-icon">{link.icon}</span>
              {!collapsed && <span className="nav-label">{link.label}</span>}
            </button>);

        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-lang-wrap" title={collapsed ? t('nav.langAria') : ''}>
          <LanguageSwitcher className={collapsed ? 'lang-switch--collapsed' : ''} />
        </div>
        <button
          type="button"
          className="sidebar-profile"
          onClick={() => navigate('/profile')}
          title={collapsed ? t('nav.profile') : ''}>
          
          <div className="user-avatar user-avatar--sticker">
            <img
              src={avatarUrl}
              alt=""
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_AVATAR;
              }} />
            
          </div>
          {!collapsed && <span className="sidebar-profile-label">{t('nav.profile')}</span>}
        </button>
      </div>

      <button
        type="button"
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}>
        
        {collapsed ? <ChevronRight size={16} strokeWidth={2.5} /> : <ChevronLeft size={16} strokeWidth={2.5} />}
      </button>
    </aside>);

};

export default Sidebar;