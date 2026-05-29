import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import heroBg from '../../assets/landing-hero-meadow.png';
import AppLogo from '../Brand/AppLogo';
import LandingGlassCard from './LandingGlassCard';
import LandingBottom from './LandingBottom';
import './Landing.css';

const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const FOOTER_BRAND_LOGO = `${publicBase}/landing/footer-brand-logo.png`;

const scrollToId = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const goToApp = () => {
    if (!user) return;
    if (user.role === 'admin') navigate('/admin');
    else if (!user.onboarding_burnout_completed) navigate('/onboarding/burnout');
    else navigate('/dashboard');
  };

  const [activeNav, setActiveNav] = useState(null);

  const navLinks = [
    { id: 'for-whom', label: t('landing.navForWhom') },
    { id: 'features', label: t('landing.navFeatures') },
  ];

  useEffect(() => {
    const sectionIds = ['for-whom', 'features'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveNav(visible[0].target.id);
          return;
        }

        const hero = document.getElementById('hero');
        if (hero) {
          const heroRect = hero.getBoundingClientRect();
          if (heroRect.bottom > 120) {
            setActiveNav(null);
          }
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.15, 0.35, 0.55] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const goNav = (id) => {
    setActiveNav(id);
    scrollToId(id);
  };

  const goHero = () => {
    setActiveNav(null);
    scrollToId('hero');
  };

  return (
    <div className="landing landing-v2">
      <section
        className="land-v2-hero"
        id="hero"
        aria-labelledby="hero-heading"
        style={{ '--land-v2-bg': `url(${heroBg})` }}
      >
        <div className="land-v2-hero-overlay" aria-hidden />

        <header className="land-v2-nav">
          <div className="land-v2-nav-pill">
            <button type="button" className="land-v2-brand" onClick={goHero}>
              <AppLogo size={32} decorative />
              <span>{t('landing.brandName')}</span>
            </button>

            <nav className="land-v2-links" aria-label={t('landing.navAria')}>
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className={activeNav === link.id ? 'is-active' : ''}
                  onClick={() => goNav(link.id)}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="land-v2-nav-end">
              <LanguageSwitcher className="lang-switch--in-pill" />
              {user ? (
                <button type="button" className="land-v2-login" onClick={goToApp}>
                  {t('landing.toCabinet')}
                </button>
              ) : (
                <button type="button" className="land-v2-login" onClick={() => navigate('/login')}>
                  {t('landing.login')}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="land-v2-stage">
          <div className="land-v2-copy">
            <h1 id="hero-heading" className="land-v2-title">
              <span className="land-v2-title-bold">{t('landing.heroTitleBold')}</span>
              <span className="land-v2-title-accent">
                {t('landing.heroTitleAccent')}
                <Heart size={30} strokeWidth={1.75} className="land-v2-heart" aria-hidden />
              </span>
            </h1>
            <p className="land-v2-desc">{t('landing.heroDesc')}</p>
            <div className="land-v2-cta">
              <button type="button" className="land-v2-btn land-v2-btn--outline" onClick={() => scrollToId('for-whom')}>
                {t('landing.ctaLearn')}
              </button>
            </div>
          </div>

          <LandingGlassCard />
        </div>
      </section>

      <LandingBottom user={user} />

      <footer className="land-v2-footer" aria-label={t('landing.footColCompany')}>
        <div className="land-v2-footer-inner">
          <div className="land-v2-footer-brand">
            <img
              className="land-v2-footer-logo"
              src={FOOTER_BRAND_LOGO}
              width={52}
              height={52}
              alt=""
              decoding="async"
              draggable={false}
              aria-hidden
            />
            <span>{t('landing.brandName')}</span>
            <p>{t('landing.previewTagline')}</p>
          </div>

          <div className="land-v2-footer-col">
            <h3>{t('landing.footColCompany')}</h3>
            <button type="button" onClick={() => scrollToId('hero')}>{t('landing.footLinkAbout')}</button>
            <button type="button" onClick={() => scrollToId('for-whom')}>{t('landing.footLinkContact')}</button>
          </div>

          <div className="land-v2-footer-col">
            <h3>{t('landing.footColPlatform')}</h3>
            <button type="button" onClick={() => scrollToId('features')}>{t('landing.formatMusicTitle')}</button>
            <button type="button" onClick={() => scrollToId('features')}>{t('landing.formatArticlesTitle')}</button>
            <button type="button" onClick={() => scrollToId('features')}>{t('landing.formatFilmsTitle')}</button>
            <button type="button" onClick={() => scrollToId('features')}>{t('landing.formatPracticesTitle')}</button>
          </div>

          <div className="land-v2-footer-col">
            <h3>{t('landing.footColSupport')}</h3>
            <button type="button" onClick={() => scrollToId('for-whom')}>{t('landing.footLinkHelp')}</button>
            <button type="button" onClick={() => scrollToId('for-whom')}>{t('landing.perkSupport24')}</button>
          </div>
        </div>

        <div className="land-v2-footer-bottom">
          <p>{t('landing.footCopy')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
