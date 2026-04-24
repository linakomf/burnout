import React, { useState } from 'react';
import { X, Send, PhoneCall } from 'lucide-react';
import api from '../../utils/api';
import './AIChat.css';

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contactMethod: 'telegram',
    contactValue: '',
    preferredTime: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSuccessText('');
    setErrorText('');
    setLoading(true);
    try {
      const res = await api.post('/users/psychologist-request', form);
      setSuccessText(res.data?.message || 'Заявка отправлена. Мы свяжемся с вами.');
      setForm((prev) => ({ ...prev, message: '' }));
    } catch (e) {
      setErrorText(e.response?.data?.message || 'Не удалось отправить заявку. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className={`ai-fab ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        {open ? <X size={22} /> : <PhoneCall size={21} />}
        {!open && (
          <span className="ai-fab-label">
            <span className="ai-fab-title">Связаться с психологом</span>
            <span className="ai-fab-sub">Ответим в ближайшее время</span>
          </span>
        )}
      </button>

      {open && (
        <div className="ai-chat-window fade-in">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar"><PhoneCall size={18} /></div>
              <div>
                <span className="ai-name">Связаться с психологом</span>
                <span className="ai-status">Ответим в ближайшее время</span>
              </div>
            </div>
            <button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label="Закрыть">
              <X size={16} />
            </button>
          </div>

          <div className="ai-messages ai-messages--form">
            <p className="ai-form-lead">
              Оставьте контакты и кратко опишите запрос. Команда свяжется с вами и подберет специалиста.
            </p>
            {successText && <div className="ai-form-msg ai-form-msg--success">{successText}</div>}
            {errorText && <div className="ai-form-msg ai-form-msg--error">{errorText}</div>}

            <form className="ai-form-grid" onSubmit={sendRequest}>
              <label className="ai-form-field">
                <span className="ai-form-label">Способ связи</span>
                <select
                  className="ai-input"
                  name="contactMethod"
                  value={form.contactMethod}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="telegram">Telegram</option>
                  <option value="phone">Телефон</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="other">Другое</option>
                </select>
              </label>

              <label className="ai-form-field">
                <span className="ai-form-label">Контакт</span>
                <input
                  className="ai-input"
                  name="contactValue"
                  value={form.contactValue}
                  onChange={handleChange}
                  placeholder="@username / +7..."
                  disabled={loading}
                  required
                />
              </label>

              <label className="ai-form-field">
                <span className="ai-form-label">Удобное время (опционально)</span>
                <input
                  className="ai-input"
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleChange}
                  placeholder="Например: после 18:00"
                  disabled={loading}
                />
              </label>

              <label className="ai-form-field">
                <span className="ai-form-label">С чем нужна помощь</span>
                <textarea
                  className="ai-input ai-textarea"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Кратко опишите состояние или вопрос..."
                  disabled={loading}
                  minLength={10}
                  required
                />
              </label>

              <button
                type="submit"
                className={`ai-send ai-send--submit ${form.contactValue.trim() && form.message.trim() ? 'active' : ''}`}
                disabled={loading || !form.contactValue.trim() || !form.message.trim()}
                aria-label="Отправить заявку"
              >
                <Send size={16} />
                {loading ? 'Отправка...' : 'Отправить заявку'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
