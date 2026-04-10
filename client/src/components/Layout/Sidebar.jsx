import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Calendar, BarChart2, ChevronLeft, ChevronRight, Users, Tag, Brain, Flower2, User,
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const studentLinks = [
    { path: '/dashboard', icon: <Home size={19} />, label: 'Главная' },
    { path: '/stats',     icon: <BarChart2 size={19} />, label: 'Аналитика' },
    { path: '/tests',     icon: <Brain size={19} />, label: 'Тесты' },
    { path: '/practices', icon: <Flower2 size={19} />, label: 'Практики' },
    { path: '/diary',     icon: <Calendar size={19} />, label: 'ИИ Дневник' },
    { path: '/profile',   icon: <User size={19} />, label: 'Профиль' },
  ];

  const adminLinks = [
    { path: '/admin',            icon: <Home size={19} />,    label: 'Обзор' },
    { path: '/admin/users',      icon: <Users size={19} />,   label: 'Пользователи' },
    { path: '/admin/categories', icon: <Tag size={19} />,     label: 'Категории' },
    { path: '/admin/tests',      icon: <Brain size={19} />, label: 'Тесты' },
    { path: '/profile',          icon: <User size={19} />,    label: 'Профиль' },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const lightStudentShell = user?.role !== 'admin';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${lightStudentShell ? 'sidebar--light-mock' : ''}`}>
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
