import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flower2,
  Play,
  Users,
  ListChecks,
  Clock,
  Brain,
  Sprout,
  Mountain,
  Sun,
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  MessageCircle,
  Send } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import heroClouds from '../../assets/landing-hero-clouds.png';
import imgFilms from '../../assets/advice-films.png';
import imgMeditation from '../../assets/advice-meditation.png';
import imgPodcasts from '../../assets/advice-music.png';
import imgReading from '../../assets/advice-reading.png';
import imgEvents from '../../assets/advice-activity.png';
import supportScene from '../../assets/dashboard-bg-hills.png';
import howAsideImg from '../../assets/landing-blossoms-bg.png';
import './Landing.css';

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const goToApp = () => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin');else
    if (!user.onboarding_burnout_completed) navigate('/onboarding/burnout');else
    navigate('/dashboard');
  };

  const goToPractice = (path) => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }
    if (!user.onboarding_burnout_completed) {
      navigate('/onboarding/burnout');
      return;
    }
    navigate(path);
  };

  const statBar = [
  { icon: <Users size={22} strokeWidth={2} />, text: t('landing.statBar1') },
  { icon: <ListChecks size={22} strokeWidth={2} />, text: t('landing.statBar2') },
  { icon: <Clock size={22} strokeWidth={2} />, text: t('landing.statBar3') },
  { icon: <Brain size={22} strokeWidth={2} />, text: t('landing.statBar4') }];


  const categories = [
  {
    id: 'films',
    title: t('landing.catFilms'),
    desc: t('landing.catFilmsDesc'),
    count: t('landing.catFilmsCount'),
    img: imgFilms,
    path: '/practices/films'
  },
  {
    id: 'meditation',
    title: t('landing.catMeditation'),
    desc: t('landing.catMeditationDesc'),
    count: t('landing.catMeditationCount'),
    img: imgMeditation,
    path: '/practices/meditation'
  },
  {
    id: 'podcasts',
    title: t('landing.catPodcasts'),
    desc: t('landing.catPodcastsDesc'),
    count: t('landing.catPodcastsCount'),
    img: imgPodcasts,
    path: '/practices/podcasts'
  },
  {
    id: 'articles',
    title: t('landing.catReading'),
    desc: t('landing.catReadingDesc'),
    count: t('landing.catReadingCount'),
    img: imgReading,
    path: '/practices/articles'
  },
  {
    id: 'events',
    title: t('landing.catEvents'),
    desc: t('landing.catEventsDesc'),
    count: t('landing.catEventsCount'),
    img: imgEvents,
    path: '/practices/events'
  }];


  const howStepIcons = [Sprout, Mountain, Sun, Users];
  const howSteps = howStepIcons.map((Icon, idx) => ({
    n: idx + 1,
    Icon,
    text: t(`landing.howStep${idx + 1}`)
  }));


  const supportList = [t('landing.supportL1'), t('landing.supportL2'), t('landing.supportL3'), t('landing.supportL4')];

  return (
    <div className="landing">

      <nav className="land-nav" aria-label="Main">
        <button type="button" className="land-nav-brand" onClick={() => scrollToId('hero')}>
          <div className="land-logo-icon" aria-hidden>
            <Flower2 size={22} strokeWidth={2} />
          </div>
          <div className="land-brand-text">
            <span className="land-logo-name">{t('landing.brandName')}</span>
            <span className="land-logo-sub">{t('landing.logoSub')}</span>
          </div>
        </button>
        <ul className="land-nav-links">
          <li><button type="button" className="land-nav-link" onClick={() => scrollToId('categories')}>{t('landing.navPlatform')}</button></li>
          <li><button type="button" className="land-nav-link" onClick={() => scrollToId('support-block')}>{t('landing.navSupportProgram')}</button></li>
          <li><button type="button" className="land-nav-link" onClick={() => scrollToId('quote-block')}>{t('landing.navCommunity')}</button></li>
          <li><button type="button" className="land-nav-link" onClick={() => scrollToId('footer-newsletter')}>{t('landing.navBlog')}</button></li>
          <li><button type="button" className="land-nav-link" onClick={() => scrollToId('footer-company')}>{t('landing.navAbout')}</button></li>
        </ul>
        <div className="land-nav-actions">
          <LanguageSwitcher className="lang-switch--on-light-bg" />
          {user ?
          <button type="button" className="land-btn-hero-primary land-btn-nav-dash" onClick={goToApp}>
              <LayoutDashboard size={18} aria-hidden />
              {t('landing.toCabinet')}
            </button> :

          <>
              <button type="button" className="land-btn-ghost" onClick={() => navigate('/login')}>
                {t('landing.login')}
              </button>
              <button type="button" className="land-btn-reg" onClick={() => navigate('/register')}>
                {t('landing.register')}
              </button>
            </>
          }
        </div>
      </nav>

      <section className="land-hero-wrap" id="hero" aria-labelledby="hero-heading">
        <div className="land-hero-bg" style={{ backgroundImage: `url(${heroClouds})` }} aria-hidden />
        <div className="land-hero-overlay" aria-hidden />
        <div className="land-hero-inner">
          <div className="land-hero-copy">
            <p className="land-hero-badge">{t('landing.heroBadge')}</p>
            <h1 id="hero-heading" className="land-hero-title">
              {t('landing.heroTitle')}
              <span className="land-hero-title-italic">{t('landing.heroTitleItalic')}</span>
              {t('landing.heroTitleSuffix')}
            </h1>
            <p className="land-hero-desc">{t('landing.heroDesc')}</p>
            <div className="land-hero-actions">
              <button type="button" className="land-btn-hero-primary land-btn-hero-solid" onClick={() => navigate('/register')}>
                {t('landing.ctaStart')}
              </button>
              <button
                type="button"
                className="land-btn-watch"
                onClick={() => scrollToId('how-it-works')}>

                <span className="land-btn-watch-icon" aria-hidden>
                  <Play size={18} fill="currentColor" />
                </span>
                {t('landing.ctaWatch')}
              </button>
            </div>
          </div>
          <div className="land-hero-widgets" aria-hidden>
            <div className="land-widget land-widget--today">
              <p className="land-widget-label">{t('landing.heroWidgetToday')}</p>
              <p className="land-widget-lead">{t('landing.heroWidgetTodayLead')}</p>
              <div className="land-widget-bar">
                <span className="land-widget-bar-fill" style={{ width: '58%' }} />
              </div>
              <p className="land-widget-foot">{t('landing.heroWidgetTodaySub')}</p>
            </div>
            <div className="land-widget land-widget--calm">
              <p className="land-widget-calm-title">{t('landing.heroWidgetCalm')}</p>
              <div className="land-widget-gauge">
                <div className="land-widget-gauge-ring" />
                <span className="land-widget-gauge-val">{t('landing.heroWidgetCalmPct')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="land-stat-bar" id="stats-bar" aria-label={t('landing.statBar1')}>
        <div className="land-stat-bar-inner">
          {statBar.map((s, i) =>
          <div key={i} className="land-stat-bar-item">
              <span className="land-stat-bar-ico">{s.icon}</span>
              <span className="land-stat-bar-txt">{s.text}</span>
            </div>
          )}
        </div>
      </section>

      <section className="land-categories" id="categories" aria-labelledby="cat-heading">
        <div className="land-cat-layout">
          <aside className="land-cat-aside">
            <h2 className="land-cat-aside-title">{t('landing.catAsideTitle')}</h2>
            <p className="land-cat-aside-lead">{t('landing.catAsideLead')}</p>
            <button type="button" className="land-btn-outline land-cat-viewall" onClick={() => goToPractice('/practices')}>
              {t('landing.catViewAll')}
              <ArrowRight size={18} aria-hidden />
            </button>
          </aside>
          <div className="land-cat-main">
            <h2 id="cat-heading" className="land-section-title land-section-title--left">{t('landing.catSectionTitle')}</h2>
            <p className="land-section-sub land-section-sub--left">{t('landing.catSectionSub')}</p>
            <div className="land-cat-grid">
              {categories.map((c) =>
              <button
                key={c.id}
                type="button"
                className={`land-cat-card land-cat-card--${c.id}`}
                onClick={() => goToPractice(c.path)}>

                  <div className="land-cat-card-visual">
                    <img src={c.img} alt="" className="land-cat-card-img" width={200} height={140} />
                  </div>
                  <div className="land-cat-card-body">
                    <h3 className="land-cat-card-title">{c.title}</h3>
                    <p className="land-cat-card-desc">{c.desc}</p>
                    <div className="land-cat-card-meta">
                      <span className="land-cat-card-count">{c.count}</span>
                      <span className="land-cat-card-play">
                        <Play size={16} strokeWidth={2.2} />
                      </span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="land-how" id="how-it-works" aria-labelledby="how-heading">
        <div className="land-how-inner">
          <aside className="land-how-aside">
            <div className="land-how-aside-visual">
              <img src={howAsideImg} alt="" className="land-how-aside-img" width={480} height={320} />
            </div>
            <div className="land-how-aside-body">
              <h3 className="land-how-aside-title">{t('landing.howAsideTitle')}</h3>
              <p className="land-how-aside-sub">{t('landing.howAsideSub')}</p>
            </div>
          </aside>

          <div className="land-how-main">
            <div className="land-how-main-head">
              <h2 id="how-heading" className="land-how-heading-serif">{t('landing.howTitle')}</h2>
              <Flower2 className="land-how-head-flower" size={30} strokeWidth={1.75} aria-hidden />
            </div>

            <div className="land-how-track">
              <div className="land-how-path-layer" aria-hidden>
                <svg className="land-how-path-svg" viewBox="0 0 880 64" preserveAspectRatio="none">
                  <path
                    className="land-how-path-line"
                    d="M 0 36 C 75 10 145 52 220 36 C 295 20 365 56 440 36 C 515 16 585 54 660 36 C 735 18 805 52 880 36" />
                </svg>
                <div className="land-how-path-blossoms">
                  <Flower2 size={15} strokeWidth={1.6} />
                  <Flower2 size={15} strokeWidth={1.6} />
                  <Flower2 size={15} strokeWidth={1.6} />
                  <Flower2 size={15} strokeWidth={1.6} />
                  <Flower2 size={15} strokeWidth={1.6} />
                </div>
              </div>

              <ol className="land-how-step-grid">
                {howSteps.map(({ n, Icon, text }) =>
                <li key={n} className="land-how-step-node">
                    <div className="land-how-icon-circle">
                      <Icon size={22} strokeWidth={2} aria-hidden />
                    </div>
                    <span className="land-how-num-display">{n}</span>
                    <p className="land-how-step-line">{text}</p>
                  </li>
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="land-support-quote" id="support-block">
        <div className="land-support-card">
          <div className="land-support-copy">
            <h2 className="land-support-title">{t('landing.supportTitle')}</h2>
            <p className="land-support-lead">{t('landing.supportLead')}</p>
            <ul className="land-support-list">
              {supportList.map((line, i) =>
            <li key={i}>
                  <CheckCircle2 size={20} strokeWidth={2} aria-hidden />
                  {line}
                </li>
            )}
            </ul>
            <button type="button" className="land-btn-hero-primary land-btn-hero-solid" onClick={() => navigate('/register')}>
              {t('landing.register')}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>
          <div className="land-support-visual" aria-hidden>
            <img src={supportScene} alt="" className="land-support-img" width={560} height={380} />
          </div>
        </div>

        <div className="land-quote-block" id="quote-block">
          <blockquote className="land-quote">
            <p>{t('landing.quoteText')}</p>
            <footer className="land-quote-author">— {t('landing.quoteAuthor')}</footer>
          </blockquote>
          <div className="land-urgent">
            <div>
              <p className="land-urgent-label">{t('landing.urgentLabel')}</p>
              <p className="land-urgent-hint">{t('landing.urgentHint')}</p>
            </div>
            <button type="button" className="land-btn-urgent" onClick={() => navigate('/register')}>
              <MessageCircle size={18} aria-hidden />
              {t('landing.urgentBtn')}
            </button>
          </div>
        </div>
      </section>

      <section className="land-bottom-cta">
        <div className="land-bottom-cta-inner">
          <h2 className="land-bottom-cta-title">{t('landing.footBottomCta')}</h2>
          <button type="button" className="land-btn-hero-primary land-btn-hero-solid" onClick={() => navigate('/register')}>
            {t('landing.register')}
          </button>
        </div>
      </section>

      <footer className="land-footer" id="footer">
        <div className="land-footer-grid">
          <div className="land-footer-brand">
            <div className="land-footer-logo">
              <div className="land-logo-icon land-logo-icon--sm" aria-hidden>
                <Flower2 size={20} strokeWidth={2} />
              </div>
              <span className="land-logo-name">{t('landing.brandName')}</span>
            </div>
            <p className="land-footer-tag">{t('landing.logoSub')}</p>
          </div>
          <div id="footer-platform">
            <h3 className="land-footer-col-title">{t('landing.footColPlatform')}</h3>
            <ul className="land-footer-links">
              <li><button type="button" onClick={() => goToPractice('/practices')}>{t('landing.footLinkPractices')}</button></li>
              <li><button type="button" onClick={() => goToPractice('/tests')}>{t('landing.footLinkTests')}</button></li>
              <li><button type="button" onClick={() => goToPractice('/diary')}>{t('landing.footLinkDiary')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="land-footer-col-title">{t('landing.footColSupport')}</h3>
            <ul className="land-footer-links">
              <li><button type="button" onClick={() => scrollToId('how-it-works')}>{t('landing.footLinkHelp')}</button></li>
              <li><button type="button" onClick={() => scrollToId('quote-block')}>{t('landing.footLinkUrgent')}</button></li>
            </ul>
          </div>
          <div id="footer-company">
            <h3 className="land-footer-col-title">{t('landing.footColCompany')}</h3>
            <ul className="land-footer-links">
              <li><button type="button" onClick={() => scrollToId('hero')}>{t('landing.footLinkAbout')}</button></li>
              <li><button type="button" onClick={() => scrollToId('footer-newsletter')}>{t('landing.footLinkContact')}</button></li>
            </ul>
          </div>
          <div className="land-footer-news" id="footer-newsletter">
            <h3 className="land-footer-col-title">{t('landing.newsletterTitle')}</h3>
            <form
              className="land-newsletter"
              onSubmit={(e) => {e.preventDefault();}}>

              <input type="email" className="land-newsletter-input" placeholder={t('landing.newsletterPh')} autoComplete="email" />
              <button type="submit" className="land-newsletter-btn" aria-label={t('landing.newsletterBtn')}>
                <Send size={18} aria-hidden />
              </button>
            </form>
          </div>
        </div>
        <div className="land-footer-bottom">
          <p className="footer-copy">{t('landing.footCopy')}</p>
          <div className="land-footer-social" role="list">
            <a href="https://t.me/" className="land-social" target="_blank" rel="noopener noreferrer" aria-label={t('landing.socialTg')}>
              TG
            </a>
            <a href="https://vk.com/" className="land-social" target="_blank" rel="noopener noreferrer" aria-label={t('landing.socialVk')}>
              VK
            </a>
            <a href="https://instagram.com/" className="land-social" target="_blank" rel="noopener noreferrer" aria-label={t('landing.socialIg')}>
              IG
            </a>
          </div>
        </div>
      </footer>

    </div>);

};

export default Landing;
