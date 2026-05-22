import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, User } from 'lucide-react';
import api from '../../utils/api';
import {
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  BURNOUT_LEVEL_LABELS,
  contactHref,
  whatsappHref
} from './psychConstants';
import './Psychologist.css';
import '../Admin/Admin.css';

const STATUS_OPTIONS = Object.keys(REQUEST_STATUS_LABELS);

export default function PsychologistDashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusDraft, setStatusDraft] = useState('new');
  const [noteDraft, setNoteDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/psychologists/me/requests');
      setRows(data.rows || []);
      setStats(data.stats_by_status || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Не удалось загрузить обращения');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = async (requestId) => {
    setSelectedId(requestId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/psychologists/me/requests/${requestId}`);
      setDetail(data);
      setStatusDraft(data.status || 'new');
      setNoteDraft('');
    } catch (e) {
      setError(e?.response?.data?.message || 'Не удалось открыть обращение');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.patch(`/psychologists/me/requests/${selectedId}`, {
        status: statusDraft,
        note: noteDraft.trim() || undefined
      });
      setNoteDraft('');
      await loadList();
      await openDetail(selectedId);
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s.n]));

  return (
    <div className="psych-section fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">Кабинет психолога</h1>
          <p className="page-sub">Обращения «Мы рядом», назначенные вам</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/psychologist/profile')}>
          <User size={16} /> Профиль
        </button>
      </div>

      <div className="psych-stat-row">
        {STATUS_OPTIONS.map((st) => (
          <span key={st} className="psych-stat-pill">
            {REQUEST_STATUS_LABELS[st]}: {statMap[st] ?? 0}
          </span>
        ))}
      </div>

      {error ? <div className="admin-support-overview-error">{error}</div> : null}
      {loading ? <p style={{ padding: 24, textAlign: 'center' }}>Загрузка…</p> : null}
      {!loading && rows.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <MessageCircle size={32} className="admin-stat-icon" style={{ marginBottom: 12 }} />
          <p>Нет назначенных обращений. Администратор назначит заявки после подтверждения вашего аккаунта.</p>
        </div>
      ) : null}

      <div className="psych-requests-grid">
        {rows.map((r) => (
          <div
            key={r.request_id}
            className="card psych-request-card"
            role="button"
            tabIndex={0}
            onClick={() => openDetail(r.request_id)}
            onKeyDown={(e) => e.key === 'Enter' && openDetail(r.request_id)}
          >
            <div className="psych-request-top">
              <div>
                <div style={{ fontWeight: 700 }}>{r.display_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                  {ROLE_LABELS[r.account_role] || r.account_role} · {new Date(r.created_at).toLocaleString('ru')}
                </div>
              </div>
              <span className={`psych-status-badge psych-status-badge--${r.status}`}>
                {REQUEST_STATUS_LABELS[r.status] || r.status}
              </span>
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-light)' }}>
              {String(r.message || '').slice(0, 120)}
              {r.message?.length > 120 ? '…' : ''}
            </p>
          </div>
        ))}
      </div>

      {selectedId && (
        <div className="modal-overlay" onClick={() => setSelectedId(null)}>
          <div className="modal-card psych-detail-modal fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Обращение #{selectedId}</h2>
              <button type="button" className="modal-close" onClick={() => setSelectedId(null)}>
                <X size={18} />
              </button>
            </div>

            {detailLoading || !detail ? (
              <p style={{ padding: 16 }}>Загрузка…</p>
            ) : (
              <>
                <div className="psych-detail-section">
                  <div className="psych-detail-k">Пользователь</div>
                  <div>
                    <strong>{detail.display_name}</strong> ({ROLE_LABELS[detail.account_role]})
                  </div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    Аккаунт: {detail.account_email}
                    {detail.account_name ? ` · ${detail.account_name}` : ''}
                  </div>
                </div>

                <div className="psych-detail-section">
                  <div className="psych-detail-k">Контакт для связи</div>
                  <a href={contactHref(detail.contact)}>{detail.contact}</a>
                  <div className="psych-contact-actions">
                    <a className="btn btn-secondary btn-sm" href={contactHref(detail.contact)}>
                      Email / телефон
                    </a>
                    {whatsappHref(detail.contact) ? (
                      <a
                        className="btn btn-primary btn-sm"
                        href={whatsappHref(detail.contact)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="psych-detail-section">
                  <div className="psych-detail-k">Сообщение</div>
                  <p>{detail.message}</p>
                </div>

                <div className="psych-detail-section admin-support-overview-burnout">
                  <div className="admin-support-overview-burn-card">
                    <div className="admin-support-overview-burn-h">Онбординг</div>
                    {detail.onboarding?.completed ? (
                      <span className="admin-support-badge">
                        {BURNOUT_LEVEL_LABELS[detail.onboarding.level]}
                        {detail.onboarding.percent != null ? ` · ${detail.onboarding.percent}%` : ''}
                      </span>
                    ) : (
                      <p className="admin-support-overview-muted sm">Не пройден</p>
                    )}
                  </div>
                  <div className="admin-support-overview-burn-card">
                    <div className="admin-support-overview-burn-h">Последний тест</div>
                    {detail.catalog_burnout_test ? (
                      <span className="admin-support-badge">
                        {detail.catalog_burnout_test.test_title}:{' '}
                        {BURNOUT_LEVEL_LABELS[detail.catalog_burnout_test.level]}
                      </span>
                    ) : (
                      <p className="admin-support-overview-muted sm">Нет данных</p>
                    )}
                  </div>
                </div>

                {detail.recent_checkins?.length > 0 ? (
                  <div className="psych-detail-section">
                    <div className="psych-detail-k">Последние чек-ины</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                      {detail.recent_checkins.map((c) => (
                        <li key={c.result_id}>
                          {new Date(c.created_at).toLocaleDateString('ru')} — {BURNOUT_LEVEL_LABELS[c.level]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {detail.test_history?.length > 0 ? (
                  <div className="psych-detail-section">
                    <div className="psych-detail-k">История тестов</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                      {detail.test_history.slice(0, 6).map((t) => (
                        <li key={t.result_id}>
                          {t.test_title} — {new Date(t.created_at).toLocaleDateString('ru')} —{' '}
                          {BURNOUT_LEVEL_LABELS[t.level]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="psych-detail-section">
                  <div className="psych-detail-k">Статус обращения</div>
                  <select className="input" value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {REQUEST_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="psych-detail-section">
                  <div className="psych-detail-k">Внутренняя заметка (не видна пользователю)</div>
                  <textarea
                    className="input"
                    rows={3}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Связался в WhatsApp, договорились о созвоне…"
                  />
                  {detail.notes?.length > 0 ? (
                    <ul className="psych-notes-list">
                      {detail.notes.map((n) => (
                        <li key={n.note_id} className="psych-note-item">
                          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
                            {new Date(n.created_at).toLocaleString('ru')}
                          </div>
                          {n.body}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setSelectedId(null)}>
                    Закрыть
                  </button>
                  <button type="button" className="btn btn-primary" onClick={saveDetail} disabled={saving}>
                    {saving ? 'Сохранение…' : 'Сохранить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
