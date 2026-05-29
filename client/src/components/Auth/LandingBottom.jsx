import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Briefcase, Check, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getHomeBannerVideoSrc } from '../../config/homeBannerVideo';
import {
  MEDITATION_HERO_BANNER_VIDEO,
  SPACE_PRACTICES_HERO_VIDEO,
  SPACE_PRACTICES_PILL_MIST_VIDEO,
  SPACE_PRACTICES_PILL_SKY_VIDEO,
} from '../Practices/spaceNatureImagery';
import aiDiaryBg from '../../assets/ai-diary-page-bg.png';
import dashboardHillsBg from '../../assets/dashboard-bg-hills.png';

const publicBase = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
const CTA_COMMUNITY_AVATARS = [
  `${publicBase}/landing/community-avatar-1.png`,
  `${publicBase}/landing/community-avatar-2.png`,
  `${publicBase}/landing/community-avatar-3.png`,
];

const textMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

const photoMotion = {
  initial: { opacity: 0, scale: 1.05 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
};

function ForWhomShowcase({ t }) {
  const reduceMotion = useReducedMotion();
  const audiences = useMemo(
    () => [
      {
        id: 'student',
        tabLabel: t('landing.forWhomStudentsTitle'),
        items: [
          t('landing.forWhomStudentItem1'),
          t('landing.forWhomStudentItem2'),
          t('landing.forWhomStudentItem3'),
          t('landing.forWhomStudentItem4'),
        ],
        poster: `${publicBase}/avatars/onb-char-girl.png`,
        videoSrc: getHomeBannerVideoSrc('student', 'girl'),
        mediaAlt: t('landing.forWhomStudentsTitle'),
        tone: 'student',
      },
      {
        id: 'teacher',
        tabLabel: t('landing.forWhomTeachersTitle'),
        items: [
          t('landing.forWhomTeacherItem1'),
          t('landing.forWhomTeacherItem2'),
          t('landing.forWhomTeacherItem3'),
          t('landing.forWhomTeacherItem4'),
        ],
        poster: `${publicBase}/avatars/onb-char-man.png`,
        videoSrc: getHomeBannerVideoSrc('teacher', 'boy'),
        mediaAlt: t('landing.forWhomTeachersTitle'),
        tone: 'teacher',
      },
    ],
    [t]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const active = audiences[activeIndex];

  const selectAudience = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((index) => (index - 1 + audiences.length) % audiences.length);
  }, [audiences.length]);

  const goNext = useCallback(() => {
    setActiveIndex((index) => (index + 1) % audiences.length);
  }, [audiences.length]);

  return (
    <article className="land-about-showcase land-forwhom-showcase" id="for-whom">
      <div className="land-about-showcase__content">
        <h2 className="land-forwhom-showcase__title">{t('landing.forWhomTitle')}</h2>

        <div className="land-forwhom-showcase__tabs" role="tablist" aria-label={t('landing.forWhomTitle')}>
          {audiences.map((audience, index) => (
            <button
              key={audience.id}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              className={`land-forwhom-showcase__tab land-forwhom-showcase__tab--${audience.id}${
                activeIndex === index ? ' is-active' : ''
              }`}
              onClick={() => selectAudience(index)}
            >
              {audience.id === 'student' ? (
                <GraduationCap size={16} strokeWidth={1.85} aria-hidden />
              ) : (
                <Briefcase size={16} strokeWidth={1.85} aria-hidden />
              )}
              <span>{audience.tabLabel}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active.id}
            className={`land-forwhom-showcase__panel land-forwhom-showcase__panel--${active.tone}`}
            role="tabpanel"
            {...(reduceMotion ? {} : textMotion)}
          >
            <ul className="land-forwhom-showcase__list">
              {active.items.map((item) => (
                <li key={item}>
                  <Check size={16} strokeWidth={2.25} aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        <div className="land-about-showcase__nav">
          <button type="button" className="land-about-showcase__nav-btn" onClick={goPrev} aria-label={t('landing.aboutSlidePrev')}>
            <ChevronLeft size={18} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className="land-about-showcase__nav-btn land-about-showcase__nav-btn--primary"
            onClick={goNext}
            aria-label={t('landing.aboutSlideNext')}
          >
            <ChevronRight size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <div className="land-about-showcase__visual" aria-roledescription="carousel" aria-label={t('landing.forWhomSlidesAria')}>
        <div className={`land-about-showcase__oval land-forwhom-showcase__oval land-forwhom-showcase__oval--${active.tone}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              className="land-forwhom-showcase__media"
              {...(reduceMotion ? {} : photoMotion)}
            >
              {!reduceMotion ? (
                <video
                  className="land-forwhom-showcase__video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={active.poster}
                  aria-label={active.mediaAlt}
                >
                  <source src={active.videoSrc} type="video/mp4" />
                </video>
              ) : (
                <img
                  className="land-forwhom-showcase__photo"
                  src={active.poster}
                  alt={active.mediaAlt}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

const FORMAT_LOOP_MEDIA = {
  music: {
    video: SPACE_PRACTICES_PILL_SKY_VIDEO,
    poster: `${publicBase}/images/practices/category-music.png`,
  },
  articles: {
    video: SPACE_PRACTICES_PILL_MIST_VIDEO,
    poster: `${publicBase}/images/practices/category-articles.png`,
  },
  films: {
    video: SPACE_PRACTICES_HERO_VIDEO,
    poster: `${publicBase}/images/practices/category-films.png`,
  },
  practices: {
    video: MEDITATION_HERO_BANNER_VIDEO,
    poster: `${publicBase}/images/practices/category-meditation.png`,
  },
  events: {
    video: SPACE_PRACTICES_HERO_VIDEO,
    poster: `${publicBase}/images/practices/category-events.png`,
  },
  chatbot: {
    poster: aiDiaryBg,
  },
  analytics: {
    poster: dashboardHillsBg,
  },
  meditation: {
    video: MEDITATION_HERO_BANNER_VIDEO,
    poster: `${publicBase}/images/practices/category-meditation.png`,
  },
};

function FormatCardVisual({ formatId }) {
  const reduceMotion = useReducedMotion();
  const media = FORMAT_LOOP_MEDIA[formatId];
  if (!media) return null;

  return (
    <>
      {media.video && !reduceMotion ? (
        <video
          className="land-bottom-format-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={media.poster}
        >
          <source src={media.video} type="video/mp4" />
        </video>
      ) : (
        <img className="land-bottom-format-poster" src={media.poster} alt="" loading="lazy" decoding="async" />
      )}
    </>
  );
}

function FormatsRouteDecor() {
  return (
    <svg className="land-bottom-formats-route" viewBox="0 0 1100 420" preserveAspectRatio="none" aria-hidden>
      <path
        d="M 40 72 C 180 120, 260 28, 400 88 S 620 140, 720 52 S 900 24, 1060 108"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="7 11"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LandingBottom({ user }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const formatsScrollRef = useRef(null);
  const [formatsSlide, setFormatsSlide] = useState(0);

  const formatSlides = useMemo(
    () => [
      [
        { id: 'music', title: t('landing.formatMusicTitle'), desc: t('landing.formatMusicDesc') },
        { id: 'articles', title: t('landing.formatArticlesTitle'), desc: t('landing.formatArticlesDesc') },
        { id: 'films', title: t('landing.formatFilmsTitle'), desc: t('landing.formatFilmsDesc') },
        { id: 'practices', title: t('landing.formatPracticesTitle'), desc: t('landing.formatPracticesDesc') },
      ],
      [
        { id: 'events', title: t('landing.formatEventsTitle'), desc: t('landing.formatEventsDesc') },
        { id: 'chatbot', title: t('landing.formatChatbotTitle'), desc: t('landing.formatChatbotDesc') },
        { id: 'analytics', title: t('landing.formatAnalyticsTitle'), desc: t('landing.formatAnalyticsDesc') },
        { id: 'meditation', title: t('landing.formatMeditationTitle'), desc: t('landing.formatMeditationDesc') },
      ],
    ],
    [t]
  );

  const formats = formatSlides[formatsSlide];

  const goToAppArea = () => {
    if (!user) return true;
    if (user.role === 'admin') {
      navigate('/admin');
      return false;
    }
    if (!user.onboarding_burnout_completed) {
      navigate('/onboarding/burnout');
      return false;
    }
    return true;
  };

  const openJoin = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (!goToAppArea()) return;
    navigate('/dashboard');
  };

  const flipFormats = useCallback(
    (direction) => {
      setFormatsSlide((index) => {
        const total = formatSlides.length;
        return (index + direction + total) % total;
      });
      const node = formatsScrollRef.current;
      if (node) node.scrollLeft = 0;
    },
    [formatSlides.length]
  );

  return (
    <div className="land-bottom">
      <section className="land-bottom-forwhom" aria-label={t('landing.forWhomTitle')}>
        <ForWhomShowcase t={t} />
      </section>

      <section className="land-bottom-panel" id="features" aria-labelledby="help-heading">
        <div className="land-bottom-panel-inner">
          <div className="land-bottom-head">
            <h2 id="help-heading" className="land-bottom-title">
              <span className="land-bottom-title-lead">{t('landing.helpSectionTitleLead')}</span>
              <span className="land-bottom-title-pill">{t('landing.helpSectionTitleAccent')}</span>
              <span className="land-bottom-title-tail">{t('landing.helpSectionTitleTail')}</span>
            </h2>
          </div>

          <div className="land-bottom-formats-wrap" id="landing-formats">
            <FormatsRouteDecor />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={formatsSlide}
                className="land-bottom-formats"
                ref={formatsScrollRef}
                {...(reduceMotion ? {} : textMotion)}
              >
                {formats.map(({ id, title, desc }) => (
                  <article key={id} className={`land-bottom-format land-bottom-format--${id}`}>
                    <div className={`land-bottom-format-visual land-bottom-format-visual--${id}`} aria-hidden>
                      <FormatCardVisual formatId={id} />
                    </div>
                    <div className="land-bottom-format-shade" aria-hidden />
                    <div className="land-bottom-format-body">
                      <h3 className="land-bottom-format-title">{title}</h3>
                      <p className="land-bottom-format-desc">{desc}</p>
                    </div>
                  </article>
                ))}
              </motion.div>
            </AnimatePresence>
            <div className="land-bottom-formats-nav">
              <button
                type="button"
                className="land-bottom-formats-nav-btn"
                onClick={() => flipFormats(-1)}
                aria-label={t('landing.aboutSlidePrev')}
              >
                <ChevronLeft size={18} strokeWidth={2.25} />
              </button>
              <button
                type="button"
                className="land-bottom-formats-nav-btn land-bottom-formats-nav-btn--primary"
                onClick={() => flipFormats(1)}
                aria-label={t('landing.aboutSlideNext')}
              >
                <ChevronRight size={18} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="land-bottom-info" aria-label={t('landing.infoSectionAria')}>
        <section className="land-bottom-banner" aria-label={t('landing.ctaBannerAria')}>
          <div className="land-bottom-banner-inner">
            <p className="land-bottom-banner-quote">{t('landing.ctaBannerQuote')}</p>

            <div className="land-bottom-banner-community">
              <div className="land-bottom-banner-avatars" aria-hidden>
                {CTA_COMMUNITY_AVATARS.map((src) => (
                  <img key={src} src={src} alt="" />
                ))}
              </div>
              <p className="land-bottom-banner-community-text">{t('landing.ctaBannerCommunity')}</p>
            </div>

            <button type="button" className="land-bottom-banner-btn" onClick={openJoin}>
              {t('landing.previewJoin')}
              <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}
