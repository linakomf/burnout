import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import './AIChat.css';

const SYSTEM_PROMPT = `Ты — психологический ИИ-ассистент приложения MindTrack для выявления эмоционального выгорания у студентов и преподавателей.
Твои задачи:
- Поддерживать пользователя эмоционально и с пониманием
- Давать практические рекомендации по управлению стрессом и профилактике выгорания
- Задавать вопросы, чтобы лучше понять состояние пользователя
- При необходимости рекомендовать пройти тест или обратиться к специалисту
Отвечай кратко, тепло и по делу. Пиши на русском языке.`;

const AIChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Привет! 👋 Я ваш психологический ИИ-ассистент. Как вы себя чувствуете сегодня? Расскажите мне — я здесь, чтобы помочь.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Извините, не удалось получить ответ.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Ошибка соединения. Проверьте настройки API ключа.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat bubble button */}
      <button className={`ai-fab ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span className="ai-fab-label">ИИ-помощник</span>}
      </button>

      {/* Chat window */}
      {open && (
        <div className="ai-chat-window fade-in">
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar"><Bot size={18} /></div>
              <div>
                <span className="ai-name">MindTrack ИИ</span>
                <span className="ai-status">Онлайн</span>
              </div>
            </div>
            <button className="ai-close" onClick={() => setOpen(false)}><X size={16} /></button>
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
                <div className="ai-msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-input-bar">
            <input
              className="ai-input"
              placeholder="Напишите сообщение..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button
              className={`ai-send ${input.trim() ? 'active' : ''}`}
              onClick={sendMessage}
              disabled={!input.trim() || loading}
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
