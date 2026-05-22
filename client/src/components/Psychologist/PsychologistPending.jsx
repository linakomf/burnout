import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ACCOUNT_STATUS_LABELS } from './psychConstants';
import './Psychologist.css';

export default function PsychologistPending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const status = user?.psychologist_account_status || 'pending_review';

  return (
    <div className="psych-section fade-in">
      <div className="card psych-pending-card">
        <Clock size={48} className="psych-pending-icon" aria-hidden />
        <h1 className="page-title">Аккаунт на проверке</h1>
        <p className="page-sub" style={{ marginTop: 12 }}>
          Статус: <strong>{ACCOUNT_STATUS_LABELS[status] || status}</strong>
        </p>
        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--text-light)' }}>
          Администратор проверит ваши документы и подтвердит доступ к обращениям «Мы рядом».
          После подтверждения вы сможете работать с назначенными заявками.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 24 }}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <LogOut size={16} /> Выйти
        </button>
      </div>
    </div>
  );
}
