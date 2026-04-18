import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { getPsychologistReply } from '../../services/ai';
import './AIChat.css';

const hasOpenAI = Boolean(process.env.REACT_APP_OPENAI_API_KEY?.trim());

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: hasOpenAI
        ? 'Привет! Я работаю через ChatGPT и могу поддержать вас, ответить на вопросы о стрессе, тревоге, настроении и не только. Как вы себя чувствуете сегодня?'
        : 'Привет! Для ответов через ChatGPT добавьте в файл .env в папке client ключ REACT_APP_OPENAI_API_KEY и перезапустите приложение. Пока я отвечу короткими подсказками.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messagesRef.current, userMsg];
    setMessages(history);
    messagesRef.current = history;
    setInput('');
    setLoading(true);

    try {
      const apiHistory = history.map((m) => ({ role: m.role, content: m.content }));
      const reply = await getPsychologistReply(apiHistory);
      setMessages((cur) => {
        const next = [...cur, { role: 'assistant', content: reply }];
        messagesRef.current = next;
        return next;
      });
    } catch (e) {
      console.error(e);
      setMessages((cur) => {
        const next = [
          ...cur,
          {
            role: 'assistant',
            content:
              'Не удалось получить ответ. Проверьте ключ OpenAI и баланс на platform.openai.com, затем попробуйте снова.',
          },
        ];
        messagesRef.current = next;
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className={`ai-fab ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span className="ai-fab-label">ИИ-помощник</span>}
      </button>

      {open && (
        <div className="ai-chat-window fade-in">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar"><Bot size={18} /></div>
              <div>
                <span className="ai-name">MindTrack · ChatGPT</span>
                <span className="ai-status">{hasOpenAI ? 'Онлайн' : 'Локальные ответы'}</span>
              </div>
            </div>
            <button type="button" className="ai-close" onClick={() => setOpen(false)} aria-label="Закрыть">
              <X size={16} />
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                <div className="ai-msg-avatar">
                  {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className="ai-msg-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-msg-avatar"><Bot size={14} /></div>
                <div className="ai-msg-bubble typing" aria-live="polite">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-bar">
            <input
              className="ai-input"
              placeholder="Задайте вопрос или опишите, что чувствуете…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              aria-label="Сообщение"
            />
            <button
              type="button"
              className={`ai-send ${input.trim() ? 'active' : ''}`}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Отправить"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
