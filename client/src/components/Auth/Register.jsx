import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AppLogo from '../Brand/AppLogo';
import { formatAuthAxiosError, mergeField, readFormField } from '../../utils/authFormRead';
import AuthFlowBackdrop from './AuthFlowBackdrop';
import { warmupApi } from '../../utils/apiWarmup';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', age: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(process.env.NODE_ENV === 'production');
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    warmupApi().finally(() => {
      if (!cancelled) setWarming(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const formEl = e.currentTarget;
    const firstName = mergeField(readFormField(formEl, 'firstName'), form.firstName, true);
    const lastName = mergeField(readFormField(formEl, 'lastName'), form.lastName, true);
    const email = mergeField(readFormField(formEl, 'email'), form.email, true);
    const password = mergeField(readFormField(formEl, 'password'), form.password, false);
    const ageStr = mergeField(readFormField(formEl, 'age'), form.age, true);

    if (!firstName || !email || !password) {
      setError(t('auth.errRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passShort'));
      return;
    }
    setLoading(true);
    try {
      await warmupApi();
      const payload = { firstName, lastName, email, password, role: 'student' };
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
    <AuthFlowBackdrop cardClassName="auth-card--wide">
        <div className="auth-card-top">
          <div className="auth-lang-bar">
            <LanguageSwitcher className="lang-switch--on-light-bg" />
          </div>
          <div className="auth-logo">
            <div className="auth-logo-icon app-logo-wrap">
              <AppLogo size={44} />
            </div>
            <span className="brand-wordmark">burnout</span>
          </div>
        </div>

        <h1 className="auth-title">{t('auth.registerTitle')}</h1>
        <p className="auth-subtitle auth-subtitle--tight">{t('auth.registerSubtitle')}</p>
        <div className="reg-grad-line" aria-hidden />

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-form-row">
            <div className="form-group">
              <label>{t('auth.labelFirstName')}</label>
              <input
                className="input"
                type="text"
                name="firstName"
                autoComplete="given-name"
                placeholder={t('auth.phFirstName')}
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('auth.labelLastName')}</label>
              <input
                className="input"
                type="text"
                name="lastName"
                autoComplete="family-name"
                placeholder={t('auth.phLastName')}
                value={form.lastName}
                onChange={handleChange}
              />
            </div>
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

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading || warming}>
            {loading
              ? t('auth.submitRegL')
              : warming
                ? t('auth.submitRegWarming')
                : t('auth.submitReg')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.linkLogin')}</Link>
        </p>
    </AuthFlowBackdrop>
  );
};

export default Register;
