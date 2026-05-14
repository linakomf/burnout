import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend } from
'recharts';
import { BarChart3, LogOut, Users, LayoutList, HeartHandshake } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import './AdminDashboard.css';

const LEVEL_LABEL = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий (риск депрессии)',
  unknown: 'Нет данных'
};

const LEVEL_STYLE = {
  low: { color: '#3d4266', bg: 'rgba(208, 210, 248, 0.45)' },
  medium: { color: '#b45309', bg: '#fff8e6' },
  high: { color: '#b91c1c', bg: '#fdecef' },
  unknown: { color: '#64748b', bg: '#f1f5f9' }
};

const PIE_COLORS = {
  low: '#9a9fd4',
  medium: '#eab308',
  high: '#ef4444',
  unknown: '#94a3b8'
};

function describeAdminDataLoadError(err) {
  if (!err) return 'Не удалось загрузить данные';
  if (!err.response) {
    const msg = String(err.message || '');
    if (/network error|failed to fetch|load failed|err_network/i.test(msg) || err.code === 'ERR_NETWORK') {
      return 'Нет ответа от сервера. Убедитесь, что backend запущен (например npm run server) и слушает порт 5000 - как в proxy клиента.';
    }
    return msg || 'Не удалось загрузить данные';
  }
  const { status, data } = err.response;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (status === 404) {
    return 'Маршрут не найден (404). Перезапустите backend из папки server. Должен быть доступен GET /api/users/with-results (или /api/users-with-results).';
  }
  if (status === 403) return 'Доступ запрещён. Нужна роль администратора.';
  if (status === 401) return 'Сессия недействительна. Выйдите и войдите снова.';
  return `Ошибка запроса (${status}). ${err.response.statusText || ''}`.trim();
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [supportRequests, setSupportRequests] = useState([]);
  const [supportError, setSupportError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setSupportError('');
      setLoading(true);
      try {
        const settled = await Promise.allSettled([
          api.get('/users/with-results'),
          api.get('/users/support-requests')
        ]);
        if (cancelled) return;
        const [mainRes, supRes] = settled;
        if (mainRes.status === 'fulfilled') {
          setData(mainRes.value.data);
          setError('');
        } else {
          setData(null);
          setError(describeAdminDataLoadError(mainRes.reason));
        }
        if (supRes.status === 'fulfilled') {
          setSupportRequests(supRes.value.data?.rows || []);
          setSupportError('');
        } else {
          setSupportRequests([]);
          setSupportError(describeAdminDataLoadError(supRes.reason));
        }
      } catch (e) {
        if (!cancelled) {
          setError(describeAdminDataLoadError(e));
          setData(null);
          setSupportRequests([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const rows = data?.rows || [];
    return rows.filter((row) => {
      if (levelFilter !== 'all' && row.level !== levelFilter) return false;
      if (dateFrom && row.testDate && row.testDate < dateFrom) return false;
      if (dateTo && row.testDate && row.testDate > dateTo) return false;
      if (dateFrom && !row.testDate) return false;
      if (dateTo && !row.testDate) return false;
      return true;
    });
  }, [data, dateFrom, dateTo, levelFilter]);

  const pieData = useMemo(() => {
    const d = data?.burnoutDistribution || { low: 0, medium: 0, high: 0, unknown: 0 };
    return ['low', 'medium', 'high', 'unknown'].
    map((k) => ({
      name: LEVEL_LABEL[k],
      value: d[k] || 0,
      key: k,
      color: PIE_COLORS[k]
    })).
    filter((x) => x.value > 0);
  }, [data]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const dist = data?.burnoutDistribution || {};
  const hasAnyRows = (data?.rows?.length ?? 0) > 0;
  const filtersActive = Boolean(dateFrom || dateTo || levelFilter !== 'all');
  const chartData = data?.activityByDay || [];

  return (
    <div className="ad-root">
      <header className="ad-bar">
        <div className="ad-bar-inner">
          <div className="ad-head-left">
            <div className="ad-mark">
              <BarChart3 size={20} />
            </div>
            <div className="ad-title-block">
              <h1>Аналитика платформы · выгорание</h1>
              <p>Студенты и преподаватели · CRM-дашборд</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/admin" className="ad-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <LayoutList size={16} /> Классическая админка
            </Link>
            <button type="button" className="ad-btn" onClick={handleLogout}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LogOut size={16} /> Выйти
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="ad-main">
        {loading ?
        <div className="ad-empty">Загрузка…</div> :
        <>
            {error ? <div className="ad-error">{error}</div> : null}

            <div className="ad-panel ad-support-panel">
              <h3>
                <HeartHandshake size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />
                Обращения «Мы рядом»
              </h3>
              <p className="ad-support-lead">
                Заявки с главной страницы дашборда. Для каждого отправителя показан первичный скрининг выгорания (онбординг)
                и последний релевантный тест из каталога (MBI, ежедневный чек-ин).
              </p>
              {supportError ?
              <div className="ad-error ad-error--soft">{supportError}</div> :
              null}
              {supportRequests.length === 0 && !supportError ?
              <div className="ad-empty ad-empty--left">Пока нет обращений</div> :

              <ul className="ad-support-list">
                  {supportRequests.map((r) => {
                  const created = r.created_at ? new Date(r.created_at).toLocaleString('ru') : '-';
                  const onb = r.onboarding || {};
                  const cat = r.catalog_burnout_test;
                  const onbDate = onb.completed_at ?
                  new Date(onb.completed_at).toLocaleDateString('ru') :
                  null;
                  const catDate = cat?.test_date ?
                  new Date(cat.test_date).toLocaleDateString('ru') :
                  null;
                  const rawContact = String(r.contact || '').trim();
                  const contactHref =
                  /^https?:\/\//i.test(rawContact) ?
                  rawContact :
                  rawContact.includes('@') ?
                  `mailto:${encodeURIComponent(rawContact)}` :
                  /^\+?\d[\d\s()-]{6,}$/.test(rawContact) ?
                  `tel:${rawContact.replace(/\s/g, '')}` :
                  `mailto:${encodeURIComponent(rawContact)}`;
                  return (
                    <li key={r.request_id} className="ad-support-card">
                        <div className="ad-support-card-top">
                          <span className="ad-support-when">{created}</span>
                          <span className="ad-support-req-id">#{r.request_id}</span>
                        </div>
                        <div className="ad-support-acct">
                          <span className="ad-support-mono">ID {r.user_id}</span>
                          <span className="ad-support-sep">·</span>
                          <span>{r.account_email}</span>
                          {r.account_name ?
                      <>
                              <span className="ad-support-sep">·</span>
                              <span>{r.account_name}</span>
                            </> :
                      null}
                        </div>
                        <div className="ad-support-row">
                          <span className="ad-support-k">Имя в форме:</span> {r.display_name}
                        </div>
                        <div className="ad-support-row">
                          <span className="ad-support-k">Контакт:</span>{' '}
                          <a className="ad-support-link" href={contactHref}>
                            {r.contact}
                          </a>
                        </div>
                        <div className="ad-support-messagewrap">
                          <div className="ad-support-k">Сообщение</div>
                          <p className="ad-support-message">{r.message}</p>
                        </div>
                        <div className="ad-support-burnout-grid">
                          <div className="ad-support-burnout-card">
                            <div className="ad-support-burnout-h">Первичный скрининг (онбординг)</div>
                            {onb.completed ?
                        <>
                              <div className="ad-support-burnout-meta">
                                {onbDate ? <span>{onbDate}</span> : null}
                              </div>
                              <span
                            className="ad-badge"
                            style={{
                              color: LEVEL_STYLE[onb.level]?.color,
                              background: LEVEL_STYLE[onb.level]?.bg
                            }}>
                            
                                {LEVEL_LABEL[onb.level]}
                                {onb.percent != null && onb.level !== 'unknown' ? ` · ${onb.percent}%` : ''}
                              </span>
                            </> :

                        <p className="ad-support-muted">Не пройден</p>}
                          </div>
                          <div className="ad-support-burnout-card">
                            <div className="ad-support-burnout-h">Каталог: последний тест на выгорание</div>
                            {cat ?
                        <>
                              <div className="ad-support-burnout-meta">
                                <span className="ad-support-test-title">{cat.test_title}</span>
                                {catDate ? <span className="ad-support-when-inline">{catDate}</span> : null}
                              </div>
                              <span
                            className="ad-badge"
                            style={{
                              color: LEVEL_STYLE[cat.level]?.color,
                              background: LEVEL_STYLE[cat.level]?.bg
                            }}>
                            
                                {LEVEL_LABEL[cat.level]}
                                {cat.percent != null && cat.level !== 'unknown' ? ` · ${cat.percent}%` : ''}
                              </span>
                            </> :

                        <p className="ad-support-muted">Нет прохождений MBI или ежедневного чек-ина</p>}
                          </div>
                        </div>
                      </li>);

                })}
                </ul>
              }
            </div>

            {!data ? null :
            <>
                <div className="ad-kpi-grid">
                <div className="ad-kpi">
                  <div className="ad-kpi-label">Пользователей платформы</div>
                  <div className="ad-kpi-value">{data.kpis.totalUsers}</div>
                </div>
                <div className="ad-kpi">
                  <div className="ad-kpi-label">Прохождения сегодня</div>
                  <div className="ad-kpi-value">{data.kpis.testsToday}</div>
                </div>
                <div className="ad-kpi">
                  <div className="ad-kpi-label">Прохождения за 7 дней</div>
                  <div className="ad-kpi-value">{data.kpis.testsWeek}</div>
                </div>
                <div className="ad-kpi">
                  <div className="ad-kpi-label">Новые за 7 дней</div>
                  <div className="ad-kpi-value">{data.kpis.newUsersWeek}</div>
                </div>
              </div>

                <div className="ad-burnout-row">
                <div className="ad-burn" style={{ borderLeftColor: PIE_COLORS.low }}>
                  <div className="n">{dist.low ?? 0}</div>
                  <div className="l">Низкий уровень выгорания</div>
                </div>
                <div className="ad-burn" style={{ borderLeftColor: PIE_COLORS.medium }}>
                  <div className="n">{dist.medium ?? 0}</div>
                  <div className="l">Средний уровень</div>
                </div>
                <div className="ad-burn" style={{ borderLeftColor: PIE_COLORS.high }}>
                  <div className="n">{dist.high ?? 0}</div>
                  <div className="l">Высокий (риск депрессии)</div>
                </div>
              </div>

                <div className="ad-grid-2">
                <div className="ad-panel">
                  <h3>Активность скринингов по дням</h3>
                  <div className="ad-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="adVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#b8bce8" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#b8bce8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: '#666666', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#666666', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e0e0e0' }}
                        formatter={(v) => [`${v}`, 'Записей']} />
                      
                        <Area type="monotone" dataKey="visits" stroke="#7c82c4" strokeWidth={2} fill="url(#adVisits)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="ad-panel">
                  <h3>Распределение по состоянию</h3>
                  <div className="ad-chart">
                    {pieData.length === 0 ?
                  <div className="ad-empty" style={{ paddingTop: 100 }}>
                      Нет данных для диаграммы
                    </div> :

                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={86}
                      paddingAngle={2}>
                      
                          {pieData.map((e) =>
                      <Cell key={e.key} fill={e.color} stroke="#fff" strokeWidth={2} />
                      )}
                        </Pie>
                        <Legend verticalAlign="bottom" height={32} formatter={(v) => <span style={{ color: '#666666', fontSize: 12 }}>{v}</span>} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e0e0e0' }} formatter={(v) => [`${v}`, 'Записей']} />
                      </PieChart>
                    </ResponsiveContainer>
                  }
                  </div>
                </div>
              </div>

                <div className="ad-panel">
                <h3>
                  <Users size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />
                  Пользователи и результаты скрининга
                </h3>

                <div className="ad-filters">
                  <div className="ad-filt">
                    <label>Дата от</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="ad-filt">
                    <label>Дата до</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>
                  <div className="ad-filt">
                    <label>Уровень риска</label>
                    <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                      <option value="all">Все</option>
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="unknown">Нет данных</option>
                    </select>
                  </div>
                  <div className="ad-filt">
                    <button
                    type="button"
                    className="ad-btn"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                      setLevelFilter('all');
                    }}>
                    
                      Сбросить
                    </button>
                  </div>
                </div>

                <div className="ad-table-wrap">
                  <table className="ad-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Имя</th>
                        <th>Дата теста</th>
                        <th>Результат</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ?
                    <tr>
                          <td colSpan={5}>
                            <div className="ad-empty">
                              {hasAnyRows && filtersActive ? 'Нет записей по выбранным фильтрам' : 'Нет данных'}
                            </div>
                          </td>
                        </tr> :

                    filteredRows.map((u) =>
                    <tr key={u.rowKey}>
                            <td style={{ fontFamily: "'Nunito', system-ui, sans-serif", fontWeight: 700 }}>{u.user_id}</td>
                            <td>{u.email}</td>
                            <td style={{ fontWeight: 700 }}>{u.name}</td>
                            <td>{u.testDate ? new Date(u.testDate).toLocaleDateString('ru') : '-'}</td>
                            <td>
                              <span
                          className="ad-badge"
                          style={{
                            color: LEVEL_STYLE[u.level]?.color,
                            background: LEVEL_STYLE[u.level]?.bg
                          }}>
                          
                                {LEVEL_LABEL[u.level]}
                                {u.percent != null && u.level !== 'unknown' ? ` · ${u.percent}%` : ''}
                              </span>
                            </td>
                          </tr>
                    )
                    }
                    </tbody>
                  </table>
                </div>
                <p className="ad-foot">В таблице - записи прохождений тестов из каталога и первичный скрининг выгорания (онбординг).</p>
              </div>
            </>
            }
          </>
        }
      </main>
    </div>);

};

export default AdminDashboard;