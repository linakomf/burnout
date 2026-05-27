import React, { useCallback, useEffect, useState } from 'react';
import { Plus, UserCheck, UserX, ShieldBan, Trash2, Link2, X } from 'lucide-react';
import api from '../../utils/api';
import {
  ACCOUNT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  contactHref
} from '../Psychologist/psychConstants';
import AdminModalPortal from './AdminModalPortal';
import { SupportVerificationBadges } from '../Support/SupportVerificationBadges';
import './Admin.css';
import '../Psychologist/Psychologist.css';

export default function AdminPsychologists() {
  const [tab, setTab] = useState('psychologists');
  const [psychologists, setPsychologists] = useState([]);
  const [requests, setRequests] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    work_phone: '',
    organization: '',
    specialist_level: ''
  });
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteSaving, setInviteSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r, o] = await Promise.all([
        api.get('/psychologists'),
        api.get('/psychologists/support-requests/all'),
        api.get('/psychologists/stats/overview')
      ]);
      setPsychologists(p.data.psychologists || []);
      setRequests(r.data.rows || []);
      setOverview(o.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setPsychStatus = async (userId, status) => {
    if (status === 'rejected' && !window.confirm('Отклонить психолога?')) return;
    if (status === 'blocked' && !window.confirm('Заблокировать психолога?')) return;
    try {
      await api.patch(`/psychologists/${userId}/status`, { status });
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Ошибка');
    }
  };

  const deletePsych = async (userId) => {
    if (!window.confirm('Удалить психолога безвозвратно?')) return;
    try {
      await api.delete(`/psychologists/${userId}`);
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Ошибка');
    }
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    setInviteSaving(true);
    setInviteResult(null);
    try {
      const { data } = await api.post('/psychologists/invitations', inviteForm);
      setInviteResult(data);
      setInviteForm({ name: '', email: '', work_phone: '', organization: '', specialist_level: '' });
      await load();
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Не удалось отправить приглашение');
    } finally {
      setInviteSaving(false);
    }
  };

  const assignRequest = async (requestId, psychologistId, prevValue) => {
    const nextVal = psychologistId != null && psychologistId !== '' ? String(psychologistId) : '';
    if (String(prevValue ?? '') === nextVal) return;
    try {
      await api.patch(`/psychologists/support-requests/${requestId}/assign`, {
        psychologist_id: psychologistId != null && psychologistId !== '' ? psychologistId : null
      });
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Ошибка назначения');
      await load();
    }
  };

  const approvedPsychs = psychologists.filter((p) => p.account_status === 'approved');
  const reqStats = Object.fromEntries((overview?.requests_by_status || []).map((s) => [s.status, s.n]));

  return (
    <div className="admin-section fade-in">
      <div className="section-header">
        <div>
          <h1 className="page-title">Психологи</h1>
          <p className="page-sub">Приглашения, модерация и назначение обращений «Мы рядом»</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => { setInviteOpen(true); setInviteResult(null); }}>
          <Plus size={16} /> Пригласить психолога
        </button>
      </div>

      <div className="psych-stat-row">
        <span className="psych-stat-pill">Новых обращений: {reqStats.new ?? 0}</span>
        <span className="psych-stat-pill">В процессе: {(reqStats.in_progress ?? 0) + (reqStats.contacted ?? 0)}</span>
        <span className="psych-stat-pill">Завершено: {reqStats.completed ?? 0}</span>
      </div>

      <nav className="psych-admin-tabs">
        <button type="button" className={`psych-admin-tab ${tab === 'psychologists' ? 'is-active' : ''}`} onClick={() => setTab('psychologists')}>
          Список психологов
        </button>
        <button type="button" className={`psych-admin-tab ${tab === 'requests' ? 'is-active' : ''}`} onClick={() => setTab('requests')}>
          Обращения и назначения
        </button>
      </nav>

      {loading ? <p style={{ padding: 24 }}>Загрузка…</p> : null}

      {!loading && tab === 'psychologists' ? (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Статус</th>
                <th>Организация</th>
                <th>Уровень</th>
                <th>Обращений</th>
                <th>Документы</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {psychologists.map((p) => (
                <tr key={p.user_id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.email}</td>
                  <td>
                    <span className={`role-chip role-${p.account_status === 'approved' ? 'student' : 'teacher'}`}>
                      {ACCOUNT_STATUS_LABELS[p.account_status] || p.account_status}
                    </span>
                  </td>
                  <td>{p.organization || '—'}</td>
                  <td>{p.specialist_level || '—'}</td>
                  <td>{p.assigned_count ?? 0} ({p.active_requests ?? 0} акт.)</td>
                  <td>{p.documents_count ?? 0}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.account_status === 'pending_review' ? (
                        <>
                          <button type="button" className="btn btn-primary btn-sm" title="Подтвердить" onClick={() => setPsychStatus(p.user_id, 'approved')}>
                            <UserCheck size={14} />
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" title="Отклонить" onClick={() => setPsychStatus(p.user_id, 'rejected')}>
                            <UserX size={14} />
                          </button>
                        </>
                      ) : null}
                      {p.account_status === 'approved' ? (
                        <button type="button" className="btn btn-ghost btn-sm" title="Заблокировать" onClick={() => setPsychStatus(p.user_id, 'blocked')}>
                          <ShieldBan size={14} />
                        </button>
                      ) : null}
                      <button type="button" className="btn btn-danger btn-sm" title="Удалить" onClick={() => deletePsych(p.user_id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {psychologists.length === 0 ? <p style={{ padding: 16 }}>Психологов пока нет</p> : null}
        </div>
      ) : null}

      {!loading && tab === 'requests' ? (
        <ul className="admin-support-overview-list">
          {requests.map((r) => (
            <li key={r.request_id} className="admin-support-overview-item">
              <div className="admin-support-overview-item-top">
                <span className="admin-support-overview-date">
                  {new Date(r.created_at).toLocaleString('ru')}
                </span>
                <span className={`psych-status-badge psych-status-badge--${r.status}`}>
                  {REQUEST_STATUS_LABELS[r.status] || r.status}
                </span>
              </div>
              <div className="admin-support-overview-row">
                <span className="admin-support-overview-k">От:</span> {r.display_name} ({ROLE_LABELS[r.account_role]})
              </div>
              <div className="admin-support-overview-row">
                <span className="admin-support-overview-k">Контакт:</span>{' '}
                <a className="admin-support-overview-a" href={contactHref(r.contact)}>{r.contact}</a>
              </div>
              <p className="admin-support-overview-msg">{r.message}</p>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Назначить психолога</label>
                {approvedPsychs.length === 0 ? (
                  <p className="admin-support-overview-muted" style={{ marginTop: 6 }}>
                    Нет подтверждённых психологов. Откройте вкладку «Список психологов» и нажмите ✓ у нужного специалиста.
                  </p>
                ) : null}
                <select
                  className="input"
                  value={r.assigned_psychologist_id ?? ''}
                  disabled={approvedPsychs.length === 0}
                  onChange={(e) => {
                    const v = e.target.value;
                    assignRequest(
                      r.request_id,
                      v ? parseInt(v, 10) : null,
                      r.assigned_psychologist_id ?? ''
                    );
                  }}
                >
                  <option value="">— Не назначен —</option>
                  {approvedPsychs.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.name} ({p.organization || 'без орг.'})
                    </option>
                  ))}
                </select>
                {r.assigned_psychologist_name ? (
                  <p style={{ fontSize: 12, marginTop: 6, color: 'var(--text-light)' }}>
                    Сейчас: {r.assigned_psychologist_name}
                  </p>
                ) : null}
              </div>
              {r.confirmations?.length > 0 ? (
                <div style={{ marginTop: 10 }}>
                  <div className="admin-support-overview-k">Ответ пользователя</div>
                  <SupportVerificationBadges confirmations={r.confirmations} compact />
                </div>
              ) : null}
            </li>
          ))}
          {requests.length === 0 ? <p className="admin-support-overview-muted">Нет обращений</p> : null}
        </ul>
      ) : null}

      {inviteOpen ? (
        <AdminModalPortal>
        <div className="modal-overlay admin-modal-overlay" onClick={() => setInviteOpen(false)}>
          <div className="modal-card fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Пригласить психолога</h2>
              <button type="button" className="modal-close" onClick={() => setInviteOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={sendInvite}>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Имя</label>
                <input className="input" required value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Email</label>
                <input className="input" type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Рабочий номер</label>
                <input className="input" value={inviteForm.work_phone} onChange={(e) => setInviteForm({ ...inviteForm, work_phone: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Организация / университет</label>
                <input className="input" value={inviteForm.organization} onChange={(e) => setInviteForm({ ...inviteForm, organization: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label>Уровень специалиста</label>
                <input className="input" placeholder="Например, практикующий психолог" value={inviteForm.specialist_level} onChange={(e) => setInviteForm({ ...inviteForm, specialist_level: e.target.value })} />
              </div>

              {inviteResult ? (
                <div className="admin-success-banner" style={{ marginTop: 16 }}>
                  <p>Ссылка для регистрации (отправьте психологу на email):</p>
                  <code style={{ wordBreak: 'break-all', fontSize: 12 }}>{inviteResult.invite_url}</code>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => navigator.clipboard?.writeText(inviteResult.invite_url)}
                  >
                    <Link2 size={14} /> Копировать
                  </button>
                </div>
              ) : null}

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Закрыть</button>
                <button type="submit" className="btn btn-primary" disabled={inviteSaving}>
                  {inviteSaving ? 'Отправка…' : 'Создать приглашение'}
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
