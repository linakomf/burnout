import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { formatAuthAxiosError, mergeField, readFormField } from '../../utils/authFormRead';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formEl = e.currentTarget;
    const name = mergeField(readFormField(formEl, 'name'), form.name, true);
    const email = mergeField(readFormField(formEl, 'email'), form.email, true);
    const password = mergeField(readFormField(formEl, 'password'), form.password, false);
    const ageStr = mergeField(readFormField(formEl, 'age'), form.age, true);

    if (!name || !email || !password) {
      setError(t('auth.errRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passShort'));
      return;
    }
    setLoading(true);
    try {
      const payload = { name, email, password, role: 'student' };
      if (ageStr) {
        const ageNum = parseInt(String(ageStr).trim(), 10);
        if (Number.isFinite(ageNum)) payload.age = ageNum;
      }
      await register(payload);
      navigate('/onboarding/burnout', { replace: true });
    } catch (err) {
      setError(formatAuthAxiosError(err, t) || t('auth.errRegister'));
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

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label>{t('auth.labelName')}</label>
            <input
              className="input"
              type="text"
              name="name"
              autoComplete="name"
              placeholder={t('auth.phName')}
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.labelEmail')}</label>
            <input
              className="input"
              type="text"
              name="email"
              inputMode="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('auth.labelAge')}</label>
            <input
              className="input"
              type="number"
              name="age"
              autoComplete="bday"
              placeholder={t('auth.phAge')}
              value={form.age}
              onChange={handleChange}
              min="14"
              max="100"
            />
          </div>

          <div className="form-group">
            <label>{t('auth.labelPassword')}</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
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
