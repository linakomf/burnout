import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Info,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Languages,
} from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import './Profile.css';

const NOTIF_KEY = 'burnout_notifications';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age || '',
    currentPassword: '',
    newPassword: ''
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifOn, setNotifOn] = useState(() => {
    try {
      return localStorage.getItem(NOTIF_KEY) !== '0';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(NOTIF_KEY, notifOn ? '1' : '0');
    } catch {
    }
  }, [notifOn]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.put('/users/me', form);
      updateUser(res.data);
      setMsg({ type: 'success', text: 'Профиль успешно обновлён' });
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatar: res.data.avatar });
      setMsg({ type: 'success', text: 'Фото обновлено' });
    } catch {
      setMsg({ type: 'error', text: 'Ошибка загрузки фото' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    student: t('auth.roleStudent'),
    teacher: t('auth.roleTeacher'),
    admin: t('pages.roleAdmin')
  };
  const genderLabel = {
    boy: t('auth.regGenderBoy'),
    girl: t('auth.regGenderGirl')
  };

  return (
    <div className="profile-page fade-in">
      <h1 className="page-title">{t('pages.profileTitle')}</h1>
      <p className="page-sub">{t('pages.profileSub')}</p>

      {msg &&
      <div className={`profile-msg profile-msg--banner ${msg.type}`}>
          {msg.type === 'success' ?
        <CheckCircle size={16} /> :
        msg.type === 'error' ?
        <AlertCircle size={16} /> :

        <Info size={16} />
        }
          {msg.text}
        </div>
      }

      <div className="profile-grid">
        <div className="card avatar-card">
          <div className="avatar-wrapper">
            {user?.avatar ?
            <img
              src={backendPublicUrl(user.avatar)}
              alt="avatar"
              className="profile-avatar-img" /> :


            <div className="profile-avatar-placeholder">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            }
            <label className="avatar-upload-btn" htmlFor="avatarInput">
              <Camera size={16} />
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange} />
            
          </div>
          <h2 className="profile-name">{user?.name}</h2>
          <span className="profile-role-badge">{roleLabel[user?.role]}</span>
          {user?.gender && <p className="profile-age">{genderLabel[user.gender] || user.gender}</p>}
          <p className="profile-email">{user?.email}</p>
          {user?.age && <p className="profile-age">{user.age} лет</p>}
        </div>

        <div className="card edit-card">
          <h2 className="card-title profile-card-title">Редактировать данные</h2>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>Имя</label>
                <input className="input" name="name" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Возраст</label>
                <input className="input" type="number" name="age" value={form.age} onChange={handleChange} min="14" />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input className="input" type="email" name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className="form-divider">
              <span>Изменить пароль (необязательно)</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Текущий пароль</label>
                <input
                  className="input"
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••" />
                
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input
                  className="input"
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  placeholder="Минимум 6 символов" />
                
              </div>
            </div>

            <button type="submit" className="profile-btn-save" disabled={loading}>
              <Save size={16} strokeWidth={2.2} />
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>

        <div className="card profile-settings-card">
          <h2 className="card-title profile-card-title">Настройки</h2>
          <p className="profile-settings-hint">Уведомления сохраняются на этом устройстве.</p>

          <ul className="profile-settings-list">
            <li className="profile-setting-row profile-setting-row--lang">
              <span className="profile-setting-icon" aria-hidden>
                <Languages size={20} strokeWidth={2} />
              </span>
              <div className="profile-setting-text">
                <span className="profile-setting-label">{t('nav.langAria')}</span>
                <span className="profile-setting-desc">{t('pages.profileLangHint')}</span>
              </div>
              <div className="profile-lang-switch-wrap">
                <LanguageSwitcher className="lang-switch--on-light-bg" />
              </div>
            </li>

            <li className="profile-setting-row">
              <span className="profile-setting-icon" aria-hidden>
                <Bell size={20} strokeWidth={2} />
              </span>
              <div className="profile-setting-text">
                <span className="profile-setting-label">Уведомления</span>
                <span className="profile-setting-desc">Напоминания о дневнике и практиках в браузере</span>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifOn}
                  onChange={() => setNotifOn((v) => !v)} />
                
                <span className="profile-switch-slider" />
              </label>
            </li>

            <li className="profile-setting-row">
              <span className="profile-setting-icon" aria-hidden>
                <Shield size={20} strokeWidth={2} />
              </span>
              <div className="profile-setting-text">
                <span className="profile-setting-label">Приватность</span>
                <span className="profile-setting-desc">Кто видит ваш прогресс</span>
              </div>
              <button
                type="button"
                className="profile-setting-action"
                onClick={() =>
                setMsg({ type: 'info', text: 'Раздел приватности появится в следующем обновлении.' })
                }
                aria-label="Приватность">
                
                <ChevronRight size={22} />
              </button>
            </li>
          </ul>

          <div className="profile-settings-footer">
            <button type="button" className="profile-logout-btn" onClick={handleLogout}>
              <LogOut size={18} strokeWidth={2.2} />
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>);

};

export default Profile;