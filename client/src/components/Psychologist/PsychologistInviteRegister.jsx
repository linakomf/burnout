import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { psychologistHomePath } from '../../utils/psychologistNav';
import './Psychologist.css';
import '../Auth/Auth.css';

export default function PsychologistInviteRegister() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    password: '',
    education: '',
    specialization: '',
    experience_years: '',
    bio: '',
    whatsapp: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/psychologists/invitations/${token}`);
        if (!cancelled) {
          setInvite(data);
          setForm((f) => ({
            ...f,
            name: data.invite_name || '',
            whatsapp: data.work_phone || ''
          }));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e?.response?.data?.message || 'Приглашение недоступно');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('token', token);
      fd.append('name', form.name.trim());
      fd.append('password', form.password);
      fd.append('education', form.education.trim());
      fd.append('specialization', form.specialization.trim());
      fd.append('experience_years', form.experience_years);
      fd.append('bio', form.bio.trim());
      fd.append('whatsapp', form.whatsapp.trim());
      if (avatar) fd.append('avatar', avatar);
      documents.forEach((f) => fd.append('documents', f));

      const { data } = await api.post('/psychologists/complete-invite', fd);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      updateUser(data.user);
      navigate(psychologistHomePath(data.user), { replace: true });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Не удалось завершить регистрацию');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <div className="psych-invite-page">
        <div className="card psych-invite-card">
          <p className="auth-error" style={{ display: 'block' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="psych-invite-page">
        <div className="card psych-invite-card">Загрузка приглашения…</div>
      </div>
    );
  }

  return (
    <div className="psych-invite-page">
      <div className="card psych-invite-card fade-in">
        <h1 className="auth-title">Регистрация психолога</h1>
        <p className="auth-subtitle">
          {invite.organization ? `${invite.organization} · ` : ''}
          {invite.email}
        </p>

        {submitError ? <p className="auth-error" style={{ display: 'block' }}>{submitError}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>ФИО</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Фото профиля</label>
            <input className="input" type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
          </div>
          <div className="form-group">
            <label>Образование</label>
            <input className="input" required value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Специализация</label>
            <input className="input" required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Стаж (лет)</label>
            <input className="input" type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} />
          </div>
          <div className="form-group">
            <label>О себе</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Рабочий WhatsApp</label>
            <input className="input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+7..." />
          </div>
          <div className="form-group">
            <label>Сертификаты и документы</label>
            <input className="input" type="file" multiple accept="image/*,.pdf" onChange={(e) => setDocuments(Array.from(e.target.files || []))} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={saving}>
            {saving ? 'Сохранение…' : 'Завершить регистрацию'}
          </button>
        </form>
      </div>
    </div>
  );
}
