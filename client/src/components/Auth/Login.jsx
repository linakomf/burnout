import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { formatAuthAxiosError, mergeField, readFormField } from '../../utils/authFormRead';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
    const email = mergeField(readFormField(formEl, 'email'), form.email, true);
    const password = mergeField(readFormField(formEl, 'password'), form.password, false);
    if (!email || !password) {
      setError(t('auth.errRequiredLogin'));
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');else
      if (!user.onboarding_burnout_completed) navigate('/onboarding/burnout', { replace: true });else
      navigate('/dashboard');
    } catch (err) {
      setError(formatAuthAxiosError(err, t) || t('auth.errLogin'));
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

        <h1 className="auth-title">{t('auth.loginTitle')}</h1>
        <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

        {error &&
        <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        }

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label>{t('auth.labelEmail')}</label>
            <input
              className="input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required />
            
          </div>

          <div className="form-group">
            <label>{t('auth.labelPassword')}</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder={t('auth.phPassword')}
                value={form.password}
                onChange={handleChange}
                required />
              
              <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? t('auth.submitLoginL') : t('auth.submitLogin')}
          </button>
        </form>

        <p className="auth-switch">
          {t('auth.noAccount')}{' '}
          <Link to="/register">{t('auth.linkReg')}</Link>
        </p>
      </div>
    </div>);

};

export default Login;