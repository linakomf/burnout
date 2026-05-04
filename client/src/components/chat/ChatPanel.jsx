import React, { useCallback } from 'react';
import { format } from 'date-fns';
import { Activity, Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const QUICK_TAG_KEYS = ['diaryQuick1', 'diaryQuick2', 'diaryQuick3', 'diaryQuick4'];

const ChatPanel = ({ user, messages, input, setInput, sendMessage, loading, messagesEndRef }) => {
  const { t } = useLanguage();
  const firstName = user?.name?.split(' ')[0] || t('dash.greeting.friend');
  const headerTime = format(new Date(), 'HH:mm');

  const appendQuick = useCallback(
    (phrase) => {
      setInput((prev) => {
        const next = (prev || '').trim();
        return next ? `${next} ${phrase}` : phrase;
      });
    },
    [setInput]
  );

  return (
    <div className="diary-chat-mock">
      <div className="diary-chat-mock__hero-ai">
        <div className="diary-chat-mock__ai-icon" aria-hidden>
          <Activity size={22} strokeWidth={2.2} />
        </div>
        <div className="diary-chat-mock__hero-text">
          <p className="diary-chat-mock__greeting">{t('pages.chatGreeting', { name: firstName })}</p>
          <span className="diary-chat-mock__time">{headerTime}</span>
        </div>
      </div>

      <div className="diary-chat-mock__messages" role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-row ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="chat-avatar-ai diary-chat-mock__msg-avatar" aria-hidden>
                <Activity size={16} strokeWidth={2.2} />
              </div>
            )}
            <div className="chat-bubble-wrap">
              <div className={`chat-bubble-msg ${msg.role}`}>{msg.content}</div>
              {msg.time && <span className="chat-time">{msg.time}</span>}
            </div>
            {msg.role === 'user' && (
              <div className="chat-avatar-user">{user?.name?.charAt(0) || t('pages.chatUserFallback')}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-row assistant">
            <div className="chat-avatar-ai diary-chat-mock__msg-avatar" aria-hidden>
              <Activity size={16} strokeWidth={2.2} />
            </div>
            <div className="chat-bubble-msg assistant typing" aria-live="polite">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="diary-chat-mock__composer">
        <div className="diary-chat-mock__textarea-wrap">
          <textarea
            className="diary-chat-mock__textarea"
            placeholder={t('pages.chatPlaceholder', { name: firstName })}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
            rows={5}
            aria-label={t('pages.chatInputAria')}
          />
        </div>

        <div className="diary-quick-tags">
          {QUICK_TAG_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="diary-quick-tag"
              onClick={() => appendQuick(t(`pages.${key}`))}
              disabled={loading}
            >
              {t(`pages.${key}`)}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="diary-chat-mock__send diary-chat-mock__send--primary"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Send size={20} strokeWidth={2.2} />
          {t('pages.chatSend')}
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
