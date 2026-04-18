import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Auth.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin-dashboard', { replace: true });
      else navigate('/user-dashboard', { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Сервер не отвечает. Запустите backend (например npm run server) и проверьте server/.env.');
      } else if (err.response.status === 401) {
        setError('Неверный логин или пароль');
      } else {
        const d = err.response?.data;
        const raw =
          typeof d === 'string' && d.trim()
            ? d.replace(/<[^>]+>/g, '').slice(0, 400)
            : d?.message || d?.error || '';
        const low = String(raw).toLowerCase();
        if (/econnrefused|proxy error|could not proxy/i.test(low)) {
          setError('Backend недоступен. Запустите сервер на порту из proxy (обычно 5000) и проверьте .env.');
        } else {
          setError(
            raw || `Ошибка сервера (${err.response.status}). Проверьте JWT_SECRET и логи backend.`
          );
        }
      }
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
        <div className="auth-logo">
          <div className="auth-logo-icon"><Brain size={26} /></div>
          <span>Burnout</span>
        </div>

        <h1 className="auth-title">Добро пожаловать</h1>
        <p className="auth-subtitle">Войдите в систему психологической поддержки</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              className="input"
              type="text"
              name="email"
              inputMode="email"
              autoComplete="username"
              placeholder="Ваш email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Ваш пароль"
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
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="auth-switch">
          Нет аккаунта?{' '}
          <Link to="/register">Зарегистрироваться</Link>
        </p>
        <p className="auth-demo-hint" style={{ marginTop: 14, fontSize: '0.8125rem', color: 'var(--text-light)', lineHeight: 1.5, textAlign: 'center' }}>
          Учётная запись администратора создаётся при старте сервера (см. <code>DEFAULT_ADMIN_EMAIL</code> /{' '}
          <code>DEFAULT_ADMIN_PASSWORD</code> в server/.env). Нужны запущенные backend и база данных.
        </p>
      </div>
    </div>
  );
};

export default Login;
