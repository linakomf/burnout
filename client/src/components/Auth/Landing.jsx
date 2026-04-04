import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* ── Navbar ── */}
      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-icon"><Brain size={22} /></div>
          <div>
            <span className="land-logo-name">Burnout</span>
            <span className="land-logo-sub">AI-дневник для студентов</span>
          </div>
        </div>
        <div className="land-nav-actions">
          <button className="land-btn-ghost" onClick={() => navigate('/login')}>Вход</button>
          <button className="land-btn-teal" onClick={() => navigate('/register')}>Регистрация</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="hero-left">
          <h1 className="hero-title">
            Твой<br />
            персональный<br />
            <span className="hero-accent">AI-психолог</span>
          </h1>
          <p className="hero-desc">
            Отслеживай эмоции, предотвращай выгорание и получай поддержку от AI-помощника, который действительно понимает студенческую жизнь
          </p>
          <div className="hero-actions">
            <button className="land-btn-teal hero-cta" onClick={() => navigate('/register')}>
              Начать бесплатно →
            </button>
            <button className="land-btn-outline" onClick={() => { document.getElementById('features').scrollIntoView({ behavior: 'smooth' }); }}>
              Узнать больше
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Доступность</span>
            </div>
            <div className="hero-stat">
              <span className="stat-num">100%</span>
              <span className="stat-label">Конфиденциально</span>
            </div>
            <div className="hero-stat">
              <span className="stat-num">0₽</span>
              <span className="stat-label">Бесплатно</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-chat-card">
            <div className="chat-card-header">
              <div className="chat-bot-avatar"><Brain size={18} /></div>
              <div>
                <div className="chat-bot-name">AI-помощник</div>
                <div className="chat-bot-status">Онлайн</div>
              </div>
            </div>
            <div className="chat-bubble">
              Привет! Я вижу, что сегодня ты чувствуешь лёгкую тревогу. Хочешь поговорить о том, что тебя беспокоит?
            </div>
            <div className="chat-emojis-section">
              <p className="chat-emojis-label">Твои эмоции за неделю</p>
              <div className="chat-emojis">
                {['😊','😔','😐','😕','😊','😄','😊'].map((e, i) => (
                  <span key={i} className="chat-emoji">{e}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-features" id="features">
        <h2 className="section-title">Почему выбирают Burnout?</h2>
        <p className="section-sub">Современные технологии для заботы о твоём ментальном здоровье</p>
        <div className="features-grid">
          {[
            { color: '#5a8a8a', icon: <Brain size={24} />, title: 'AI-психолог 24/7', desc: 'Профессиональная поддержка с анализом эмоционального состояния в реальном времени' },
            { color: '#7a9a6a', icon: '♡', title: 'Отслеживание настроения', desc: 'Календарь-heatmap с историей ваших эмоций и персонализированными рекомендациями' },
            { color: '#7a6a9a', icon: '↗', title: 'Анализ выгорания', desc: 'Научно обоснованные методики определения и профилактики эмоционального истощения' },
            { color: '#8a7a6a', icon: '✦', title: 'Персонализация', desc: 'Рекомендации адаптируются под ваши предпочтения, расписание и стиль жизни' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon" style={{ background: f.color }}>
                {typeof f.icon === 'string' ? <span style={{ fontSize: 22, color: 'white' }}>{f.icon}</span> : <span style={{ color: 'white' }}>{f.icon}</span>}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For whom ── */}
      <section className="land-for-whom">
        <h2 className="section-title">Для кого подходит?</h2>
        <p className="section-sub">Burnout создан специально для академической среды</p>
        <div className="whom-grid">
          <div className="whom-card">
            <div className="whom-emoji">🎓</div>
            <h3 className="whom-title">Для Студентов</h3>
            <p className="whom-desc">Справляйтесь со стрессом от экзаменов, дедлайнов и адаптации к учёбе</p>
            <ul className="whom-list">
              <li><CheckCircle size={16} /> Помощь перед сессией</li>
              <li><CheckCircle size={16} /> Управление тревожностью</li>
              <li><CheckCircle size={16} /> Баланс учёбы и отдыха</li>
            </ul>
          </div>
          <div className="whom-card">
            <div className="whom-emoji">👨‍🏫</div>
            <h3 className="whom-title">Для Преподавателей</h3>
            <p className="whom-desc">Поддержка при эмоциональной нагрузке и профилактика профессионального выгорания</p>
            <ul className="whom-list">
              <li><CheckCircle size={16} /> Снижение выгорания</li>
              <li><CheckCircle size={16} /> Эмоциональная разгрузка</li>
              <li><CheckCircle size={16} /> Повышение мотивации</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Trust banner ── */}
      <section className="land-trust">
        <div className="trust-item"><Shield size={22} /> Полная конфиденциальность</div>
        <div className="trust-item"><Zap size={22} /> Быстрый доступ без очередей</div>
        <div className="trust-item"><Users size={22} /> Понимание академической среды</div>
      </section>

      {/* ── CTA ── */}
      <section className="land-cta">
        <div className="cta-card">
          <h2 className="cta-title">Начни заботиться о себе уже сегодня</h2>
          <p className="cta-sub">Регистрация займёт меньше минуты. Без кредитных карт, без скрытых платежей.</p>
          <button className="land-btn-teal cta-btn" onClick={() => navigate('/register')}>
            Создать аккаунт бесплатно →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="footer-logo">
          <div className="land-logo-icon"><Brain size={20} /></div>
          <span className="land-logo-name">Burnout</span>
        </div>
        <p className="footer-copy">© 2026 Burnout. AI-дневник для студентов и преподавателей.</p>
      </footer>

    </div>
  );
};

export default Landing;
