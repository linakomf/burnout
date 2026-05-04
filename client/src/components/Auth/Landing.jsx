import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Shield,
  ListChecks,
  Timer,
  Users,
  CheckCircle,
  LayoutDashboard,
  Heart,
  Sparkles,
  BarChart2,
  ArrowRight } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import './Landing.css';

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

  const features = [
  { color: '#f5c4a8', icon: <ListChecks size={22} strokeWidth={2.2} />, tKey: 0 },
  { color: '#e8b4c4', icon: <Heart size={22} strokeWidth={2.2} />, tKey: 1 },
  { color: '#c4d4f8', icon: <BarChart2 size={22} strokeWidth={2.2} />, tKey: 2 },
  { color: '#d4c4f0', icon: <Sparkles size={22} strokeWidth={2.2} />, tKey: 3 }];


  return (
    <div className="landing">

      <nav className="land-nav">
        <div className="land-logo">
          <div className="land-logo-icon" aria-hidden>
            <Brain size={22} strokeWidth={2} />
          </div>
          <div>
            <span className="land-logo-name">Burnout</span>
            <span className="land-logo-sub">{t('landing.logoSub')}</span>
          </div>
        </div>
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

      <section className="land-hero-section" aria-labelledby="hero-heading">
        <div className="land-hero">
          <div className="hero-left">
            <h1 id="hero-heading" className="hero-title">
              {t('landing.heroLine1')}{' '}
              <span className="hero-highlight">{t('landing.heroHighlight')}</span>
              <br />
              <span className="hero-title-accent">{t('landing.heroLine2')}</span>
            </h1>
            <p className="hero-desc">
              {t('landing.heroDesc')}
            </p>
            <div className="hero-actions">
              <button type="button" className="land-btn-hero-primary hero-cta" onClick={() => navigate('/register')}>
                {t('landing.ctaStart')}
              </button>
              <button
                type="button"
                className="land-btn-outline hero-cta-secondary"
                onClick={() => {document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });}}>
                
                {t('landing.ctaMore')}
              </button>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-num">{t('landing.stat1n')}</span>
                <span className="stat-label">{t('landing.stat1l')}</span>
              </div>
              <div className="hero-stat">
                <span className="stat-num">{t('landing.stat2n')}</span>
                <span className="stat-label">{t('landing.stat2l')}</span>
              </div>
              <div className="hero-stat">
                <span className="stat-num">{t('landing.stat3n')}</span>
                <span className="stat-label">{t('landing.stat3l')}</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-visual-card">
              <div className="hero-visual-bg" aria-hidden />
              <div className="hero-mood-bar">
                <p className="hero-mood-question">{t('landing.moodQ')}</p>
                <div className="hero-mood-track" aria-hidden>
                  <span className="hero-mood-seg hero-mood-seg--a" />
                  <span className="hero-mood-seg hero-mood-seg--b" />
                  <span className="hero-mood-seg hero-mood-seg--c" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="land-features" id="features">
        <h2 className="section-title">
          {t('landing.featuresTitle')}{' '}
          <span className="section-title-accent">{t('landing.featuresTitleAcc')}</span>
          {t('landing.featuresTitleQ')}
        </h2>
        <p className="section-sub">
          {t('landing.featuresSub')}
        </p>
        <div className="features-grid">
          {features.map((f, i) =>
          <div key={i} className="feature-card">
              <div className="feature-icon" style={{ background: f.color }}>
                <span className="feature-icon-inner">{f.icon}</span>
              </div>
              <h3 className="feature-title">{t(`landing.f${f.tKey}t`)}</h3>
              <p className="feature-desc">{t(`landing.f${f.tKey}d`)}</p>
            </div>
          )}
        </div>
      </section>

      <section className="land-for-whom" id="for-whom">
        <h2 className="section-title">{t('landing.whomTitle')}</h2>
        <p className="section-sub">{t('landing.whomSub')}</p>
        <div className="whom-grid">
          <div className="whom-card">
            <div className="whom-emoji">🎓</div>
            <h3 className="whom-title">{t('landing.stTitle')}</h3>
            <p className="whom-desc">{t('landing.stDesc')}</p>
            <ul className="whom-list">
              <li><CheckCircle size={16} strokeWidth={2.5} />{t('landing.stL1')}</li>
              <li><CheckCircle size={16} strokeWidth={2.5} />{t('landing.stL2')}</li>
              <li><CheckCircle size={16} strokeWidth={2.5} />{t('landing.stL3')}</li>
            </ul>
          </div>
          <div className="whom-card">
            <div className="whom-emoji">👨‍🏫</div>
            <h3 className="whom-title">{t('landing.teTitle')}</h3>
            <p className="whom-desc">{t('landing.teDesc')}</p>
            <ul className="whom-list">
              <li><CheckCircle size={16} strokeWidth={2.5} />{t('landing.teL1')}</li>
              <li><CheckCircle size={16} strokeWidth={2.5} />{t('landing.teL2')}</li>
              <li><CheckCircle size={16} strokeWidth={2.5} />{t('landing.teL3')}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="land-trust">
        <div className="trust-item"><Shield size={22} strokeWidth={2} />{t('landing.tr1')}</div>
        <div className="trust-item"><Timer size={22} strokeWidth={2} />{t('landing.tr2')}</div>
        <div className="trust-item"><Users size={22} strokeWidth={2} />{t('landing.tr3')}</div>
      </section>

      <section className="land-cta">
        <div className="cta-card">
          <h2 className="cta-title">{t('landing.ctaBannerTitle')}</h2>
          <p className="cta-sub">{t('landing.ctaBannerSub')}</p>
          <button type="button" className="land-btn-hero-primary cta-btn" onClick={() => navigate('/register')}>
            {t('landing.ctaBannerBtn')}
            <ArrowRight size={20} aria-hidden />
          </button>
        </div>
      </section>

      <footer className="land-footer">
        <div className="footer-logo">
          <div className="land-logo-icon land-logo-icon--sm"><Brain size={20} strokeWidth={2} /></div>
          <span className="land-logo-name">Burnout</span>
        </div>
        <p className="footer-copy">{t('landing.footCopy')}</p>
      </footer>

    </div>);

};

export default Landing;