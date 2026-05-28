import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import AdminMediaPathInput from './AdminMediaPathInput';
import { useLanguage } from '../../context/LanguageContext';
import {
  MUSIC_AUDIO_SOURCE_OPTIONS,
  MUSIC_FILTER_GENRE_OPTIONS,
  MUSIC_FILTER_MOOD_OPTIONS,
  MUSIC_GENRE_OPTIONS,
  MUSIC_MOOD_OPTIONS,
} from '../Practices/musicHubData';
import AdminAudienceFields from './AdminAudienceFields';
import AdminModalPortal from './AdminModalPortal';
import { emptyAudienceFields } from './audienceTargeting';
import './Admin.css';

const MAX_TRACK_DURATION_MIN = 1440;

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

const initialForm = () => ({
  title: '',
  artist: '',
  mood: 'calm_down',
  genre_label: '',
  duration_min: '3',
  audio_source: 'youtube',
  youtube_url: '',
  audio_external_url: '',
  cover_url: '',
  audio_file_url: '',
  is_featured_pick: false,
  ...emptyAudienceFields(),
});

function labelForMoodId(moodId, t) {
  const opt = MUSIC_FILTER_MOOD_OPTIONS.find((o) => o.id === moodId);
  return opt ? t(`pages.${opt.labelKey}`) : moodId || '—';
}

function labelForGenreId(genreId, t) {
  const opt = MUSIC_FILTER_GENRE_OPTIONS.find((o) => o.id === genreId);
  return opt ? t(`pages.${opt.labelKey}`) : genreId || '—';
}

