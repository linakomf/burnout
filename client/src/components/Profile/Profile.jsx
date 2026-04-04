import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Camera, Save, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age || '',
    currentPassword: '',
    newPassword: '',
  });
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await api.put('/users/me', form);
      updateUser(res.data);
      setMsg({ type: 'success', text: 'Профиль успешно обновлён' });
      setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: res.data.avatar });
      setMsg({ type: 'success', text: 'Фото обновлено' });
    } catch {
      setMsg({ type: 'error', text: 'Ошибка загрузки фото' });
    }
  };

  const roleLabel = { student: '🎓 Студент', teacher: '👨‍🏫 Преподаватель', admin: '⚙️ Администратор' };

  return (
    <div className="profile-page fade-in">
      <h1 className="page-title">Мой профиль</h1>

      <div className="profile-grid">
        {/* Avatar card */}
        <div className="card avatar-card">
          <div className="avatar-wrapper">
            {user?.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt="avatar"
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <label className="avatar-upload-btn" htmlFor="avatarInput">
              <Camera size={16} />
            </label>
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <h2 className="profile-name">{user?.name}</h2>
          <span className="profile-role-badge">{roleLabel[user?.role]}</span>
          <p className="profile-email">{user?.email}</p>
          {user?.age && <p className="profile-age">{user.age} лет</p>}
        </div>

        {/* Edit form */}
        <div className="card edit-card">
          <h2 className="card-title" style={{ marginBottom: 24 }}>Редактировать данные</h2>

          {msg && (
            <div className={`profile-msg ${msg.type}`}>
              {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {msg.text}
            </div>
          )}

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
                <input className="input" type="password" name="currentPassword"
                  value={form.currentPassword} onChange={handleChange}
                  placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label>Новый пароль</label>
                <input className="input" type="password" name="newPassword"
                  value={form.newPassword} onChange={handleChange}
                  placeholder="Минимум 6 символов" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary save-btn" disabled={loading}>
              <Save size={16} />
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
