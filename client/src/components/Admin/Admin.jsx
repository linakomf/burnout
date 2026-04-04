import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tag, BookOpen, Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import api from '../../utils/api';
import './Admin.css';

// ─── Admin Users ───────────────────────────────────────────────────────────────
export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/all').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    await api.delete(`/users/${id}`);
    setUsers(users.filter(u => u.user_id !== id));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Загрузка...</div>;

  return (
    <div className="admin-section fade-in">
      <h1 className="page-title">Пользователи</h1>
      <p className="page-sub">{users.length} зарегистрировано</p>

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

// ─── Admin Tests ───────────────────────────────────────────────────────────────
export const AdminTests = () => {
  const [tests, setTests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category_id: '', questions: [] });

  useEffect(() => {
    Promise.all([api.get('/tests'), api.get('/categories')])
      .then(([t, c]) => { setTests(t.data); setCategories(c.data); });
  }, []);

  const addQuestion = () => {
    setForm(f => ({
      ...f,
      questions: [...f.questions, { question_text: '', options: ['','','','',''] }]
    }));
  };

  const updateQuestion = (i, field, val) => {
    const qs = [...form.questions];
    qs[i] = { ...qs[i], [field]: val };
    setForm(f => ({ ...f, questions: qs }));
  };

  const updateOption = (qi, oi, val) => {
    const qs = [...form.questions];
    const opts = [...qs[qi].options];
    opts[oi] = val;
    qs[qi] = { ...qs[qi], options: opts };
    setForm(f => ({ ...f, questions: qs }));
  };

  const handleSave = async () => {
    await api.post('/tests', form);
    const res = await api.get('/tests');
    setTests(res.data);
    setShowModal(false);
    setForm({ title: '', description: '', category_id: '', questions: [] });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить тест?')) return;
    await api.delete(`/tests/${id}`);
    setTests(tests.filter(t => t.test_id !== id));
  };

  return (
    <div className="admin-section fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">Тесты</h1>
          <p className="page-sub">Управление содержимым тестов</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Создать тест
        </button>
      </div>

      <div className="card">
        <table className="admin-table">
          <thead>
            <tr><th>Название</th><th>Категория</th><th>Дата</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.test_id}>
                <td style={{ fontWeight: 600 }}>{t.title}</td>
                <td>{t.category_name}</td>
                <td>{new Date(t.created_at).toLocaleDateString('ru')}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.test_id)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card admin-test-modal fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Создать тест</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Название теста</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Описание</label>
              <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Категория</label>
              <select className="input" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>

            <div className="questions-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>Вопросы ({form.questions.length})</h3>
                <button className="btn btn-secondary btn-sm" onClick={addQuestion}><Plus size={14} /> Добавить вопрос</button>
              </div>

              {form.questions.map((q, qi) => (
                <div key={qi} className="question-builder">
                  <label>Вопрос {qi + 1}</label>
                  <input
                    className="input"
                    placeholder="Текст вопроса"
                    value={q.question_text}
                    onChange={e => updateQuestion(qi, 'question_text', e.target.value)}
                    style={{ marginBottom: 10 }}
                  />
                  <div className="options-builder">
                    {q.options.map((opt, oi) => (
                      <input
                        key={oi}
                        className="input"
                        placeholder={`Вариант ${oi + 1}`}
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Создать</button>
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

  useEffect(() => {
    Promise.all([api.get('/users/all'), api.get('/tests'), api.get('/categories')])
      .then(([u, t, c]) => setStats({ users: u.data.length, tests: t.data.length, categories: c.data.length }))
      .catch(() => {});
  }, []);

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
    </div>
  );
};
