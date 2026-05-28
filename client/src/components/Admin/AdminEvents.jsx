import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Edit2, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { mediaPathsToText } from '../../utils/assetUrl';
import AdminMediaPathInput from './AdminMediaPathInput';
import { useLanguage } from '../../context/LanguageContext';
import {
  EVENT_FILTER_CAT_OPTIONS,
  EVENT_KIND_OPTIONS,
  eventPriceDisplayLabel,
  EVENT_TF_DATE_OPTIONS,
  EVENT_TF_LOC_OPTIONS,
  EVENT_TF_MOOD_OPTIONS,
  EVENT_TF_TIME_OPTIONS,
} from '../Practices/eventsHubData';
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

function normalizeTicketUrl(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function linesToArray(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

const initialForm = () => ({
  kind: 'solo',
  title: '',
  filter_cat: 'other',
  category_label: '',
  price_key: '',
  tf_loc: 'almaty',
  tf_date: 'this_month',
  tf_time: 'evening',
  tf_mood: 'calm',
  location_text: 'Алматы',
  when_text: '',
  is_offline: '1',
  ticket_url: '',
  venue_line: '',
  teaser: '',
  about_text: '',
  duration_label: '',
  age_label: '',
  genre_label: '',
  refund_label: '',
  venue_pin_text: '',
  organizer_name: '',
  organizer_desc: '',
  suit_tags_text: '',
  important_notes_text: '',
  cover_url: '',
  hero_url: '',
  venue_image_url: '',
  gallery_urls: '',
  ...emptyAudienceFields(),
});

function FilterChipGroup({ label, options, value, onChange, t }) {
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
            {opt.labelKey ? t(`pages.${opt.labelKey}`) : opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminEvents({ embedded = false }) {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const errorBannerRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/events');
      setItems(data.events || []);
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

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(initialForm());
    setError('');
    setSuccess('');
  };

  const openCreate = (kind = 'solo') => {
    setEditingId(null);
    setForm({ ...initialForm(), kind });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const d = row.detail || {};
    const clock = (row.tags || []).find((tag) => tag.kind === 'clock');
    const map = (row.tags || []).find((tag) => tag.kind === 'map');
    setEditingId(row.id);
    setForm({
      ...initialForm(),
      kind: row.kind || 'solo',
      title: row.title || '',
      filter_cat: row.filterCat || 'other',
      category_label: row.categoryLabel || '',
      price_key: eventPriceDisplayLabel(row.priceKey, t) || '',
      tf_loc: row.tf?.loc || 'almaty',
      tf_date: row.tf?.date || 'this_month',
      tf_time: row.tf?.time || 'evening',
      tf_mood: row.tf?.mood || 'calm',
      location_text: map?.text || '',
      when_text: clock?.text || '',
      is_offline: (row.tags || []).some((tag) => tag.kind === 'building') ? '1' : '0',
      ticket_url: d.ticketUrl || '',
      venue_line: d.venueLine || '',
      teaser: d.teaser || '',
      about_text: d.aboutText || '',
      duration_label: d.durationLabel || '',
      age_label: d.ageLabel || '',
      genre_label: d.genreLabel || '',
      refund_label: d.refundLabel || '',
      venue_pin_text: d.venuePinText || '',
      organizer_name: d.organizerName || '',
      organizer_desc: d.organizerDesc || '',
      suit_tags_text: (d.suitTags || []).join('\n'),
      important_notes_text: (d.importantNotes || []).join('\n'),
      cover_url: row.image || '',
      hero_url: d.heroImage || '',
      venue_image_url: d.venueImage || '',
      gallery_urls: mediaPathsToText(Array.isArray(d.gallery) ? d.gallery : []),
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
    const priceLabel = form.price_key.trim();
    if (!title) {
      setError('Укажите название события.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    if (!priceLabel) {
      setError('Укажите цену (подпись на карточке).');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    const ticket = normalizeTicketUrl(form.ticket_url);
    if (!ticket) {
      setError('Укажите ссылку на билеты / регистрацию (http или https).');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    const cover_url = form.cover_url.trim();
    if (!cover_url) {
      setError('Укажите путь к обложке карточки.');
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }

    const payload = {
      kind: form.kind,
      title,
      filter_cat: form.filter_cat,
      category_label: form.category_label.trim(),
      price_key: priceLabel,
      tf_loc: form.tf_loc,
      tf_date: form.tf_date,
      tf_time: form.tf_time,
      tf_mood: form.tf_mood,
      location_text: form.location_text.trim(),
      when_text: form.when_text.trim(),
      is_offline: form.is_offline,
      ticket_url: ticket,
      venue_line: form.venue_line.trim(),
      teaser: form.teaser.trim(),
      about_text: form.about_text.trim(),
      duration_label: form.duration_label.trim(),
      age_label: form.age_label.trim(),
      genre_label: form.genre_label.trim(),
      refund_label: form.refund_label.trim(),
      venue_pin_text: form.venue_pin_text.trim(),
      organizer_name: form.organizer_name.trim(),
      organizer_desc: form.organizer_desc.trim(),
      suit_tags: linesToArray(form.suit_tags_text),
      important_notes: linesToArray(form.important_notes_text),
      target_role: form.target_role || 'all',
      target_gender: form.target_gender || 'all',
      cover_url,
      hero_url: form.hero_url.trim(),
      venue_image_url: form.venue_image_url.trim(),
      gallery_urls: form.gallery_urls.trim(),
    };

    const wasEdit = Boolean(editingId);
    setSaving(true);
    try {
      if (!editingId) {
        await api.post('/events', payload);
      } else {
        await api.patch(`/events/${editingId}`, payload);
      }

      closeModal();
      const ok = await load({ silent: true });
      if (!ok) {
        setError('Сохранено, но список не обновился. Обновите страницу.');
        return;
      }
      setSuccess(wasEdit ? 'Изменения сохранены.' : 'Событие добавлено.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(extractApiError(e));
      errorBannerRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить это событие? Изображения будут удалены с сервера.')) return;
    try {
      await api.delete(`/events/${id}`);
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
            <h2 className="admin-space-section-title">События</h2>
          ) : (
            <h1 className="page-title">События</h1>
          )}
          <p className="page-sub">
            Карточки на странице «События»: один / в компании. По клику — детали, кнопка ведёт на внешнюю ссылку.
            ID вида <code>event-…</code>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => openCreate('group')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            В компании
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openCreate('solo')}>
            <Plus size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Один
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
                  Пока нет событий из админки — добавьте «Один» или «В компании».
                </td>
              </tr>
            ) : (
              items.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{ev.id}</td>
                  <td>{ev.kind === 'group' ? 'В компании' : 'Один'}</td>
                  <td>{ev.title}</td>
                  <td>{ev.categoryLabel || ev.filterCat}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(ev)}
                      style={{ marginRight: 8 }}>
                      <Edit2 size={14} />
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(ev.id)}>
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
              <h2>
                {editingId ? 'Редактировать событие' : 'Новое событие'}
                {form.kind === 'group' ? ' (в компании)' : ' (один)'}
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
                  <span>Тип подборки</span>
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                    {EVENT_KIND_OPTIONS.map((o) => (
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

              <FilterChipGroup
                label="Категория (фильтр на странице)"
                options={EVENT_FILTER_CAT_OPTIONS}
                value={form.filter_cat}
                onChange={(id) => setForm({ ...form, filter_cat: id })}
                t={t}
              />

              <label className="admin-field">
                <span>Подпись категории на карточке (необязательно)</span>
                <input
                  value={form.category_label}
                  onChange={(e) => setForm({ ...form, category_label: e.target.value })}
                  placeholder="Например: Концерт"
                />
              </label>

              <label className="admin-field">
                <span>Цена (подпись на карточке)</span>
                <input
                  value={form.price_key}
                  onChange={(e) => setForm({ ...form, price_key: e.target.value })}
                  placeholder="Например: от 2000 ₸"
                  maxLength={80}
                />
              </label>

              <p className="admin-film-filters-intro">Фильтры панели (когда / настроение / время)</p>
              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Город</span>
                  <select value={form.tf_loc} onChange={(e) => setForm({ ...form, tf_loc: e.target.value })}>
                    {EVENT_TF_LOC_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {t(`pages.${o.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Дата</span>
                  <select value={form.tf_date} onChange={(e) => setForm({ ...form, tf_date: e.target.value })}>
                    {EVENT_TF_DATE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {t(`pages.${o.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Время суток</span>
                  <select value={form.tf_time} onChange={(e) => setForm({ ...form, tf_time: e.target.value })}>
                    {EVENT_TF_TIME_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {t(`pages.${o.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  <span>Настроение</span>
                  <select value={form.tf_mood} onChange={(e) => setForm({ ...form, tf_mood: e.target.value })}>
                    {EVENT_TF_MOOD_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {t(`pages.${o.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <hr className="admin-film-hr" />
              <p className="admin-film-filters-intro">Теги на карточке</p>
              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Локация</span>
                  <input
                    value={form.location_text}
                    onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>Когда</span>
                  <input value={form.when_text} onChange={(e) => setForm({ ...form, when_text: e.target.value })} />
                </label>
              </div>
              <label className="admin-field">
                <span>Формат</span>
                <select value={form.is_offline} onChange={(e) => setForm({ ...form, is_offline: e.target.value })}>
                  <option value="1">Офлайн</option>
                  <option value="0">Онлайн</option>
                </select>
              </label>

              <AdminMediaPathInput
                label={`Обложка карточки${editingId ? '' : ' *'}`}
                value={form.cover_url}
                onChange={(v) => setForm((f) => ({ ...f, cover_url: v }))}
                required={!editingId}
              />

              <AdminMediaPathInput
                label="Герой детальной страницы (необязательно)"
                value={form.hero_url}
                onChange={(v) => setForm((f) => ({ ...f, hero_url: v }))}
              />

              <label className="admin-field">
                <span>Ссылка на билеты / регистрацию *</span>
                <input
                  value={form.ticket_url}
                  onChange={(e) => setForm({ ...form, ticket_url: e.target.value })}
                  placeholder="https://ticketon.kz/…"
                />
              </label>

              <hr className="admin-film-hr" />
              <p className="admin-film-filters-intro">Детальная страница</p>

              <label className="admin-field">
                <span>Площадка (строка под заголовком)</span>
                <input value={form.venue_line} onChange={(e) => setForm({ ...form, venue_line: e.target.value })} />
              </label>
              <label className="admin-field">
                <span>Краткий текст</span>
                <textarea rows={2} value={form.teaser} onChange={(e) => setForm({ ...form, teaser: e.target.value })} />
              </label>
              <label className="admin-field">
                <span>О событии</span>
                <textarea rows={4} value={form.about_text} onChange={(e) => setForm({ ...form, about_text: e.target.value })} />
              </label>
              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Длительность</span>
                  <input
                    value={form.duration_label}
                    onChange={(e) => setForm({ ...form, duration_label: e.target.value })}
                    placeholder="2 ч"
                  />
                </label>
                <label className="admin-field">
                  <span>Возраст</span>
                  <input value={form.age_label} onChange={(e) => setForm({ ...form, age_label: e.target.value })} />
                </label>
              </div>
              <div className="admin-field-row">
                <label className="admin-field">
                  <span>Жанр / тип</span>
                  <input value={form.genre_label} onChange={(e) => setForm({ ...form, genre_label: e.target.value })} />
                </label>
                <label className="admin-field">
                  <span>Возврат билетов</span>
                  <input value={form.refund_label} onChange={(e) => setForm({ ...form, refund_label: e.target.value })} />
                </label>
              </div>
              <AdminMediaPathInput
                label="Фото площадки"
                value={form.venue_image_url}
                onChange={(v) => setForm((f) => ({ ...f, venue_image_url: v }))}
              />
              <label className="admin-field">
                <span>Подпись на фото площадки</span>
                <input
                  value={form.venue_pin_text}
                  onChange={(e) => setForm({ ...form, venue_pin_text: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Галерея (до 4 путей, по одному на строку или через запятую)</span>
                <textarea
                  rows={4}
                  value={form.gallery_urls}
                  onChange={(e) => setForm({ ...form, gallery_urls: e.target.value })}
                  placeholder="/uploads/event-1.jpg"
                />
              </label>
              <label className="admin-field">
                <span>Организатор</span>
                <input
                  value={form.organizer_name}
                  onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Об организаторе</span>
                <textarea
                  rows={2}
                  value={form.organizer_desc}
                  onChange={(e) => setForm({ ...form, organizer_desc: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Кому подойдёт (каждая строка — пункт)</span>
                <textarea
                  rows={3}
                  value={form.suit_tags_text}
                  onChange={(e) => setForm({ ...form, suit_tags_text: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Важно знать (каждая строка — пункт)</span>
                <textarea
                  rows={3}
                  value={form.important_notes_text}
                  onChange={(e) => setForm({ ...form, important_notes_text: e.target.value })}
                />
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
