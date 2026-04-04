import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, BookOpen, Calendar, BarChart2, Settings,
  LogOut, ChevronLeft, ChevronRight, Users, Tag, Brain
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const studentLinks = [
    { path: '/dashboard', icon: <Home size={19} />, label: 'Главная' },
    { path: '/diary',     icon: <Calendar size={19} />, label: 'ИИ Дневник' },
    { path: '/tests',     icon: <BookOpen size={19} />, label: 'Тесты' },
    { path: '/stats',     icon: <BarChart2 size={19} />, label: 'Статистика' },
  ];

  const adminLinks = [
    { path: '/admin',            icon: <Home size={19} />,    label: 'Обзор' },
    { path: '/admin/users',      icon: <Users size={19} />,   label: 'Пользователи' },
    { path: '/admin/categories', icon: <Tag size={19} />,     label: 'Категории' },
    { path: '/admin/tests',      icon: <BookOpen size={19} />,label: 'Тесты' },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon"><Brain size={20} /></div>
        {!collapsed && <span className="logo-text">Burnout</span>}
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {links.map((link) => (
          <button
            key={link.path}
            className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
            onClick={() => navigate(link.path)}
            title={collapsed ? link.label : ''}
          >
            <span className="nav-icon">{link.icon}</span>
            {!collapsed && <span className="nav-label">{link.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        {/* Settings link */}
        <button
          className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
          title={collapsed ? 'Настройки' : ''}
        >
          <span className="nav-icon"><Settings size={19} /></span>
          {!collapsed && <span className="nav-label">Настройки</span>}
        </button>

        <button
          className="nav-item"
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Выйти' : ''}
        >
          <span className="nav-icon"><LogOut size={19} /></span>
          {!collapsed && <span className="nav-label">Выйти</span>}
        </button>

        {/* User mini */}
        <div className="user-mini" onClick={() => navigate('/profile')}>
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={`http://localhost:5000${user.avatar}`} alt="avatar" />
            ) : (
              <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          {!collapsed && (
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">
                {user?.role === 'student' ? 'Студент' : user?.role === 'teacher' ? 'Преподаватель' : 'Админ'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

export default Sidebar;
