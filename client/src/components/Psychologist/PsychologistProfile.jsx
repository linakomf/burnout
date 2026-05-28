import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  AlertCircle,
  CheckCircle,
  LogOut,
  Languages,
  FileText,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import api from '../../utils/api';
import {
  areNotificationsEnabled,
  writeLocalNotificationsEnabled,
} from '../../utils/notificationPreferences';
import { backendPublicUrl, parseMediaPathsText } from '../../utils/assetUrl';
import { ACCOUNT_STATUS_LABELS } from './psychConstants';
import SidebarCollapseButton from '../Layout/SidebarCollapseButton';
import '../Profile/Profile.css';

void SidebarCollapseButton;

export default function PsychologistProfile() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({
    name: '',
    education: '',
    specialization: '',
    experience_years: '',
    bio: '',
    whatsapp: '',
    work_phone: ''
  });
  const [avatarPath, setAvatarPath] = useState('');
  const [newDocsText, setNewDocsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [notifOn, setNotifOn] = useState(() => areNotificationsEnabled(user));
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    api
      .get('/psychologists/me/profile')
      .then(({ data }) => {
        setProfile(data.profile);
        setDocuments(data.documents || []);
        setForm({
          name: data.profile?.name || '',
          education: data.profile?.education || '',
          specialization: data.profile?.specialization || '',
          experience_years: data.profile?.experience_years ?? '',
          bio: data.profile?.bio || '',
          whatsapp: data.profile?.whatsapp || '',
          work_phone: data.profile?.work_phone || ''
        });
      })
      .catch(() => {
        setMsg({ type: 'error', text: 'Не удалось загрузить профиль' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setNotifOn(areNotificationsEnabled(user));
  }, [user?.user_id, user?.notifications_enabled]);

  const handleNotificationsToggle = async () => {
    if (notifSaving) return;
    const next = !notifOn;
    setNotifOn(next);
    writeLocalNotificationsEnabled(next);
    setNotifSaving(true);
    try {
      const { data } = await api.put('/users/me/notifications-enabled', { enabled: next });
      const enabled = data?.notifications_enabled !== false;
      setNotifOn(enabled);
      writeLocalNotificationsEnabled(enabled);
      updateUser({ notifications_enabled: enabled });
    } catch {
      const rollback = !next;
      setNotifOn(rollback);
      writeLocalNotificationsEnabled(rollback);
      setMsg({ type: 'error', text: 'Не удалось сохранить настройку уведомлений' });
    } finally {
      setNotifSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const documents = parseMediaPathsText(newDocsText).map((path) => ({
        path,
        original_name: path.split('/').pop() || 'document',
      }));
      const payload = { ...form };
      if (avatarPath.trim()) payload.avatar = avatarPath.trim();
      if (documents.length) payload.documents = documents;
      const { data } = await api.put('/psychologists/me/profile', payload);
      setProfile(data.profile);
      setDocuments(data.documents || []);
      updateUser({
        name: data.profile?.name,
        avatar: data.profile?.avatar
      });
      setAvatarPath('');
      setNewDocsText('');
      setMsg({ type: 'success', text: 'Профиль успешно обновлён' });
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="dash-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  const avatarUrl = profile?.avatar ? backendPublicUrl(profile.avatar) : null;
  const avatarPreview = avatarPath.trim()
    ? backendPublicUrl(avatarPath.trim())
    : avatarUrl;
  const statusLabel =
    ACCOUNT_STATUS_LABELS[profile?.account_status] || profile?.account_status || 'Психолог';

  return (
    <div className="profile-page fade-in">
      <h1 className="page-title">{t('pages.profileTitle')}</h1>
      <p className="page-sub">{t('pages.profileSub')}</p>

      {msg ? (
        <div className={`profile-msg profile-msg--banner ${msg.type}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      ) : null}

      <div className="profile-grid">
        <div className="card avatar-card">
          <div className="avatar-wrapper">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginTop: 12, width: '100%' }}>
            <label>Путь к фото</label>
            <input
              className="input"
              type="text"
              value={avatarPath}
              onChange={(e) => setAvatarPath(e.target.value)}
              placeholder={profile?.avatar || '/uploads/avatar.jpg'}
            />
          </div>
          <h2 className="profile-name">{profile?.name}</h2>
          <span className="profile-role-badge">{statusLabel}</span>
          <p className="profile-email">{profile?.email}</p>
          {profile?.organization ? (
            <p className="profile-age">{profile.organization}</p>
          ) : null}
          {profile?.specialist_level ? (
            <p className="profile-age">{profile.specialist_level}</p>
          ) : null}
        </div>

        <div className="card edit-card">
          <h2 className="card-title profile-card-title">Редактировать данные</h2>
          <p className="profile-settings-hint" style={{ marginBottom: 16 }}>
            Данные видны администратору при модерации аккаунта.
          </p>

          <form onSubmit={handleSave} className="profile-form">
            <div className="form-group">
              <label>ФИО</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Образование</label>
                <input
                  className="input"
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Специализация</label>
                <input
                  className="input"
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Стаж (лет)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Рабочий телефон</label>
                <input
                  className="input"
                  value={form.work_phone}
                  onChange={(e) => setForm({ ...form, work_phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>WhatsApp</label>
              <input
                className="input"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>О себе</label>
              <textarea
                className="input"
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div className="form-divider">
              <span>Документы</span>
            </div>

            <div className="form-group">
              <label>Добавить документы (пути)</label>
              <textarea
                className="input"
                rows={3}
                value={newDocsText}
                onChange={(e) => setNewDocsText(e.target.value)}
                placeholder="/uploads/cert.pdf"
              />
            </div>

            {documents.length > 0 ? (
              <ul className="profile-documents-list">
                {documents.map((d) => (
                  <li key={d.document_id}>
                    <a href={backendPublicUrl(d.file_path)} target="_blank" rel="noopener noreferrer">
                      <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      {d.original_name || d.file_path}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}

            <button type="submit" className="profile-btn-save" disabled={saving}>
              <Save size={16} strokeWidth={2.2} />
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
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
                <LanguageSwitcher variant="dropdown" />
              </div>
            </li>

            <li className="profile-setting-row">
              <span className="profile-setting-icon" aria-hidden>
                <Bell size={20} strokeWidth={2} />
              </span>
              <div className="profile-setting-text">
                <span className="profile-setting-label">Уведомления</span>
                <span className="profile-setting-desc">Напоминания в браузере</span>
              </div>
              <label className="profile-switch">
                <input
                  type="checkbox"
                  checked={notifOn}
                  disabled={notifSaving}
                  onChange={handleNotificationsToggle}
                />
                <span className="profile-switch-slider" />
              </label>
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
    </div>
  );
}
