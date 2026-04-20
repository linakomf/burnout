import React from 'react';
import { Send } from 'lucide-react';

const ChatPanel = ({ user, messages, input, setInput, sendMessage, loading, messagesEndRef }) => {
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="diary-card chat-block">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-row ${msg.role}`}>
            {msg.role === 'assistant' && <div className="chat-avatar-ai">🤖</div>}
            <div className="chat-bubble-wrap">
              <div className={`chat-bubble-msg ${msg.role}`}>{msg.content}</div>
              {msg.time && <span className="chat-time">{msg.time}</span>}
            </div>
            {msg.role === 'user' && (
              <div className="chat-avatar-user">{user?.name?.charAt(0) || 'Я'}</div>
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

      <div className="chat-input-row">
        <div className="chat-input-hint">
          {firstName ? `${firstName}, ` : ''}делитесь мыслями — ответит ИИ-психолог.
        </div>
        <div className="chat-input-bar">
          <input
            className="chat-input"
            placeholder="Напишите сообщение… (Enter — отправить)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={loading}
            aria-label="Сообщение чата"
          />
          <button
            type="button"
            className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send size={16} /> Отправить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
