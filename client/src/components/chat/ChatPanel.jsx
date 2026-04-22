import React from 'react';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ChatPanel = ({ user, messages, input, setInput, sendMessage, loading, messagesEndRef }) => {
  const { t } = useLanguage();
  const firstName = user?.name?.split(' ')[0] || t('dash.greeting.friend');
  const headerTime = format(new Date(), 'HH:mm');

  return (
    <div className="diary-chat-mock">
      <div className="diary-chat-mock__header">
        <p className="diary-chat-mock__greeting">
          {t('pages.chatGreeting', { name: firstName })}
        </p>
        <span className="diary-chat-mock__time">{headerTime}</span>
      </div>

      <div className="diary-chat-mock__messages" role="log" aria-live="polite">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-row ${msg.role}`}>
            {msg.role === 'assistant' && <div className="chat-avatar-ai">🤖</div>}
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
            <div className="chat-avatar-ai">🤖</div>
            <div className="chat-bubble-msg assistant typing" aria-live="polite">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="diary-chat-mock__composer">
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
          rows={4}
          aria-label={t('pages.chatInputAria')}
        />
        <div className="diary-chat-mock__send-wrap">
          <button
            type="button"
            className="diary-chat-mock__send"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={18} strokeWidth={2.2} />
            {t('pages.chatSend')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
