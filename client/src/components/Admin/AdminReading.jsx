import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import {
  ARTICLE_FILTER_OPTIONS,
  BOOK_FILTER_OPTIONS,
  READING_KIND_OPTIONS,
} from '../Practices/articlesHubData';
import './Admin.css';

function extractApiError(e) {
  if (!e?.response) {
    if (/network error/i.test(String(e?.message || ''))) {
      return 'Нет связи с сервером. Запустите backend: cd server && npm run dev.';
    }
    return e?.message || 'Не удалось сохранить';
  }
  const data = e.response.data;
  if (typeof data?.message === 'string' && data.message) return data.message;
  return `Ошибка ${e.response.status}`;
}

function normalizeUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const initialForm = () => ({
  kind: 'article',
  title: '',
  category: 'burnout',
  description_short: '',
  body_full: '',
  read_url: '',
  coverFile: null,
});

function CategoryChipGroup({ label, options, value, onChange, t }) {
  return (
    <div className="admin-film-tag-group">
      <div className="admin-film-tag-label">{label}</div>
      <div className="admin-film-tag-chips">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`admin-film-chip ${value === opt.id ? 'is-on' : ''}`}
            onClick={() => onChange(opt.id)}>
            {t(`pages.${opt.labelKey}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminReading({ embedded = false }) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coverBlobUrl, setCoverBlobUrl] = useState('');
  const errorBannerRef = useRef(null);
  const fileInputKey = useRef(0);

  const isArticle = form.kind === 'article';
  const categoryOptions = isArticle ? ARTICLE_FILTER_OPTIONS : BOOK_FILTER_OPTIONS;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/reading');
      setItems(data.items || []);
      return true;
    } catch {
      if (!silent) setItems([]);
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.coverFile) {
      setCoverBlobUrl('');
      return undefined;
    }
    const u = URL.createObjectURL(form.coverFile);
    setCoverBlobUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [form.coverFile]);

  const coverPreview = useMemo(() => {
    if (coverBlobUrl) return coverBlobUrl;
    if (editingId) {
      const row = items.find((r) => r.id === editingId);
      if (row?.coverImage) return backendPublicUrl(row.coverImage);
    }
    return '';
  }, [coverBlobUrl, editingId, items]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm());
    setError('');
    fileInputKey.current += 1;
  };

  const openCreate = (kind = 'article') => {
    setEditingId(null);
    setForm({
      ...initialForm(),
      kind,
      category: kind === 'article' ? 'burnout' : 'psychology',
    });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      kind: row.kind || 'article',
      title: row.title || '',
      category: row.category || (row.kind === 'book' ? 'psychology' : 'burnout'),
      description_short: row.descriptionShort || '',
      body_full: row.bodyFull || '',
      read_url: row.kind === 'book' ? row.readUrl || '' : row.sourceUrl || '',
      coverFile: null,
    });
    setError('');
    setModalOpen(true);
  };

  const setKind = (kind) => {
    setForm((prev) => ({
      ...prev,
      kind,
      category: kind === 'article' ? 'burnout' : 'psychology',
      body_full: kind === 'article' ? prev.body_full : '',
      read_url: kind === 'book' ? prev.read_url : '',
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const title = form.title.trim();
    if (!title) {
      setError('Укажите название.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (isArticle && !form.body_full.trim() && !editingId) {
      setError('Укажите полный текст статьи.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (!isArticle) {
      const link = normalizeUrl(form.read_url);
      if (!link) {
        setError('Укажите ссылку для чтения книги.');
        errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
    }

    const wasEdit = Boolean(editingId);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('kind', form.kind);
      fd.append('title', title);
      fd.append('category', form.category);
      fd.append('description_short', form.description_short.trim());
      if (isArticle) {
        fd.append('body_full', form.body_full.trim());
        const src = normalizeUrl(form.read_url);
        if (src) fd.append('read_url', src);
      } else {
        fd.append('read_url', normalizeUrl(form.read_url));
      }

      if (!editingId) {
        if (!form.coverFile) {
          setError('Загрузите обложку.');
          setSaving(false);
          return;
        }
        fd.append('cover', form.coverFile);
        await api.post('/reading', fd);
      } else {
        if (form.coverFile) fd.append('cover', form.coverFile);
        await api.patch(`/reading/${editingId}`, fd);
      }

      closeModal();
      const ok = await load({ silent: true });
      if (!ok) {
        setError('Сохранено, но список не обновился. Обновите страницу.');
        return;
      }
      setSuccess(wasEdit ? 'Изменения сохранены.' : 'Запись добавлена.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(extractApiError(e));
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту запись?')) return;
    try {
      await api.delete(`/reading/${id}`);
      await load({ silent: true });
    } catch (e) {
      window.alert(extractApiError(e));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Загрузка...</div>;

  return (
    <div className={embedded ? 'admin-space-section-inner' : 'admin-section fade-in'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          {embedded ? (
            <h2 className="admin-space-section-title">Статьи и книги</h2>
          ) : (
            <h1 className="page-title">Статьи и книги</h1>
          )}
          <p className="page-sub">
            Статьи читаются на сайте; книги открываются по внешней ссылке. ID: <code>article-…</code> /{' '}
            <code>book-…</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => openCreate('book')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Добавить книгу
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openCreate('article')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Добавить статью
          </button>
        </div>
      </div>

      {success ? <div className="admin-success-banner" style={{ marginTop: 12 }}>{success}</div> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, color: '#64748b' }}>
                  Пока нет записей из админки — добавьте статью или книгу.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.id}</td>
                  <td>{row.kind === 'book' ? 'Книга' : 'Статья'}</td>
                  <td>{row.title}</td>
                  <td>{row.category}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(row)}
                      style={{ marginRight: 8 }}>
                      <Edit2 size={14} />
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(row.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div
            className="modal-card admin-test-modal admin-film-modal fade-in"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingId ? 'Редактировать' : 'Новая запись'}
                {isArticle ? ' (статья)' : ' (книга)'}
              </h2>
              <button type="button" className="modal-close" onClick={closeModal} aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>

            <form
              className="admin-film-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}>
              {error ? (
                <div ref={errorBannerRef} className="admin-error-banner">
                  {error}
                </div>
              ) : null}

              {!editingId ? (
                <label className="admin-field">
                  <span>Тип контента *</span>
                  <select value={form.kind} onChange={(e) => setKind(e.target.value)}>
                    {READING_KIND_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="admin-film-filters-intro">
                  Тип: <strong>{isArticle ? 'Статья' : 'Книга'}</strong> (нельзя изменить)
                </p>
              )}

              <label className="admin-field">
                <span>Название *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>

              <CategoryChipGroup
                label={isArticle ? 'Фильтр (тема статьи)' : 'Фильтр (жанр книги)'}
                options={categoryOptions}
                value={form.category}
                onChange={(id) => setForm({ ...form, category: id })}
                t={t}
              />

              <label className="admin-field">
                <span>Обложка{editingId ? '' : ' *'}</span>
                <input
                  key={`cover-${fileInputKey.current}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  required={!editingId}
                  onChange={(e) => setForm({ ...form, coverFile: e.target.files?.[0] || null })}
                />
                {coverPreview ? <img src={coverPreview} alt="" className="admin-film-poster-preview" /> : null}
              </label>

              <label className="admin-field">
                <span>Краткое описание</span>
                <textarea
                  rows={3}
                  value={form.description_short}
                  onChange={(e) => setForm({ ...form, description_short: e.target.value })}
                />
              </label>

              {isArticle ? (
                <>
                  <label className="admin-field">
                    <span>Полный текст статьи{editingId ? '' : ' *'}</span>
                    <textarea
                      rows={12}
                      value={form.body_full}
                      onChange={(e) => setForm({ ...form, body_full: e.target.value })}
                      placeholder="Текст отображается на сайте в читалке"
                    />
                  </label>
                  <label className="admin-field">
                    <span>Ссылка на оригинал (необязательно)</span>
                    <input
                      value={form.read_url}
                      onChange={(e) => setForm({ ...form, read_url: e.target.value })}
                      placeholder="https://…"
                    />
                  </label>
                </>
              ) : (
                <label className="admin-field">
                  <span>Ссылка для чтения книги *</span>
                  <input
                    value={form.read_url}
                    onChange={(e) => setForm({ ...form, read_url: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
              )}

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
