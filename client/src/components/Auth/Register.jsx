import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', age: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError(t('auth.passShort')); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/onboarding/burnout', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('auth.errRegister'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob blob-1" />
        <div className="auth-blob blob-2" />
        <div className="auth-blob blob-3" />
      </div>

      <div className="auth-card fade-in">
        <div className="auth-lang-bar">
          <LanguageSwitcher className="lang-switch--on-light-bg" />
        </div>
        <div className="auth-logo">
          <div className="auth-logo-icon"><Brain size={26} /></div>
          <span>Burnout</span>
        </div>

        <h1 className="auth-title">{t('auth.registerTitle')}</h1>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t('auth.labelName')}</label>
            <input className="input" type="text" name="name" placeholder={t('auth.phName')} value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>{t('auth.labelEmail')}</label>
            <input className="input" type="email" name="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>{t('auth.labelAge')}</label>
            <input className="input" type="number" name="age" placeholder={t('auth.phAge')} value={form.age} onChange={handleChange} min="14" max="100" />
          </div>

          <div className="form-group">
            <label>{t('auth.labelRole')}</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${form.role === 'student' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'student' })}
              >
                {t('auth.roleStudent')}
              </button>
              <button
                type="button"
                className={`role-btn ${form.role === 'teacher' ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role: 'teacher' })}
              >
                {t('auth.roleTeacher')}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{t('auth.labelPassword')}</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder={t('auth.phPasswordNew')}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? t('auth.submitRegL') : t('auth.submitReg')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.linkLogin')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