function ChipGroup({ label, options, value, onChange, t, useLocale }) {
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
            {useLocale && opt.labelKey ? t(`pages.${opt.labelKey}`) : opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminMusic({ embedded = false }) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collections, setCollections] = useState([]);
  const [featuredPickId, setFeaturedPickId] = useState('');
  const [hubError, setHubError] = useState('');
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionEditSlug, setCollectionEditSlug] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    title: '',
    trackIds: [],
    cover_url: '',
    sort_order: '0',
  });
  const [collectionSaving, setCollectionSaving] = useState(false);
  const errorBannerRef = useRef(null);

  const trackItems = items.filter((r) => r.kind === 'track');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/music/hub');
      setItems(data.items || []);
      setCollections(data.collections || []);
      setFeaturedPickId(data.featuredTrackId || '');
      return true;
    } catch {
      if (!silent) {
        setItems([]);
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

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm());
    setError('');
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...initialForm(), mood: 'calm_down' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    let youtube_url = '';
    let audio_external_url = '';
    if (row.audioSource === 'youtube') {
      youtube_url = row.youtubeVideoId
        ? `https://www.youtube.com/watch?v=${row.youtubeVideoId}`
        : row.embedUrl || '';
    } else if (row.audioSource === 'url') {
      audio_external_url = row.audioUrl || '';
    }
    setEditingId(row.id);
    setForm({
      title: row.title || '',
      artist: row.artist || '',
      mood: row.mood || 'calm_down',
      genre_label: row.genreLabel || '',
      duration_min: String(row.durationMin || 3),
      is_featured_pick: Boolean(row.isFeaturedPick),
      audio_source: row.audioSource || 'youtube',
      youtube_url,
      audio_external_url,
      cover_url: row.coverImage || '',
      audio_file_url: row.audioSource === 'file' ? row.audioUrl || '' : '',
      target_role: row.target_role || 'all',
      target_gender: row.target_gender || 'all',
    });
    setError('');
    setModalOpen(true);
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

    const cover_url = form.cover_url.trim();
    if (!cover_url) {
      setError('Укажите путь к обложке.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    const payload = {
      kind: 'track',
      title,
      mood: form.mood,
      genre_label: form.genre_label.trim(),
      duration_min: form.duration_min.trim() || '3',
      audio_source: form.audio_source,
      artist: form.artist.trim(),
      target_role: form.target_role || 'all',
      target_gender: form.target_gender || 'all',
      is_featured_pick: form.is_featured_pick,
      cover_url,
    };

    if (form.audio_source === 'youtube') {
      payload.youtube_url = form.youtube_url.trim();
    }
    if (form.audio_source === 'url') {
      const u = form.audio_external_url.trim();
      payload.audio_external_url = /^https?:\/\//i.test(u) ? u : u ? `https://${u}` : '';
    }
    if (form.audio_source === 'file') {
      const audioPath = form.audio_file_url.trim();
      if (!audioPath && !editingId) {
        setError('Укажите путь к аудиофайлу.');
        errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      if (audioPath) payload.audio_file_url = audioPath;
    }

    const wasEdit = Boolean(editingId);
    setSaving(true);
    try {
      if (!editingId) {
        await api.post('/music', payload);
      } else {
        await api.patch(`/music/${editingId}`, payload);
      }

      closeModal();
      const ok = await load({ silent: true });
      if (!ok) {
        setError('Сохранено, но список не обновился. Обновите страницу.');
        return;
      }
      setSuccess(wasEdit ? 'Трек обновлён.' : 'Трек добавлен.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(extractApiError(e));
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const closeCollectionModal = () => {
    setCollectionModalOpen(false);
    setCollectionEditSlug(null);
    setCollectionForm({ title: '', trackIds: [], cover_url: '', sort_order: '0' });
  };

  const openCreateCollection = () => {
    setCollectionEditSlug(null);
    setCollectionForm({ title: '', trackIds: [], cover_url: '', sort_order: String(collections.length) });
    setHubError('');
    setCollectionModalOpen(true);
  };

  const openEditCollection = (col) => {
    setCollectionEditSlug(col.slug);
    setCollectionForm({
      title: col.title || '',
      trackIds: [...(col.trackIds || [])],
      cover_url: col.image || '',
      sort_order: String(col.sort_order ?? 0),
    });
    setHubError('');
    setCollectionModalOpen(true);
  };

  const toggleCollectionTrack = (trackId) => {
    setCollectionForm((prev) => {
      const has = prev.trackIds.includes(trackId);
      return {
        ...prev,
        trackIds: has ? prev.trackIds.filter((x) => x !== trackId) : [...prev.trackIds, trackId],
      };
    });
  };

  const saveCollectionModal = async () => {
    const title = collectionForm.title.trim();
    if (!title) {
      setHubError('Укажите название подборки.');
      return;
    }
    setCollectionSaving(true);
    setHubError('');
    try {
      const payload = {
        title,
        sort_order: collectionForm.sort_order || '0',
        track_ids: collectionForm.trackIds,
        cover_url: collectionForm.cover_url.trim(),
      };
      if (collectionEditSlug) {
        await api.patch(`/music/collections/${collectionEditSlug}`, payload);
      } else {
        await api.post('/music/collections', payload);
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
      await api.delete(`/music/collections/${slug}`);
      await load({ silent: true });
    } catch (e) {
      setHubError(extractApiError(e));
    }
  };

  const setFeaturedPick = async (trackId) => {
    setFeaturedPickId(trackId);
    if (!trackId) return;
    setHubError('');
    try {
      await api.patch(`/music/${trackId}`, { is_featured_pick: true });
      await load({ silent: true });
    } catch (e) {
      setHubError(extractApiError(e));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту запись?')) return;
    try {
      await api.delete(`/music/${id}`);
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
            <h2 className="admin-space-section-title">Музыка</h2>
          ) : (
            <h1 className="page-title">Музыка</h1>
          )}
          <p className="page-sub">
            Создавайте подборки с любым названием и назначайте в них треки из списка ниже. На сайте в блоке
            «Подборки» появятся ваши карточки.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={openCreateCollection}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Создать подборку
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Добавить трек
          </button>
        </div>
      </div>

      {success ? <div className="admin-success-banner" style={{ marginTop: 12 }}>{success}</div> : null}
      {hubError ? <div className="admin-error-banner" style={{ marginTop: 12 }}>{hubError}</div> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <h3 className="admin-space-section-title" style={{ marginBottom: 8 }}>
          Витрина страницы «Музыка»
        </h3>
        <p className="admin-film-filters-intro" style={{ marginTop: 0 }}>
          Создайте подборку, придумайте название, загрузите обложку и отметьте треки из списка ниже.
        </p>

        <label className="admin-field" style={{ maxWidth: 420, marginTop: 12 }}>
          <span>Подборка дня</span>
          <select value={featuredPickId} onChange={(e) => setFeaturedPick(e.target.value)}>
            <option value="">— не выбрано —</option>
            {trackItems.map((tr) => (
              <option key={tr.id} value={tr.id}>
                {tr.title}
                {tr.isFeaturedPick ? ' ★' : ''}
              </option>
            ))}
          </select>
        </label>

        {collections.length === 0 ? (
          <p style={{ marginTop: 16, color: '#64748b' }}>Подборок пока нет — нажмите «Создать подборку».</p>
        ) : (
          <table className="admin-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Название</th>
                <th>Треков</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.slug}>
                  <td>
                    <strong>{col.title || col.slug}</strong>
                  </td>
                  <td>{col.tracksCount ?? col.trackIds?.length ?? 0}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 8 }}
                      onClick={() => openEditCollection(col)}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteCollection(col.slug)}
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
              <th>Настроение</th>
              <th>Жанр</th>
              <th>Подборка дня</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {trackItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, color: '#64748b' }}>
                  Пока нет треков — нажмите «Добавить трек».
                </td>
              </tr>
            ) : (
              trackItems.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.id}</td>
                  <td>{row.title}</td>
                  <td>{labelForMoodId(row.mood, t)}</td>
                  <td>{labelForGenreId(row.genreLabel, t)}</td>
                  <td>{row.isFeaturedPick ? 'Да' : '—'}</td>
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
                <label className="admin-field">
                  <span>Название подборки *</span>
                  <input
                    value={collectionForm.title}
                    onChange={(e) => setCollectionForm({ ...collectionForm, title: e.target.value })}
                    placeholder="Например: Спокойный вечер"
                  />
                </label>
                <AdminMediaPathInput
                  label="Обложка карточки"
                  value={collectionForm.cover_url}
                  onChange={(v) => setCollectionForm((f) => ({ ...f, cover_url: v }))}
                />
                <div className="admin-film-tag-group">
                  <div className="admin-film-tag-label">
                    Треки в подборке ({collectionForm.trackIds.length})
                  </div>
                  {trackItems.length === 0 ? (
                    <p className="admin-film-filters-intro">Сначала добавьте треки в таблицу ниже.</p>
                  ) : (
                    <div
                      className="admin-music-track-pick-list"
                      style={{
                        maxHeight: 280,
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: 8,
                      }}
                    >
                      {trackItems.map((tr) => {
                        const on = collectionForm.trackIds.includes(tr.id);
                        return (
                          <label
                            key={tr.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 10px',
                              borderRadius: 10,
                              background: on ? 'rgba(106, 138, 214, 0.12)' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleCollectionTrack(tr.id)}
                            />
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ display: 'block', fontSize: 14 }}>{tr.title}</strong>
                              <span style={{ fontSize: 12, color: '#64748b' }}>
                                {labelForMoodId(tr.mood, t)} · {labelForGenreId(tr.genreLabel, t)}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button type="button" className="btn btn-secondary" onClick={closeCollectionModal} disabled={collectionSaving}>
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
        <div
          className="modal-overlay admin-modal-overlay"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div
            className="modal-card admin-test-modal admin-film-modal fade-in"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Редактировать трек' : 'Новый трек'}</h2>
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
                <span>Исполнитель / подпись</span>
                <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
              </label>

              <ChipGroup
                label="Настроение"
                options={MUSIC_MOOD_OPTIONS}
                value={form.mood}
                onChange={(id) => setForm({ ...form, mood: id })}
                t={t}
                useLocale
              />

              <ChipGroup
                label="Жанр"
                options={MUSIC_GENRE_OPTIONS}
                value={form.genre_label}
                onChange={(id) => setForm({ ...form, genre_label: id })}
                t={t}
                useLocale
              />

              <AdminMediaPathInput
                label={`Обложка${editingId ? '' : ' *'}`}
                value={form.cover_url}
                onChange={(v) => setForm((f) => ({ ...f, cover_url: v }))}
                required={!editingId}
              />

              <label className="admin-field">
                <span>Длительность (мин) *</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_TRACK_DURATION_MIN}
                  value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                />
              </label>

              <hr className="admin-film-hr" />
              <p className="admin-film-filters-intro">Аудио для воспроизведения на сайте</p>

              <label className="admin-field">
                <span>Источник аудио *</span>
                <select
                  value={form.audio_source}
                  onChange={(e) => setForm({ ...form, audio_source: e.target.value })}>
                  {MUSIC_AUDIO_SOURCE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              {form.audio_source === 'file' ? (
                <AdminMediaPathInput
                  label={`Аудиофайл${editingId ? ' (оставьте пустым, чтобы не менять)' : ' *'}`}
                  value={form.audio_file_url}
                  onChange={(v) => setForm((f) => ({ ...f, audio_file_url: v }))}
                  required={!editingId}
                  hint="Например: /uploads/track.mp3"
                />
              ) : null}

              {form.audio_source === 'youtube' ? (
                <label className="admin-field">
                  <span>Ссылка YouTube *</span>
                  <input
                    value={form.youtube_url}
                    onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                </label>
              ) : null}

              {form.audio_source === 'url' ? (
                <label className="admin-field">
                  <span>Прямая ссылка на аудио *</span>
                  <input
                    value={form.audio_external_url}
                    onChange={(e) => setForm({ ...form, audio_external_url: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
              ) : null}

              <label className="admin-field admin-field--checkbox">
                <input
                  type="checkbox"
                  checked={form.is_featured_pick}
                  onChange={(e) => setForm({ ...form, is_featured_pick: e.target.checked })}
                />
                <span>Подборка дня на странице «Музыка»</span>
              </label>

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
