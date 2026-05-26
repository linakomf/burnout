import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { backendPublicUrl } from '../../utils/assetUrl';
import { useLanguage } from '../../context/LanguageContext';
import {
  MEDITATION_AUDIO_SOURCE_OPTIONS,
  MEDITATION_DIFFICULTY_OPTIONS,
  MEDITATION_KIND_OPTIONS,
  MEDITATION_TOPIC_OPTIONS,
} from '../Practices/meditationHubData';
import { isVideoCoverAsset } from '../Practices/practiceMedia';
import AdminAudienceFields from './AdminAudienceFields';
import AdminModalPortal from './AdminModalPortal';
import { emptyAudienceFields } from './audienceTargeting';
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
  kind: 'meditation',
  title: '',
  topics: ['recovery'],
  description_short: '',
  duration_min: '10',
  practice_focus: '',
  difficulty_level: 'beginner',
  tip_before: '',
  audio_source: 'youtube',
  youtube_url: '',
  audio_external_url: '',
  coverFile: null,
  audioFile: null,
  ...emptyAudienceFields(),
});

function TopicChipGroup({ label, options, selectedIds, onToggle, disabledIds, t }) {
  return (
    <div className="admin-film-tag-group">
      <div className="admin-film-tag-label">{label}</div>
      <div className="admin-film-tag-chips">
        {options.map((opt) => {
          const active = selectedIds.includes(opt.id);
          const disabled = disabledIds?.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={`admin-film-chip ${active ? 'is-on' : ''}`}
              disabled={disabled}
              onClick={() => onToggle(opt.id)}>
              {t(`pages.${opt.labelKey}`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminMeditations({ embedded = false }) {
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

  const isSound = form.kind === 'sound';

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/meditations');
      setItems(data.meditations || []);
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

  const coverPreviewIsVideo = useMemo(() => {
    if (form.coverFile) return isVideoCoverAsset(form.coverFile);
    return isVideoCoverAsset(coverPreview);
  }, [form.coverFile, coverPreview]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setSuccess('');
    fileInputsKey.current += 1;
  };

  const openCreate = (kind = 'meditation') => {
    setEditingId(null);
    setForm({
      ...initialForm(),
      kind,
      topics: kind === 'sound' ? ['sounds'] : ['recovery'],
    });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    const topics = Array.isArray(row.meditationTopics) ? [...row.meditationTopics] : ['recovery'];
    let youtube_url = '';
    let audio_external_url = '';
    if (row.audioSource === 'youtube') {
      youtube_url = row.youtubeVideoId
        ? `https://www.youtube.com/watch?v=${row.youtubeVideoId}`
        : row.embedUrl || '';
    } else if (row.audioSource === 'url') {
      audio_external_url = row.audioUrl || '';
    }
    setForm({
      ...initialForm(),
      kind: row.kind || 'meditation',
      title: row.title || '',
      topics: row.kind === 'sound' ? ['sounds'] : topics.filter((x) => x !== 'sounds'),
      description_short: row.description || '',
      duration_min: String(row.durationMin || 10),
      practice_focus: row.format || row.mood || '',
      difficulty_level: row.difficultyLevel || 'beginner',
      tip_before: row.tipBefore || '',
      audio_source: row.audioSource || 'youtube',
      youtube_url,
      audio_external_url,
      coverFile: null,
      audioFile: null,
      target_role: row.target_role || 'all',
      target_gender: row.target_gender || 'all',
    });
    setError('');
    setModalOpen(true);
  };

  const toggleTopic = (id) => {
    if (isSound) return;
    setForm((prev) => {
      const arr = [...prev.topics];
      const i = arr.indexOf(id);
      if (i >= 0) {
        if (arr.length <= 1) return prev;
        arr.splice(i, 1);
      } else arr.push(id);
      return { ...prev, topics: arr };
    });
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
      fd.append('topics', JSON.stringify(isSound ? ['sounds'] : form.topics));
      fd.append('description_short', form.description_short.trim());
      fd.append('duration_min', form.duration_min.trim() || '10');
      fd.append('practice_focus', form.practice_focus.trim());
      fd.append('difficulty_level', isSound ? 'beginner' : form.difficulty_level);
      fd.append('tip_before', form.tip_before.trim());
      fd.append('target_role', form.target_role || 'all');
      fd.append('target_gender', form.target_gender || 'all');
      fd.append('audio_source', form.audio_source);
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
        if (form.audio_source === 'file') {
          if (!form.audioFile) {
            setError('Загрузите аудиофайл.');
            setSaving(false);
            return;
          }
          fd.append('audio', form.audioFile);
        }
        await api.post('/meditations', fd);
      } else {
        if (form.coverFile) fd.append('cover', form.coverFile);
        if (form.audio_source === 'file' && form.audioFile) {
          fd.append('audio', form.audioFile);
        }
        await api.patch(`/meditations/${editingId}`, fd);
      }

      closeModal();
      const ok = await load({ silent: true });
      if (!ok) {
        setError('Сохранено, но список не обновился. Обновите страницу.');
        return;
      }
      setSuccess(wasEdit ? 'Изменения сохранены.' : 'Медитация добавлена.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(extractApiError(e));
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту запись? Файлы будут удалены с сервера.')) return;
    try {
      await api.delete(`/meditations/${id}`);
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
            <h2 className="admin-space-section-title">Медитации и звуки</h2>
          ) : (
            <h1 className="page-title">Медитации и звуки</h1>
          )}
          <p className="page-sub">
            Записи появляются на странице «Медитация». Категории — из фильтров пользовательской страницы.
            ID вида <code>meditation-…</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => openCreate('sound')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Добавить звук
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openCreate('meditation')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Добавить медитацию
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
              <th>Категории</th>
              <th>Мин</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, color: '#64748b' }}>
                  Пока нет записей — добавьте медитацию или звук.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{m.id}</td>
                  <td>{m.kind === 'sound' ? 'Звук' : 'Медитация'}</td>
                  <td>{m.title}</td>
                  <td>{(m.meditationTopics || []).join(', ')}</td>
                  <td>{m.durationMin}</td>
                  <td>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(m)} style={{ marginRight: 8 }}>
                      <Edit2 size={14} />
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
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
        <AdminModalPortal>
        <div className="modal-overlay admin-modal-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeModal()}>
          <div
            className="modal-card admin-test-modal admin-film-modal fade-in"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editingId ? 'Редактировать' : 'Новая запись'}
                {isSound ? ' (звук)' : ' (медитация)'}
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
                  <span>Тип</span>
                  <select
                    value={form.kind}
                    onChange={(e) => {
                      const kind = e.target.value;
                      setForm({
                        ...form,
                        kind,
                        topics: kind === 'sound' ? ['sounds'] : form.topics.filter((x) => x !== 'sounds'),
                      });
                    }}>
                    {MEDITATION_KIND_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="admin-field">
                <span>Название *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </label>

              {!isSound ? (
                <TopicChipGroup
                  label="Категория / фокус (можно несколько)"
                  options={MEDITATION_TOPIC_OPTIONS.filter((o) => o.id !== 'sounds')}
                  selectedIds={form.topics}
                  onToggle={toggleTopic}
                  t={t}
                />
              ) : (
                <p className="admin-film-filters-intro">Звуки автоматически попадают в раздел «Звуки».</p>
              )}

              <label className="admin-field">
                <span>Обложка{editingId ? '' : ' *'}</span>
                <input
                  key={`cover-${fileInputsKey.current}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,image/*"
                  required={!editingId}
                  onChange={(e) => setForm({ ...form, coverFile: e.target.files?.[0] || null })}
                />
                {coverPreview ? (
                  coverPreviewIsVideo ? (
                    <video
                      src={coverPreview}
                      className="admin-film-poster-preview"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img src={coverPreview} alt="" className="admin-film-poster-preview" />
                  )
                ) : null}
              </label>

              <label className="admin-field">
                <span>{isSound ? 'Описание (необязательно)' : 'Краткое описание'}</span>
                <textarea
                  rows={3}
                  value={form.description_short}
                  onChange={(e) => setForm({ ...form, description_short: e.target.value })}
                />
              </label>

              <div className="admin-field-row">
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
                {!isSound ? (
                  <label className="admin-field">
                    <span>Уровень сложности</span>
                    <select
                      value={form.difficulty_level}
                      onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}>
                      {MEDITATION_DIFFICULTY_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {t(`pages.${o.labelKey}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              {!isSound ? (
                <>
                  <label className="admin-field">
                    <span>Фокус практики</span>
                    <input
                      value={form.practice_focus}
                      onChange={(e) => setForm({ ...form, practice_focus: e.target.value })}
                      placeholder="Например: дыхание, заземление"
                    />
                  </label>
                  <label className="admin-field">
                    <span>Совет перед практикой</span>
                    <textarea
                      rows={2}
                      value={form.tip_before}
                      onChange={(e) => setForm({ ...form, tip_before: e.target.value })}
                    />
                  </label>
                </>
              ) : (
                <label className="admin-field">
                  <span>Совет (необязательно)</span>
                  <textarea
                    rows={2}
                    value={form.tip_before}
                    onChange={(e) => setForm({ ...form, tip_before: e.target.value })}
                  />
                </label>
              )}

              <hr className="admin-film-hr" />
              <p className="admin-film-filters-intro">Аудио для прослушивания на сайте</p>

              <label className="admin-field">
                <span>Источник аудио *</span>
                <select
                  value={form.audio_source}
                  onChange={(e) => setForm({ ...form, audio_source: e.target.value })}>
                  {MEDITATION_AUDIO_SOURCE_OPTIONS.map((o) => (
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
                  <span>Прямая ссылка на аудио (MP3 и др.) *</span>
                  <input
                    value={form.audio_external_url}
                    onChange={(e) => setForm({ ...form, audio_external_url: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
              ) : null}

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
