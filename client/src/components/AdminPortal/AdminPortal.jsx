import React, { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis } from
'recharts';
import { BarChart3, LogIn, LogOut, RefreshCw } from 'lucide-react';
import adminApi from '../../utils/adminApi';
import './AdminPortal.css';

const ROLE_LABEL = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Админ'
};

function formatDay(d) {
  if (!d) return '';
  const s = typeof d === 'string' ? d : d.toISOString?.().slice(0, 10) ?? String(d);
  return s.slice(5).replace('-', '.');
}

const AdminPortal = () => {
  const [token, setToken] = useState(() => localStorage.getItem('adminPortalToken'));
  const [login, setLogin] = useState('123');
  const [password, setPassword] = useState('123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const { data } = await adminApi.get('/stats');
      setStats(data);
    } catch (e) {
      setStatsError(e.response?.data?.message || 'Не удалось загрузить данные');
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadStats();
  }, [token, loadStats]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { data } = await adminApi.post('/login', { login, password });
      localStorage.setItem('adminPortalToken', data.token);
      setToken(data.token);
    } catch (err) {
      if (!err.response) {
        setAuthError(
          'Сервер не отвечает. Запустите backend (порт 5000), проверьте DATABASE_URL в server/.env и перезагрузите страницу.'
        );
      } else {
        setAuthError(err.response?.data?.message || 'Ошибка входа');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPortalToken');
    setToken(null);
    setStats(null);
  };

  if (!token) {
    return (
      <div className="admin-portal-root">
        <div className="admin-portal-login-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <BarChart3 size={28} color="#a8acf0" />
            <h2 style={{ margin: 0 }}>Панель статистики</h2>
          </div>
          <p className="hint">
            Отдельный вход для просмотра агрегированной статистики проекта. Не использует аккаунты
            пользователей приложения.
          </p>
          <form onSubmit={handleLogin}>
            {authError ? <div className="admin-portal-error">{authError}</div> : null}
            <div className="admin-portal-field">
              <label htmlFor="ap-login">Логин</label>
              <input
                id="ap-login"
                autoComplete="username"
                value={login}
                onChange={(ev) => setLogin(ev.target.value)} />
              
            </div>
            <div className="admin-portal-field">
              <label htmlFor="ap-pass">Пароль</label>
              <input
                id="ap-pass"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)} />
              
            </div>
            <button type="submit" className="admin-portal-btn admin-portal-btn-primary" disabled={authLoading} style={{ width: '100%', marginTop: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LogIn size={18} /> {authLoading ? 'Вход…' : 'Войти'}
              </span>
            </button>
          </form>
        </div>
      </div>);

  }

  const chartData = (stats?.timeline || []).map((row) => ({
    ...row,
    label: formatDay(row.day)
  }));

  return (
    <div className="admin-portal-root">
      <div className="admin-portal-inner">
        <header className="admin-portal-header">
          <div className="admin-portal-brand">
            <h1>Статистика MindTrack</h1>
            <p>
              Пользователи, тесты, дневник, практики и динамика за 14 дней. Данные с сервера в режиме
              реального времени.
            </p>
          </div>
          <div className="admin-portal-actions">
            <button
              type="button"
              className="admin-portal-btn admin-portal-btn-ghost"
              onClick={() => loadStats()}
              disabled={statsLoading}>
              
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={16} className={statsLoading ? 'admin-portal-spin' : ''} />
                Обновить
              </span>
            </button>
            <button type="button" className="admin-portal-btn admin-portal-btn-ghost" onClick={handleLogout}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LogOut size={16} /> Выйти
              </span>
            </button>
          </div>
        </header>

        {statsError ? <div className="admin-portal-error" style={{ marginBottom: 16 }}>{statsError}</div> : null}

        {statsLoading && !stats ?
        <div className="admin-portal-loading">Загрузка статистики…</div> :
        stats ?
        <>
            <div className="admin-portal-grid">
              <div className="admin-portal-stat">
                <div className="val">{stats.users.total}</div>
                <div className="lbl">Всего пользователей</div>
              </div>
              <div className="admin-portal-stat">
                <div className="val">
                  {stats.users.onboardingCompleted}/{stats.users.onboardingTotal}
                </div>
                <div className="lbl">Завершили онбординг выгорания</div>
              </div>
              <div className="admin-portal-stat">
                <div className="val">{stats.content.tests}</div>
                <div className="lbl">Тестов в каталоге</div>
              </div>
              <div className="admin-portal-stat">
                <div className="val">{stats.activity.testResultsTotal}</div>
                <div className="lbl">Прохождений тестов (всего)</div>
              </div>
              <div className="admin-portal-stat">
                <div className="val">{stats.activity.diaryEntriesTotal}</div>
                <div className="lbl">Записей в дневнике</div>
              </div>
              <div className="admin-portal-stat">
                <div className="val">{stats.activity.practiceSessionsTotal}</div>
                <div className="lbl">Сессий практик</div>
              </div>
            </div>

            <div className="admin-portal-two-col">
              <div className="admin-portal-section">
                <h3>Роли пользователей</h3>
                <div className="admin-portal-grid" style={{ marginBottom: 0 }}>
                  {Object.entries(stats.users.byRole || {}).map(([role, n]) =>
                <div key={role} className="admin-portal-stat">
                      <div className="val">{n}</div>
                      <div className="lbl">{ROLE_LABEL[role] || role}</div>
                    </div>
                )}
                </div>
              </div>
              <div className="admin-portal-section">
                <h3>Активность и контент</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: '#b8c0cc', lineHeight: 1.8 }}>
                  <li>Уникальных пользователей с результатами тестов: <strong style={{ color: '#fff' }}>{stats.activity.usersWithTestResults}</strong></li>
                  <li>Категорий тестов: <strong style={{ color: '#fff' }}>{stats.content.categories}</strong></li>
                  <li>Вопросов в базе: <strong style={{ color: '#fff' }}>{stats.content.questions}</strong></li>
                  <li>Записей дневника за 7 дней: <strong style={{ color: '#fff' }}>{stats.activity.diaryEntriesLast7Days}</strong></li>
                  <li>Средний mood_score (дневник): <strong style={{ color: '#fff' }}>{stats.activity.diaryAvgMoodScore ?? '-'}</strong></li>
                  <li>Избранных практик (связей): <strong style={{ color: '#fff' }}>{stats.activity.practiceFavoritesTotal}</strong></li>
                </ul>
              </div>
            </div>

            <div className="admin-portal-section">
              <h3>Динамика за 14 дней: новые пользователи и завершения тестов</h3>
              <div className="admin-portal-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="label" tick={{ fill: '#9a9ab0', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9a9ab0', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                    contentStyle={{
                      background: '#1a1828',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8
                    }}
                    labelStyle={{ color: '#9a9ab0' }} />
                  
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="newUsers" name="Новые пользователи" fill="#9a9fd4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="testCompletions" name="Завершения тестов" fill="#b8bce8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-portal-two-col">
              <div className="admin-portal-section">
                <h3>Топ тестов по числу прохождений</h3>
                <div className="admin-portal-table-wrap">
                  <table className="admin-portal-table">
                    <thead>
                      <tr>
                        <th>Тест</th>
                        <th style={{ textAlign: 'right' }}>Прохождений</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topTests.map((t) =>
                    <tr key={t.test_id}>
                          <td>{t.title}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#fff' }}>{t.completions}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="admin-portal-section">
                <h3>Последние регистрации</h3>
                <div className="admin-portal-table-wrap">
                  <table className="admin-portal-table">
                    <thead>
                      <tr>
                        <th>Пользователь</th>
                        <th>Роль</th>
                        <th>Онбординг</th>
                        <th>Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentUsers.map((u) =>
                    <tr key={u.user_id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7c8f' }}>{u.email}</div>
                          </td>
                          <td>
                            <span className={`admin-portal-chip ${u.role}`}>{ROLE_LABEL[u.role] || u.role}</span>
                          </td>
                          <td>{u.onboarding_burnout_completed ? `${u.onboarding_burnout_percent ?? '-'}%` : '-'}</td>
                          <td>{new Date(u.created_at).toLocaleDateString('ru')}</td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#5a6578', marginTop: 8 }}>
              Снимок: {new Date(stats.generatedAt).toLocaleString('ru')}
            </p>
          </> :
        null}
      </div>
    </div>);

};

export default AdminPortal;