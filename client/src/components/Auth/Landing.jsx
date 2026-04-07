import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Shield, Zap, Users, CheckCircle } from 'lucide-react';
import './Landing.css';

/** Файл: client/public/photos/character.png (или персонаж.png). PUBLIC_URL — для деплоя не в корень домена. */
const publicPrefix = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const HERO_IMAGE_SRC = encodeURI(`${publicPrefix}/photos/character.png`);
const HERO_IMAGE_SRC_ALT = encodeURI(`${publicPrefix}/photos/персонаж.png`);

const Landing = () => {
  const navigate = useNavigate();
  const [heroImgSrc, setHeroImgSrc] = useState(HERO_IMAGE_SRC);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  return (
    <div className="landing">

      {/* ── Navbar ── */}
      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-icon"><Brain size={22} /></div>
          <div>
            <span className="land-logo-name">Burnout</span>
            <span className="land-logo-sub">Забота о ментальном здоровье в учёбе</span>
          </div>
        </div>
        <div className="land-nav-actions">
          <button className="land-btn-ghost" onClick={() => navigate('/login')}>Вход</button>
          <button className="land-btn-primary" onClick={() => navigate('/register')}>Регистрация</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="hero-left">
          <h1 className="hero-title">
            Выгорание<br />
            под контролем<br />
            <span className="hero-accent">уже с первого дня</span>
          </h1>
          <p className="hero-desc">
            Burnout помогает студентам и преподавателям отслеживать нагрузку, проходить короткие практики и видеть динамику.
            После регистрации вы пройдёте тест из 10 вопросов — и получите оценку уровня выгорания в процентах.
          </p>
          <div className="hero-actions">
            <button className="land-btn-primary hero-cta" onClick={() => navigate('/register')}>
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
              <span className="stat-num">0₸</span>
              <span className="stat-label">Бесплатно</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-visual-card">
            <div className="hero-visual-bg" aria-hidden />
            {!heroImgFailed ? (
              <img
                src={heroImgSrc}
                alt=""
                className="hero-visual-char"
                onError={() => {
                  if (heroImgSrc === HERO_IMAGE_SRC) {
                    setHeroImgSrc(HERO_IMAGE_SRC_ALT);
                  } else {
                    setHeroImgFailed(true);
                  }
                }}
              />
            ) : (
              <div className="hero-visual-fallback" aria-hidden>
                <Brain size={120} strokeWidth={1.05} />
              </div>
            )}
            <div className="hero-visual-overlay">
              <span className="hero-visual-badge">10 вопросов · персональный процент</span>
              <p className="hero-visual-text">
                Разные формулировки для студентов и преподавателей — честные ответы помогут точнее оценить состояние.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-features" id="features">
        <h2 className="section-title">Почему Burnout?</h2>
        <p className="section-sub">Единый стиль, понятные шаги и забота о ресурсе, а не только о баллах</p>
        <div className="features-grid">
          {[
            { color: '#a3c617', icon: <Brain size={24} />, title: 'Старт с теста', desc: 'Сразу после регистрации — 10 вопросов и процент выгорания, чтобы знать отправную точку' },
            { color: '#9d8bff', icon: '♡', title: 'Настроение и дневник', desc: 'Календарь, записи и мягкая поддержка в привычном интерфейсе' },
            { color: '#ffb347', icon: '↗', title: 'Аналитика', desc: 'Графики и динамика по вашим данным — без лишнего шума' },
            { color: '#5b9bd5', icon: '✦', title: 'Практики', desc: 'Дыхание, микропаузы и упражнения под ваш ритм' },
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
          <button className="land-btn-primary cta-btn" onClick={() => navigate('/register')}>
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
        <p className="footer-copy">© 2026 Burnout. Поддержка ментального здоровья студентов и преподавателей.</p>
      </footer>

    </div>
  );
};

export default Landing;
