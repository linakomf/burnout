import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tag, BookOpen, Plus, Trash2, Edit2, X, Save, BarChart3 } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

// ─── Admin Users ───────────────────────────────────────────────────────────────
export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadUsers = () => {
    setLoading(true);
    setError('');
    api
      .get('/users/all')
      .then((r) => setUsers(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Не удалось загрузить пользователей'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.user_id !== id));
      setNotice('Пользователь удалён');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось удалить пользователя');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Загрузка...</div>;

  return (
    <div className="admin-section fade-in">
      <h1 className="page-title">Пользователи</h1>
      <p className="page-sub">{users.length} зарегистрировано</p>
      {error ? (
        <div className="admin-inline-error">
          {error} <button className="btn btn-ghost btn-sm" onClick={loadUsers}>Повторить</button>
        </div>
      ) : null}
      {notice ? <div className="admin-inline-ok">{notice}</div> : null}

      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Имя</th><th>Email</th><th>Роль</th><th>Возраст</th><th>Дата</th><th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td>
                  <div className="table-user">
                    <div className="table-avatar">{u.name?.charAt(0)}</div>
                    {u.name}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-chip role-${u.role}`}>
                    {u.role === 'student' ? 'Студент' : u.role === 'teacher' ? 'Преподаватель' : 'Админ'}
                  </span>
                </td>
                <td>{u.age || '—'}</td>
                <td>{new Date(u.created_at).toLocaleDateString('ru')}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(u.user_id)}
                    disabled={u.role === 'admin'}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Admin Categories ──────────────────────────────────────────────────────────
export const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', target_role: 'all' });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  const handleSave = async () => {
    if (editing) {
      const res = await api.put(`/categories/${editing.category_id}`, form);
      setCategories(categories.map(c => c.category_id === editing.category_id ? res.data : c));
    } else {
      const res = await api.post('/categories', form);
      setCategories([...categories, res.data]);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', description: '', target_role: 'all' });
  };

  const handleEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, target_role: cat.target_role });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить категорию?')) return;
    await api.delete(`/categories/${id}`);
    setCategories(categories.filter(c => c.category_id !== id));
  };

  const TARGET_LABELS = { all: 'Для всех', student: 'Студенты', teacher: 'Преподаватели' };

  return (
    <div className="admin-section fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">Категории</h1>
          <p className="page-sub">Управление категориями тестов</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={16} /> Добавить
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(cat => (
          <div key={cat.category_id} className="card cat-card">
            <div className="cat-card-header">
              <Tag size={20} className="cat-icon" />
              <div className="cat-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(cat)}><Edit2 size={14} /></button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.category_id)}><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="cat-name">{cat.name}</h3>
            <p className="cat-desc">{cat.description}</p>
            <span className="cat-target">{TARGET_LABELS[cat.target_role]}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Редактировать' : 'Новая категория'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Название</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Описание</label>
              <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Для кого</label>
              <select className="input" value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})}>
                <option value="all">Для всех</option>
                <option value="student">Студенты</option>
                <option value="teacher">Преподаватели</option>
              </select>
            </div>
            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DEFAULT_OPTIONS = ['', '', '', '', ''];

const emptyTestForm = () => ({
  title: '',
  description: '',
  category_id: '',
  scoring_type: 'likert_sum',
  questions: [],
});

// ─── Admin Tests ───────────────────────────────────────────────────────────────
export const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(emptyTestForm);

  const refreshTests = () =>
    api.get('/tests').then((r) => setTests(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([api.get('/tests'), api.get('/categories')])
      .then(([t, c]) => {
        setTests(t.data);
        setCategories(c.data);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyTestForm());
    setLoadError('');
    setShowModal(true);
  };

  const mapQuestionsFromApi = (rows) =>
    (rows || []).map((q) => {
      let opts = q.options;
      if (typeof opts === 'string') {
        try {
          opts = JSON.parse(opts);
        } catch {
          opts = [];
        }
      }
      const arr = Array.isArray(opts) ? opts.map(String) : [];
      const padded = [...arr, ...DEFAULT_OPTIONS].slice(0, 5);
      return { question_text: q.question_text || '', options: padded };
    });

  const openEdit = async (testRow) => {
    setLoadError('');
    setEditingId(testRow.test_id);
    setForm(emptyTestForm());
    setEditLoading(true);
    setShowModal(true);
    try {
      const { data } = await api.get(`/tests/${testRow.test_id}`);
      setForm({
        title: data.title || '',
        description: data.description || '',
        category_id: data.category_id != null ? String(data.category_id) : '',
        scoring_type: data.scoring_type || 'likert_sum',
        questions:
          data.questions && data.questions.length > 0
            ? mapQuestionsFromApi(data.questions)
            : [{ question_text: '', options: [...DEFAULT_OPTIONS] }],
      });
    } catch {
      setLoadError('Не удалось загрузить тест');
      setForm(emptyTestForm());
    } finally {
      setEditLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyTestForm());
    setLoadError('');
    setEditLoading(false);
  };

  const addQuestion = () => {
    setForm((f) => ({
      ...f,
      questions: [...f.questions, { question_text: '', options: [...DEFAULT_OPTIONS] }],
    }));
  };

  const removeQuestion = (qi) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== qi),
    }));
  };

  const updateQuestion = (i, field, val) => {
    const qs = [...form.questions];
    qs[i] = { ...qs[i], [field]: val };
    setForm((f) => ({ ...f, questions: qs }));
  };

  const updateOption = (qi, oi, val) => {
    const qs = [...form.questions];
    const opts = [...qs[qi].options];
    opts[oi] = val;
    qs[qi] = { ...qs[qi], options: opts };
    setForm((f) => ({ ...f, questions: qs }));
  };

  const handleSave = async () => {
    setLoadError('');
    if (!form.category_id) {
      setLoadError('Выберите категорию');
      return;
    }
    if (!form.title.trim()) {
      setLoadError('Укажите название теста');
      return;
    }
    if (form.questions.length === 0) {
      setLoadError('Добавьте хотя бы один вопрос');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category_id: form.category_id,
      scoring_type: form.scoring_type || 'likert_sum',
      questions: form.questions.map((q) => ({
        question_text: q.question_text,
        options: q.options,
      })),
    };

    setSaving(true);
    try {
      if (editingId != null) {
        await api.put(`/tests/${editingId}`, payload);
      } else {
        await api.post('/tests', payload);
      }
      await refreshTests();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Не удалось сохранить';
      setLoadError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить тест?')) return;
    await api.delete(`/tests/${id}`);
    setTests(tests.filter((t) => t.test_id !== id));
  };

  const SCORING_LABELS = {
    likert_sum: 'Общая шкала (сумма выбранных вариантов)',
    gad7: 'GAD-7 (4 варианта 0–3)',
    mbi_student: 'Выгорание MBI-студент (5 вариантов 0–4)',
    daily5: 'Ежедневный чек-ин (5 вариантов 0–4)',
  };

  return (
    <div className="admin-section fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">Тесты</h1>
          <p className="page-sub">Создание и редактирование тестов — изменения сразу видны пользователям в разделе «Тесты»</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Создать тест
        </button>
      </div>

      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Категория</th>
              <th>Вопросов</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.test_id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td>{t.category_name}</td>
                <td>{t.question_count != null ? t.question_count : '—'}</td>
                <td>{new Date(t.created_at).toLocaleDateString('ru')}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEdit(t)}
                    title="Редактировать"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(t.test_id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card admin-test-modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId != null ? 'Редактировать тест' : 'Создать тест'}</h2>
              <button type="button" className="modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            {loadError && (
              <p className="admin-form-error" style={{ marginTop: 12, color: 'var(--danger, #c44)' }}>
                {loadError}
              </p>
            )}

            {editLoading && (
              <p style={{ marginTop: 12, opacity: 0.8 }}>Загрузка теста…</p>
            )}

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Название теста</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={editLoading}
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Описание</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={editLoading}
              />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Категория</label>
              <select
                className="input"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                disabled={editLoading}
              >
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Тип подсчёта результата</label>
              <select
                className="input"
                value={form.scoring_type}
                onChange={(e) => setForm({ ...form, scoring_type: e.target.value })}
                disabled={editLoading}
              >
                {Object.entries(SCORING_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="questions-section">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Вопросы ({form.questions.length})</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addQuestion}
                  disabled={editLoading}
                >
                  <Plus size={14} /> Добавить вопрос
                </button>
              </div>

              {form.questions.map((q, qi) => (
                <div key={qi} className="question-builder">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <label style={{ margin: 0 }}>Вопрос {qi + 1}</label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeQuestion(qi)}
                      title="Удалить вопрос"
                      disabled={editLoading}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    className="input"
                    placeholder="Текст вопроса"
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qi, 'question_text', e.target.value)}
                    style={{ marginBottom: 10 }}
                    disabled={editLoading}
                  />
                  <div className="options-builder">
                    {q.options.map((opt, oi) => (
                      <input
                        key={oi}
                        className="input"
                        placeholder={`Вариант ${oi + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        disabled={editLoading}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving || editLoading}>
                Отмена
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || editLoading}
              >
                <Save size={14} /> {saving ? 'Сохранение…' : editingId != null ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Admin Overview ────────────────────────────────────────────────────────────
export const AdminOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, tests: 0, categories: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/users/all'), api.get('/tests'), api.get('/categories')])
      .then(([u, t, c]) => setStats({ users: u.data.length, tests: t.data.length, categories: c.data.length }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAnalyticsLoading(true);
    setAnalyticsError('');
    api
      .get('/users/with-results')
      .then((r) => {
        if (!cancelled) setAnalytics(r.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setAnalytics(null);
        setAnalyticsError(err.response?.data?.message || 'Не удалось загрузить аналитику');
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentRows = useMemo(() => (analytics?.rows || []).slice(0, 8), [analytics]);
  const dist = analytics?.burnoutDistribution || { low: 0, medium: 0, high: 0, unknown: 0 };

  return (
    <div className="admin-section fade-in">
      <h1 className="page-title">Панель администратора</h1>
      <p className="page-sub">Обзор системы</p>

      <div className="admin-overview-grid">
        <div className="card admin-stat-card" onClick={() => navigate('/admin/users')}>
          <Users size={28} className="admin-stat-icon" />
          <div className="admin-stat-val">{stats.users}</div>
          <div className="admin-stat-label">Пользователей</div>
        </div>
        <div className="card admin-stat-card" onClick={() => navigate('/admin/tests')}>
          <BookOpen size={28} className="admin-stat-icon" />
          <div className="admin-stat-val">{stats.tests}</div>
          <div className="admin-stat-label">Тестов</div>
        </div>
        <div className="card admin-stat-card" onClick={() => navigate('/admin/categories')}>
          <Tag size={28} className="admin-stat-icon" />
          <div className="admin-stat-val">{stats.categories}</div>
          <div className="admin-stat-label">Категорий</div>
        </div>
      </div>

      <div className="card admin-analytics-card">
        <div className="admin-analytics-head">
          <div>
            <h2 className="admin-analytics-title">
              <BarChart3 size={18} /> Аналитика скринингов
            </h2>
            <p className="admin-analytics-sub">Реальные данные пользователей и результатов тестов</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin-dashboard')}>
            Полный дашборд
          </button>
        </div>

        {analyticsLoading ? (
          <div className="admin-analytics-empty">Загрузка аналитики…</div>
        ) : analyticsError ? (
          <div className="admin-analytics-error">{analyticsError}</div>
        ) : !analytics || (analytics.rows || []).length === 0 ? (
          <div className="admin-analytics-empty">Нет данных</div>
        ) : (
          <>
            <div className="admin-kpi-row">
              <div className="admin-kpi-box">
                <div className="k">Пользователей платформы</div>
                <div className="v">{analytics.kpis?.totalUsers ?? 0}</div>
              </div>
              <div className="admin-kpi-box">
                <div className="k">Прохождения сегодня</div>
                <div className="v">{analytics.kpis?.testsToday ?? 0}</div>
              </div>
              <div className="admin-kpi-box">
                <div className="k">Прохождения за 7 дней</div>
                <div className="v">{analytics.kpis?.testsWeek ?? 0}</div>
              </div>
              <div className="admin-kpi-box">
                <div className="k">Новых за 7 дней</div>
                <div className="v">{analytics.kpis?.newUsersWeek ?? 0}</div>
              </div>
            </div>

            <div className="admin-risk-row">
              <span className="risk-chip risk-low">Низкий: {dist.low ?? 0}</span>
              <span className="risk-chip risk-medium">Средний: {dist.medium ?? 0}</span>
              <span className="risk-chip risk-high">Высокий: {dist.high ?? 0}</span>
              <span className="risk-chip risk-unknown">Нет данных: {dist.unknown ?? 0}</span>
            </div>

            <div className="admin-mini-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Имя</th>
                    <th>Дата</th>
                    <th>Риск</th>
                    <th>Процент</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((r) => (
                    <tr key={r.rowKey}>
                      <td>{r.user_id}</td>
                      <td>{r.email}</td>
                      <td>{r.name}</td>
                      <td>{r.testDate ? new Date(r.testDate).toLocaleDateString('ru') : '—'}</td>
                      <td>{r.level || 'unknown'}</td>
                      <td>{r.percent != null ? `${r.percent}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
