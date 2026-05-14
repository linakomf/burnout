import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { PERSONALIZATION_OPTIONS } from '../../utils/dailyPersonalization';
import './Personalization.css';

const Personalization = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [selected, setSelected] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const likes = user?.daily_personalization?.likes;
    if (Array.isArray(likes) && likes.length) {
      setSelected(new Set(likes));
    }
  }, [user?.user_id, user?.daily_personalization?.likes]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else
      next.add(id);
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (selected.size === 0) {
      setErr('Выберите хотя бы один вариант');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      await api.post('/users/daily-personalization', { likes: [...selected] });
      await refreshUser();
      navigate('/dashboard');
    } catch (ex) {
      const msg =
      ex.response?.data?.message || (
      ex.code === 'ERR_NETWORK' || ex.message === 'Network Error' ?
      'Нет ответа от сервера. Убедитесь, что backend запущен (порт 5000) и в client указан proxy.' :
      null) ||
      ex.message ||
      'Не удалось сохранить';
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="personalization-page fade-in">
      <button type="button" className="personalization-back" onClick={() => navigate('/dashboard')} aria-label="Назад">
        <ArrowLeft size={22} strokeWidth={2} />
      </button>

      <header className="personalization-header">
        <p className="personalization-kicker">Персонализация</p>
        <h1 className="personalization-title">Что вам помогает выходить из напряжения?</h1>
        <p className="personalization-lead">
          Отметьте то, что откликается - от этого зависят совет дня и практики на главной. Это не диагноз, а ваши
          предпочтения.
        </p>
      </header>

      <form className="personalization-form" onSubmit={onSubmit}>
        <div className="personalization-grid" role="group" aria-label="Варианты восстановления">
          {PERSONALIZATION_OPTIONS.map(({ id, label, hint, Icon }) => {
            const on = selected.has(id);
            return (
              <button
                key={id}
                type="button"
                className={`personalization-chip ${on ? 'personalization-chip--on' : ''}`}
                onClick={() => toggle(id)}
                aria-pressed={on}>
                
                <span className="personalization-chip-check" aria-hidden>
                  {on ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span className="personalization-chip-ico" aria-hidden>
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <span className="personalization-chip-text">
                  <span className="personalization-chip-label">{label}</span>
                  <span className="personalization-chip-hint">{hint}</span>
                </span>
              </button>);

          })}
        </div>

        {err && <p className="personalization-error">{err}</p>}

        <div className="personalization-actions">
          <button type="submit" className="btn btn-primary personalization-submit" disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить и вернуться на главную'}
            {!saving && <ChevronRight size={18} aria-hidden />}
          </button>
        </div>
      </form>
    </div>);

};

export default Personalization;