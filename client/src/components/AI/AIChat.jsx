import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPsychologistReplyResult } from '../../services/ai';
import { useSpaceCatalog } from '../../hooks/useSpaceCatalog';
import { buildAiChatRecommendationCards } from '../../utils/aiChatRecommendations';
import { getPreviousRecommendationContext } from '../../utils/aiChatRejection';
import ChatRecommendationCards from '../chat/ChatRecommendationCards';
import './AIChat.css';

const AIChat = () => {
  const { user } = useAuth();
  const { catalog: spaceCatalog } = useSpaceCatalog();
  const spaceCatalogRef = useRef(spaceCatalog);
  const userRef = useRef(user);

  useEffect(() => {
    spaceCatalogRef.current = spaceCatalog;
  }, [spaceCatalog]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Привет! 🌿 Как вы себя сегодня чувствуете?',
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
    const userText = input.trim();
    const userMsg = { role: 'user', content: userText };
    const history = [...messagesRef.current, userMsg];
    setMessages(history);
    messagesRef.current = history;
    setInput('');
    setLoading(true);

    try {
      const apiHistory = history.map((m) => ({ role: m.role, content: m.content }));
      const { previousCardTypes, previousCardPaths } = getPreviousRecommendationContext(messagesRef.current);
      const { reply, cardHints } = await getPsychologistReplyResult(apiHistory, {
        previousCardTypes,
      });
      const cards = buildAiChatRecommendationCards({
        userText,
        user: userRef.current,
        spaceCatalog: spaceCatalogRef.current,
        cardHints,
        previousCardTypes,
        previousCardPaths,
        conversationMessages: messagesRef.current,
      });
      setMessages((cur) => {
        const next = [
          ...cur,
          {
            role: 'assistant',
            content: reply,
            cards: cards.length ? cards : undefined,
          },
        ];
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
              <div className="ai-avatar">
                <Bot size={18} />
              </div>
              <div>
                <span className="ai-name">Burnout · ChatGPT</span>
                <span className="ai-status">Онлайн</span>
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
                <div className="ai-msg-stack">
                  <div className="ai-msg-bubble">{msg.content}</div>
                  {msg.role === 'assistant' && msg.cards?.length ? (
                    <ChatRecommendationCards cards={msg.cards} />
                  ) : null}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-msg assistant">
                <div className="ai-msg-avatar">
                  <Bot size={14} />
                </div>
                <div className="ai-msg-bubble typing" aria-live="polite">
                  <span />
                  <span />
                  <span />
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
