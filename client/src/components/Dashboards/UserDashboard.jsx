import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Brain, LogOut, Sparkles } from 'lucide-react';
import testsNavIcon from '../../assets/tests-nav-icon.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './UserDashboard.css';

function burnoutStatusFromUser(user) {
  if (!user?.onboarding_burnout_completed || user.onboarding_burnout_percent == null) {
    return { key: 'unknown', label: 'Пройдите тест, чтобы увидеть статус', short: 'Не определён' };
  }
  const p = Number(user.onboarding_burnout_percent);
  if (Number.isNaN(p)) {
    return { key: 'unknown', label: 'Пройдите тест, чтобы увидеть статус', short: 'Не определён' };
  }
  if (p < 40) return { key: 'low', label: 'Низкий уровень выгорания', short: 'Низкий риск' };
  if (p < 70) return { key: 'medium', label: 'Средний уровень выгорания', short: 'Средний риск' };
  return { key: 'high', label: 'Высокий уровень (повышенный риск)', short: 'Высокий риск' };
}

const UserDashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const status = burnoutStatusFromUser(user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/tests/results/my');
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const testTarget = !user?.onboarding_burnout_completed ? '/onboarding/burnout' : '/tests';

  return (
    <div className="ud-root">
      <header className="ud-bar">
        <div className="ud-bar-inner">
          <div className="ud-brand">
            <div className="ud-brand-mark">
              <Brain size={18} />
            </div>
            <span>MindTrack</span>
          </div>
          <div className="ud-actions">
            <button type="button" className="ud-btn ud-btn-ghost" onClick={() => refreshUser()}>
              Обновить
            </button>
            <button type="button" className="ud-btn ud-btn-ghost" onClick={handleLogout}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LogOut size={16} /> Выйти
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="ud-main">
        <section className="ud-hero">
          <h1>
            Здравствуйте{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p>
            Это ваш личный кабинет по скринингу выгорания. Пройдите тест или откройте полный функционал приложения
            — дневник, раздел «Пространство» и аналитику.
          </p>

          <div className={`ud-status ${status.key}`}>
            <Sparkles size={18} />
            <span>
              <strong>Текущий статус:</strong> {status.short}
              {user?.onboarding_burnout_percent != null && status.key !== 'unknown' ?
              ` (${user.onboarding_burnout_percent}%)` :
              null}
            </span>
          </div>

          <button type="button" className="ud-btn ud-btn-primary" onClick={() => navigate(testTarget)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <img src={testsNavIcon} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
              Пройти тест на выгорание
            </span>
          </button>

          <p className="ud-link-row">
            <Link to="/dashboard">Открыть расширенный кабинет приложения →</Link>
          </p>
        </section>

        <section className="ud-section">
          <h2>
            <Activity size={18} color="#9bbd90" />
            История результатов
          </h2>
          {loading ?
          <div className="ud-empty">Загрузка…</div> :
          results.length === 0 ?
          <div className="ud-empty">Пока нет сохранённых результатов тестов. Пройдите опросник выше.</div> :

          <div className="ud-table-wrap">
              <table className="ud-table">
                <thead>
                  <tr>
                    <th>Тест</th>
                    <th>Дата</th>
                    <th>Балл</th>
                    <th>Уровень</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) =>
                <tr key={r.result_id}>
                      <td style={{ fontWeight: 700 }}>{r.title || '—'}</td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString('ru') : '—'}</td>
                      <td>{r.score ?? '—'}</td>
                      <td>{r.level || '—'}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </section>
      </main>
    </div>);

};

export default UserDashboard;