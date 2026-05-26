import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import { FILM_CATEGORIES, FILM_PSYCH_TAG_IDS } from '../Practices/filmsCatalogData';
import {
  FILMS_FILTER_ATMOS_OPTIONS,
  FILMS_FILTER_GENRE_OPTIONS,
  FILMS_FILTER_MOOD_OPTIONS,
  FILMS_FILTER_TYPE_OPTIONS,
} from '../Practices/filmsHubFilters';
import AdminAudienceFields from './AdminAudienceFields';
import AdminModalPortal from './AdminModalPortal';
import { emptyAudienceFields } from './audienceTargeting';
import './Admin.css';

const emptyTags = () => ({
  mood: [],
  genre: [],
  type: [],
  atmosphere: [],
});

function FilterChipGroup({ label, options, selectedIds, onToggle, t }) {
  const opts = options.filter((o) => o.id != null);
  return (
    <div className="admin-film-tag-group">
      <div className="admin-film-tag-label">{label}</div>
      <div className="admin-film-tag-chips">
        {opts.map((opt) => {
          const id = opt.id;
          const active = selectedIds.includes(id);
          return (
            <button
              key={String(id)}
              type="button"
              className={`admin-film-chip ${active ? 'is-on' : ''}`}
              onClick={() => onToggle(id)}>
              {t(`pages.${opt.labelKey}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function normalizeWatchUrlInput(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractApiError(e) {
  if (!e?.response) {
    if (e?.code === 'ECONNABORTED') return 'Превышено время ожидания. Проверьте размер файлов и интернет.';
    if (/network error/i.test(String(e?.message || ''))) {
      return 'Нет связи с сервером. Запустите backend: cd server && npm run dev (порт 5000).';
    }
    return e?.message || 'Не удалось сохранить фильм';
  }
  const data = e.response.data;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data === 'string' && data) return data;
  return `Ошибка ${e.response.status}`;
}

const initialForm = () => ({
  title: '',
  description_short: '',
  description_full: '',
  watch_url: '',
  source: '',
  duration: '',
  year: '',
  rating: '',
  category_id: 'burnout',
  psych_tag: 'light',
  genres_display: '',
  embed_url: '',
  director: '',
  screenwriter: '',
  country: '',
  quote: '',
  tags: emptyTags(),
  posterFile: null,
  galleryFiles: [],
  galleryKeepUrls: [],
  ...emptyAudienceFields(),
});

const initialCollectionForm = () => ({
  title: '',
  description: '',
  filmIds: [],
  coverFile: null,
  sort_order: '0',
});

export default function AdminFilms({ embedded = false }) {
  const { t } = useLanguage();
  const [films, setFilms] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hubError, setHubError] = useState('');
  const [posterBlobUrl, setPosterBlobUrl] = useState('');
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionEditSlug, setCollectionEditSlug] = useState(null);
  const [collectionForm, setCollectionForm] = useState(initialCollectionForm);
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [collectionCoverBlob, setCollectionCoverBlob] = useState('');
  const errorBannerRef = useRef(null);
  const posterInputKeyRef = useRef(0);
  const collectionFileKeyRef = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [filmsRes, collectionsRes] = await Promise.all([
        api.get('/films'),
        api.get('/films/collections'),
      ]);
      setFilms(filmsRes.data?.films || []);
      setCollections(collectionsRes.data?.collections || []);
      return true;
    } catch (e) {
      if (!silent) {
        setFilms([]);
        setCollections([]);
      }
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.posterFile) {
      setPosterBlobUrl('');
      return undefined;
    }
    const u = URL.createObjectURL(form.posterFile);
    setPosterBlobUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [form.posterFile]);

  useEffect(() => {
    if (!collectionForm.coverFile) {
      setCollectionCoverBlob('');
      return undefined;
    }
    const u = URL.createObjectURL(collectionForm.coverFile);
    setCollectionCoverBlob(u);
    return () => URL.revokeObjectURL(u);
  }, [collectionForm.coverFile]);

  const posterPreview = useMemo(() => {
    if (posterBlobUrl) return posterBlobUrl;
    if (editingId) {
      const film = films.find((f) => f.id === editingId);
      if (film?.poster) return backendPublicUrl(film.poster);
    }
    return '';
  }, [posterBlobUrl, editingId, films]);

  const collectionCoverPreview = useMemo(() => {
    if (collectionCoverBlob) return collectionCoverBlob;
    if (collectionEditSlug) {
      const collection = collections.find((item) => item.slug === collectionEditSlug);
      if (collection?.image) return backendPublicUrl(collection.image);
    }
    return '';
  }, [collectionCoverBlob, collectionEditSlug, collections]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setSuccess('');
    posterInputKeyRef.current += 1;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setSuccess('');
    posterInputKeyRef.current += 1;
    setModalOpen(true);
  };

  const openEdit = (film) => {
    setEditingId(film.id);
    const tags = film.tags && typeof film.tags === 'object' ? film.tags : {};
    setForm({
      ...initialForm(),
      title: film.title || '',
      description_short: film.description || '',
      description_full: film.descriptionFull || '',
      watch_url: film.watchUrl || '',
      source: film.source || '',
      duration: film.duration || '',
      year: film.year || '',
      rating: film.rating || '',
      category_id: film.categoryId || 'burnout',
      psych_tag: film.psychTag || 'light',
      genres_display: film.genres || '',
      embed_url: film.embedUrl || '',
      director: film.director || '',
      screenwriter: film.screenwriter || '',
      country: film.country || '',
      quote: film.quote || '',
      tags: {
        mood: [...(tags.mood || [])],
        genre: [...(tags.genre || [])],
        type: [...(tags.type || [])],
        atmosphere: [...(tags.atmosphere || [])],
      },
      posterFile: null,
      galleryFiles: [],
      galleryKeepUrls: [...(film.gallery || [])],
      target_role: film.target_role || 'all',
      target_gender: film.target_gender || 'all',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const closeCollectionModal = () => {
    setCollectionModalOpen(false);
    setCollectionEditSlug(null);
    setCollectionForm(initialCollectionForm());
    setHubError('');
    collectionFileKeyRef.current += 1;
  };

  const openCreateCollection = () => {
    setCollectionEditSlug(null);
    setCollectionForm({
      ...initialCollectionForm(),
      sort_order: String(collections.length),
    });
    setHubError('');
    setCollectionModalOpen(true);
  };

  const openEditCollection = (collection) => {
    setCollectionEditSlug(collection.slug);
    setCollectionForm({
      title: collection.title || '',
      description: collection.description || '',
      filmIds: [...(collection.filmIds || [])],
      coverFile: null,
      sort_order: String(collection.sort_order ?? 0),
    });
    setHubError('');
    setCollectionModalOpen(true);
  };

  const toggleCollectionFilm = (filmId) => {
    setCollectionForm((prev) => {
      const has = prev.filmIds.includes(filmId);
      return {
        ...prev,
        filmIds: has ? prev.filmIds.filter((id) => id !== filmId) : [...prev.filmIds, filmId],
      };
    });
  };

  const toggleTag = (dimension, id) => {
    setForm((prev) => {
      const arr = [...(prev.tags[dimension] || [])];
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(id);
      return {
        ...prev,
        tags: { ...prev.tags, [dimension]: arr },
      };
    });
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const title = form.title.trim();
    const watchUrl = normalizeWatchUrlInput(form.watch_url);
    if (!title) {
      setError('Укажите название фильма.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (!watchUrl) {
      setError('Укажите ссылку на просмотр.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    const wasEdit = Boolean(editingId);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description_short', form.description_short.trim());
      fd.append('description_full', form.description_full.trim());
      fd.append('watch_url', watchUrl);
      fd.append('tags', JSON.stringify(form.tags));
      fd.append('category_id', form.category_id);
      fd.append('psych_tag', form.psych_tag);
      fd.append('genres_display', form.genres_display.trim());
      fd.append('source', form.source.trim());
      fd.append('duration', form.duration.trim());
      fd.append('year', form.year.trim());
      fd.append('rating', form.rating.trim());
      fd.append('embed_url', form.embed_url.trim());
      fd.append('director', form.director.trim());
      fd.append('screenwriter', form.screenwriter.trim());
      fd.append('country', form.country.trim());
      fd.append('quote', form.quote.trim());
      fd.append('target_role', form.target_role || 'all');
      fd.append('target_gender', form.target_gender || 'all');

      if (!editingId) {
        if (!form.posterFile) {
          setError('Выберите главное изображение (постер).');
          setSaving(false);
          return;
        }
        fd.append('poster', form.posterFile);
        for (const g of form.galleryFiles.slice(0, 6)) {
          fd.append('gallery', g);
        }
        await api.post('/films', fd);
      } else {
        const kept = [...form.galleryKeepUrls];
        fd.append('keep_gallery_urls', JSON.stringify(kept));
        if (form.posterFile) fd.append('poster', form.posterFile);
        const slotsLeft = Math.max(0, 6 - kept.length);
        for (const g of form.galleryFiles.slice(0, slotsLeft)) {
          fd.append('gallery', g);
        }
        await api.patch(`/films/${editingId}`, fd);
      }

      closeModal();
      const ok = await load({ silent: true });
      if (!ok) {
        setSuccess('');
        setError('Фильм сохранён, но список не обновился. Обновите страницу.');
        return;
      }
      setSuccess(wasEdit ? 'Изменения сохранены.' : 'Фильм добавлен в каталог.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      const msg = extractApiError(e);
      setError(
        e?.response?.status === 404
          ? 'API фильмов недоступен (404). Перезапустите backend: cd server && npm run dev.'
          : msg
      );
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const saveCollectionModal = async () => {
    const title = collectionForm.title.trim();
    const description = collectionForm.description.trim();
    if (!title) {
      setHubError('Укажите название подборки.');
      return;
    }
    if (!collectionEditSlug && !collectionForm.coverFile) {
      setHubError('Загрузите изображение подборки.');
      return;
    }
    if (collectionForm.filmIds.length === 0) {
      setHubError('Выберите хотя бы один фильм для подборки.');
      return;
    }

    setCollectionSaving(true);
    setHubError('');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('sort_order', collectionForm.sort_order || '0');
      fd.append('film_ids', JSON.stringify(collectionForm.filmIds));
      if (collectionForm.coverFile) fd.append('cover', collectionForm.coverFile);

      if (collectionEditSlug) {
        await api.patch(`/films/collections/${collectionEditSlug}`, fd);
      } else {
        await api.post('/films/collections', fd);
      }

      closeCollectionModal();
      await load({ silent: true });
      setSuccess(collectionEditSlug ? 'Подборка обновлена.' : 'Подборка создана.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setHubError(extractApiError(e));
    } finally {
      setCollectionSaving(false);
    }
  };

  const deleteCollection = async (slug) => {
    if (!window.confirm('Удалить эту подборку?')) return;
    setHubError('');
    try {
      await api.delete(`/films/collections/${slug}`);
      await load({ silent: true });
    } catch (e) {
      setHubError(extractApiError(e));
    }
  };

  const handleDelete = async (filmKey) => {
    if (!window.confirm('Удалить этот фильм? Изображения будут удалены с сервера.')) return;
    try {
      await api.delete(`/films/${filmKey}`);
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.message || e?.message || 'Ошибка удаления');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Загрузка...</div>;

  return (
    <div className={embedded ? 'admin-space-section-inner' : 'admin-section fade-in'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          {embedded ? (
            <h2 className="admin-space-section-title">Фильмы (каталог)</h2>
          ) : (
            <h1 className="page-title">Фильмы (каталог)</h1>
          )}
          <p className="page-sub">
            Фильмы из базы показываются на странице «Фильмы» вместе с встроенным каталогом. ID вида{' '}
            <code>film-…</code> используется в ссылке на карточку.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={openCreateCollection}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Создать подборку
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Добавить фильм
          </button>
        </div>
      </div>

      {success ? (
        <div className="admin-success-banner" style={{ marginTop: 12 }}>
          {success}
        </div>
      ) : null}
      {hubError ? <div className="admin-error-banner" style={{ marginTop: 12 }}>{hubError}</div> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="admin-space-section-title" style={{ marginBottom: 8 }}>
          Подборки страницы «Фильмы»
        </h3>
        <p className="admin-film-filters-intro" style={{ marginTop: 0 }}>
          Для карточки подборки достаточно добавить название, описание, изображение и отметить фильмы из списка ниже.
        </p>

        {collections.length === 0 ? (
          <p style={{ marginTop: 16, color: '#64748b' }}>Подборок пока нет — нажмите «Создать подборку».</p>
        ) : (
          <table className="admin-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Фильмов</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.slug}>
                  <td>
                    <strong>{collection.title}</strong>
                  </td>
                  <td>{collection.description || '—'}</td>
                  <td>{collection.filmIds?.length ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 8 }}
                      onClick={() => openEditCollection(collection)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteCollection(collection.slug)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Год</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {films.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 24, color: '#64748b' }}>
                  Пока нет фильмов в базе — добавьте первый.
                </td>
              </tr>
            ) : (
              films.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{f.id}</td>
                  <td>{f.title}</td>
                  <td>{f.year || '—'}</td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(f)} style={{ marginRight: 8 }}>
                      <Edit2 size={14} />
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {collectionModalOpen ? (
        <AdminModalPortal>
          <div
            className="modal-overlay admin-modal-overlay"
            role="presentation"
            onMouseDown={(e) => e.target === e.currentTarget && closeCollectionModal()}
          >
            <div
              className="modal-card admin-test-modal admin-film-modal fade-in"
              role="dialog"
              aria-modal="true"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{collectionEditSlug ? 'Редактировать подборку' : 'Новая подборка'}</h2>
                <button type="button" className="modal-close" onClick={closeCollectionModal} aria-label="Закрыть">
                  <X size={18} />
                </button>
              </div>

              <form
                className="admin-film-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveCollectionModal();
                }}
              >
                {hubError ? <div className="admin-error-banner">{hubError}</div> : null}

                <label className="admin-field">
                  <span>Название подборки *</span>
                  <input
                    value={collectionForm.title}
                    onChange={(e) => setCollectionForm({ ...collectionForm, title: e.target.value })}
                    placeholder="Например: Мягкий вечер"
                  />
                </label>

                <label className="admin-field">
                  <span>Описание подборки</span>
                  <textarea
                    rows={4}
                    value={collectionForm.description}
                    onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                    placeholder="Коротко опишите настроение и смысл подборки"
                  />
                </label>

                <label className="admin-field">
                  <span>Изображение карточки{collectionEditSlug ? '' : ' *'}</span>
                  <input
                    key={`film-collection-cover-${collectionFileKeyRef.current}`}
                    type="file"
                    accept="image/*"
                    required={!collectionEditSlug}
                    onChange={(e) =>
                      setCollectionForm({ ...collectionForm, coverFile: e.target.files?.[0] || null })
                    }
                  />
                  {collectionCoverPreview ? (
                    <img src={collectionCoverPreview} alt="" className="admin-film-poster-preview" />
                  ) : null}
                </label>

                <div className="admin-film-tag-group">
                  <div className="admin-film-tag-label">
                    Фильмы в подборке ({collectionForm.filmIds.length})
                  </div>
                  {films.length === 0 ? (
                    <p className="admin-film-filters-intro">Сначала добавьте фильмы в каталог ниже.</p>
                  ) : (
                    <div
                      style={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      {films.map((film) => {
                        const checked = collectionForm.filmIds.includes(film.id);
                        return (
                          <label
                            key={film.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: checked ? 'rgba(106, 138, 214, 0.12)' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCollectionFilm(film.id)}
                            />
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ display: 'block', fontSize: 14 }}>{film.title}</strong>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                {film.year || 'Без года'} · {film.categoryId || '—'}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCollectionModal}
                    disabled={collectionSaving}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={collectionSaving}>
                    {collectionSaving ? 'Сохранение…' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AdminModalPortal>
      ) : null}

      {modalOpen ? (
        <AdminModalPortal>
        <div className="modal-overlay admin-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div
            className="modal-card admin-test-modal admin-film-modal fade-in"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Редактировать фильм' : 'Новый фильм'}</h2>
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

              <label className="admin-field">
                <span>Название *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>

              <label className="admin-field">
                <span>Краткое описание</span>
                <textarea rows={3} value={form.description_short} onChange={(e) => setForm({ ...form, description_short: e.target.value })} />
              </label>

              <label className="admin-field">
                <span>Полное описание</span>
                <textarea rows={6} value={form.description_full} onChange={(e) => setForm({ ...form, description_full: e.target.value })} />
              </label>

              <label className="admin-field">
                <span>Ссылка на просмотр (http/https) *</span>
                <input value={form.watch_url} onChange={(e) => setForm({ ...form, watch_url: e.target.value })} placeholder="https://…" />
              </label>

              <label className="admin-field">
                <span>Главное фото (постер){editingId ? '' : ' *'}</span>
                <input
                  key={`poster-input-${posterInputKeyRef.current}-${editingId || 'new'}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                  required={!editingId}
                  onChange={(e) => setForm({ ...form, posterFile: e.target.files?.[0] || null })}
                />
                {posterPreview ? (
                  <img src={posterPreview} alt="" className="admin-film-poster-preview" />
                ) : null}
              </label>

              <div className="admin-field">
                <span>Галерея (до 6 файлов; при редактировании добавляются к сохранённым слотам)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setForm({ ...form, galleryFiles: Array.from(e.target.files || []).slice(0, 6) })}
                />
                {editingId && form.galleryKeepUrls.length > 0 ? (
                  <ul className="admin-film-gallery-kept">
                    {form.galleryKeepUrls.map((url) => (
                      <li key={url}>
                        <img src={backendPublicUrl(url)} alt="" />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              galleryKeepUrls: prev.galleryKeepUrls.filter((u) => u !== url),
                            }))
                          }>
                          Убрать
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Категория</span>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    {FILM_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {t(`pages.${c.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Психологический тег</span>
                  <select value={form.psych_tag} onChange={(e) => setForm({ ...form, psych_tag: e.target.value })}>
                    {FILM_PSYCH_TAG_IDS.map((id) => (
                      <option key={id} value={id}>
                        {t(`pages.filmPsych_${id}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="admin-field">
                <span>Строка жанров для карточки (например «Драма · Комедия»)</span>
                <input value={form.genres_display} onChange={(e) => setForm({ ...form, genres_display: e.target.value })} />
              </label>

              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Источник / студия</span>
                  <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                </label>
                <label className="admin-field">
                  <span>Год</span>
                  <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </label>
                <label className="admin-field">
                  <span>Рейтинг</span>
                  <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                </label>
                <label className="admin-field">
                  <span>Длительность</span>
                  <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="1:45:00" />
                </label>
              </div>

              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Режиссёр</span>
                  <input value={form.director} onChange={(e) => setForm({ ...form, director: e.target.value })} />
                </label>
                <label className="admin-field">
                  <span>Сценарий</span>
                  <input value={form.screenwriter} onChange={(e) => setForm({ ...form, screenwriter: e.target.value })} />
                </label>
              </div>

              <label className="admin-field">
                <span>Страна</span>
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </label>

              <label className="admin-field">
                <span>Цитата (необязательно)</span>
                <textarea rows={2} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
              </label>

              <label className="admin-field">
                <span>Встраиваемое видео URL (опционально)</span>
                <input value={form.embed_url} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} placeholder="https://…" />
              </label>

              <hr className="admin-film-hr" />
              <p className="admin-film-filters-intro">Фильтры как на странице «Фильмы» — можно не заполнять.</p>

              <FilterChipGroup
                label={t('pages.filmsFilterPillMood')}
                options={FILMS_FILTER_MOOD_OPTIONS}
                selectedIds={form.tags.mood}
                onToggle={(id) => toggleTag('mood', id)}
                t={t}
              />
              <FilterChipGroup
                label={t('pages.filmsFilterPillGenre')}
                options={FILMS_FILTER_GENRE_OPTIONS}
                selectedIds={form.tags.genre}
                onToggle={(id) => toggleTag('genre', id)}
                t={t}
              />
              <FilterChipGroup
                label={t('pages.filmsFilterPillType')}
                options={FILMS_FILTER_TYPE_OPTIONS}
                selectedIds={form.tags.type}
                onToggle={(id) => toggleTag('type', id)}
                t={t}
              />
              <FilterChipGroup
                label={t('pages.filmsFilterPillAtmos')}
                options={FILMS_FILTER_ATMOS_OPTIONS}
                selectedIds={form.tags.atmosphere}
                onToggle={(id) => toggleTag('atmosphere', id)}
                t={t}
              />

              <AdminAudienceFields
                value={{ target_role: form.target_role, target_gender: form.target_gender }}
                onChange={(aud) => setForm((prev) => ({ ...prev, ...aud }))}
              />

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
        </AdminModalPortal>
      ) : null}
    </div>
  );
}
