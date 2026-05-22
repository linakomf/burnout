import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import {
  MUSIC_AUDIO_SOURCE_OPTIONS,
  MUSIC_KIND_OPTIONS,
  MUSIC_MOOD_OPTIONS,
  MUSIC_QUICK_ICON_OPTIONS,
} from '../Practices/musicHubData';
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

const initialForm = () => ({
  kind: 'track',
  title: '',
  artist: '',
  mood: 'calm',
  genre_label: '',
  description_short: '',
  duration_min: '3',
  icon_name: 'CloudRain',
  audio_source: 'youtube',
  youtube_url: '',
  audio_external_url: '',
  coverFile: null,
  audioFile: null,
});

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
  const [coverBlobUrl, setCoverBlobUrl] = useState('');
  const errorBannerRef = useRef(null);
  const fileInputsKey = useRef(0);

  const isTrack = form.kind === 'track';

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/music');
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
      const row = items.find((m) => m.id === editingId);
      if (row?.coverImage) return backendPublicUrl(row.coverImage);
    }
    return '';
  }, [coverBlobUrl, editingId, items]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm());
    setError('');
    fileInputsKey.current += 1;
  };

  const openCreate = (kind = 'track') => {
    setEditingId(null);
    setForm({ ...initialForm(), kind, mood: 'calm', icon_name: 'CloudRain' });
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
      kind: row.kind || 'track',
      title: row.title || '',
      artist: row.artist || '',
      mood: row.mood || 'calm',
      genre_label: row.genreLabel || '',
      description_short: row.descriptionShort || '',
      duration_min: String(row.durationMin || 3),
      icon_name: row.icon || 'Music2',
      audio_source: row.audioSource || 'youtube',
      youtube_url,
      audio_external_url,
      coverFile: null,
      audioFile: null,
    });
    setError('');
    setModalOpen(true);
  };

  const setKind = (kind) => {
    setForm((prev) => ({ ...prev, kind }));
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

    const wasEdit = Boolean(editingId);
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('kind', form.kind);
      fd.append('title', title);
      fd.append('mood', form.mood);
      fd.append('genre_label', form.genre_label.trim());
      fd.append('description_short', form.description_short.trim());
      fd.append('duration_min', form.duration_min.trim() || '3');
      fd.append('audio_source', form.audio_source);
      if (isTrack) fd.append('artist', form.artist.trim());
      if (!isTrack) fd.append('icon_name', form.icon_name);

      if (form.audio_source === 'youtube') {
        fd.append('youtube_url', form.youtube_url.trim());
      }
      if (form.audio_source === 'url') {
        const u = form.audio_external_url.trim();
        const withProto = /^https?:\/\//i.test(u) ? u : u ? `https://${u}` : '';
        fd.append('audio_external_url', withProto);
      }

      if (!editingId) {
        if (!form.coverFile) {
          setError('Загрузите обложку.');
          setSaving(false);
          return;
        }
        fd.append('cover', form.coverFile);
        if (form.audio_source === 'file' && !form.audioFile) {
          setError('Загрузите аудиофайл.');
          setSaving(false);
          return;
        }
        if (form.audio_source === 'file') fd.append('audio', form.audioFile);
        await api.post('/music', fd);
      } else {
        if (form.coverFile) fd.append('cover', form.coverFile);
        if (form.audio_source === 'file' && form.audioFile) fd.append('audio', form.audioFile);
        await api.patch(`/music/${editingId}`, fd);
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
            Треки и быстрые звуки на странице «Музыка». Воспроизведение на сайте: файл, YouTube или ссылка.
            ID: <code>music-…</code> / <code>music-quick-…</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => openCreate('quick')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Быстрый звук
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openCreate('track')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Трек
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
              <th>Настроение</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, color: '#64748b' }}>
                  Пока нет записей — добавьте трек или быстрый звук.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.id}</td>
                  <td>{row.kind === 'quick' ? 'Быстрый звук' : 'Трек'}</td>
                  <td>{row.title}</td>
                  <td>{row.mood}</td>
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
                {isTrack ? ' (трек)' : ' (быстрый звук)'}
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
                  <span>Тип *</span>
                  <select value={form.kind} onChange={(e) => setKind(e.target.value)}>
                    {MUSIC_KIND_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="admin-film-filters-intro">
                  Тип: <strong>{isTrack ? 'Трек' : 'Быстрый звук'}</strong>
                </p>
              )}

              <label className="admin-field">
                <span>Название *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>

              {isTrack ? (
                <label className="admin-field">
                  <span>Исполнитель / подпись</span>
                  <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
                </label>
              ) : (
                <label className="admin-field">
                  <span>Иконка кнопки</span>
                  <select
                    value={form.icon_name}
                    onChange={(e) => setForm({ ...form, icon_name: e.target.value })}>
                    {MUSIC_QUICK_ICON_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <ChipGroup
                label="Настроение (фильтр подборок)"
                options={MUSIC_MOOD_OPTIONS}
                value={form.mood}
                onChange={(id) => setForm({ ...form, mood: id })}
                t={t}
                useLocale
              />

              {isTrack ? (
                <label className="admin-field">
                  <span>Жанр (текст на карточке)</span>
                  <input
                    value={form.genre_label}
                    onChange={(e) => setForm({ ...form, genre_label: e.target.value })}
                    placeholder="Эмбиент, природа…"
                  />
                </label>
              ) : null}

              <label className="admin-field">
                <span>Обложка{editingId ? '' : ' *'}</span>
                <input
                  key={`cover-${fileInputsKey.current}`}
                  type="file"
                  accept="image/*"
                  required={!editingId}
                  onChange={(e) => setForm({ ...form, coverFile: e.target.files?.[0] || null })}
                />
                {coverPreview ? <img src={coverPreview} alt="" className="admin-film-poster-preview" /> : null}
              </label>

              <label className="admin-field">
                <span>Краткое описание</span>
                <textarea
                  rows={2}
                  value={form.description_short}
                  onChange={(e) => setForm({ ...form, description_short: e.target.value })}
                />
              </label>

              <label className="admin-field">
                <span>Длительность (мин) *</span>
                <input
                  type="number"
                  min={1}
                  max={180}
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
                <label className="admin-field">
                  <span>Аудиофайл{editingId ? ' (оставьте пустым, чтобы не менять)' : ' *'}</span>
                  <input
                    key={`audio-${fileInputsKey.current}`}
                    type="file"
                    accept="audio/*,.mp3,.m4a,.wav,.ogg"
                    onChange={(e) => setForm({ ...form, audioFile: e.target.files?.[0] || null })}
                  />
                </label>
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
