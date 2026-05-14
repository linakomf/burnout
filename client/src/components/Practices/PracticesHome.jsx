import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  SPACE_NATURE_HERO_REF,
  SPACE_PRACTICES_HERO_VIDEO,
  SPACE_PRACTICES_PILL_SKY_VIDEO,
  SPACE_PRACTICES_PILL_SKY_POSTER,
  SPACE_PRACTICES_PILL_MIST_VIDEO,
  SPACE_PRACTICES_PILL_MIST_POSTER,
} from './spaceNatureImagery';

const practiceCategoryPaperSrc = (id) =>
  `${process.env.PUBLIC_URL || ''}/images/practices/category-${id}.png`;

const POCKET_LABEL = {
  films: 'Films',
  meditation: 'Meditation',
  podcasts: 'Podcasts',
  music: 'Music',
  events: 'Events',
  articles: 'Articles',
};

const CATEGORIES = [
  { id: 'films', path: '/practices/films', image: practiceCategoryPaperSrc('films'), featured: false },
  { id: 'meditation', path: '/practices/meditation', image: practiceCategoryPaperSrc('meditation'), featured: true },
  { id: 'podcasts', path: '/practices/podcasts', image: practiceCategoryPaperSrc('podcasts'), featured: false },
  { id: 'music', path: '/practices/music', image: practiceCategoryPaperSrc('music'), featured: false },
  { id: 'events', path: '/practices/events', image: practiceCategoryPaperSrc('events'), featured: false },
  { id: 'articles', path: '/practices/articles', image: practiceCategoryPaperSrc('articles'), featured: false },
];

const tileContainerMotion = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.06 },
  },
};

const springReveal = (delay = 0, stiffness = 95, damping = 18) => ({
  type: 'spring',
  stiffness,
  damping,
  delay,
});

/** Три белые карточки под героем: заголовок + короткий текст (ключи локалей T1 / T2 / T3). */
function PracticesSpaceAnnaFloatCard({
  revealProps,
  viewport,
  nameKey = 'pages.practicesSpaceT1Name',
  quoteKey = 'pages.practicesSpaceT1Quote',
}) {
  const { t } = useLanguage();
  return (
    <motion.article
      className="practices-hero-float-card practices-hero-float-card--plain"
      {...revealProps}
      viewport={viewport}
    >
      <h3 className="practices-hero-float-script">{t(nameKey)}</h3>
      <p className="practices-hero-float-text">{t(quoteKey)}</p>
    </motion.article>
  );
}

/** Карточка категории: «лист» (только фото) + мягкий «карман» с волнистым краем. */
function PracticesPocketTileFace({ cat, t }) {
  const label = POCKET_LABEL[cat.id];
  const title = t(`pages.practicesPocket${label}Title`);
  const desc = t(`pages.practicesPocket${label}Desc`);

  return (
    <div className="category-card">
      <div className="category-paper">
        <img className="paper-image" src={cat.image} alt="" />
      </div>

      <div className="category-pocket">
        <div className="pocket-content">
          <div className="pocket-label">{t('pages.practicesPocketCategoryEyebrow')}</div>
          <h2 className="pocket-title">{title}</h2>

          <p className="pocket-description">{desc}</p>

          <div className="pocket-tags">
            <span>{t(`pages.practicesPocket${label}Pill1`)}</span>
            <span>{t(`pages.practicesPocket${label}Pill2`)}</span>
            <span>{t(`pages.practicesPocket${label}Pill3`)}</span>
          </div>

          <div className="pocket-divider" />
        </div>
      </div>
    </div>
  );
}

function PracticesHome() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const gridRef = useRef(null);
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const reduce = Boolean(prefersReducedMotion);

  const { scrollY } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'center start'],
  });

  const heroParallaxFromProgress = useTransform(heroProgress, [0, 1], reduce ? [0, 0] : [0, 1]);
  const scrollParallaxBoost = useTransform(scrollY, (sy) => (reduce ? 0 : Math.min(sy, 700) * 0.44));

  const heroPhotoY = useTransform(
    [heroParallaxFromProgress, scrollParallaxBoost],
    ([hp, sb]) => hp * 320 + sb
  );
  const heroPhotoScale = useTransform(heroProgress, [0, 1], reduce ? [1, 1] : [1, 1.28]);
  const heroFlowersY = useTransform(
    [heroParallaxFromProgress, scrollParallaxBoost],
    ([hp, sb]) => hp * -165 + sb * -0.55
  );
  const heroInnerOpacity = useTransform(heroProgress, [0, 0.12, 0.38], reduce ? [1, 1, 1] : [1, 0.38, 0]);
  const heroInnerY = useTransform(heroProgress, [0, 1], reduce ? [0, 0] : [0, -150]);
  const heroWashOpacity = useTransform(heroProgress, [0, 0.32], reduce ? [1, 1] : [1, 0.22]);

  const tileMotion = reduce
    ? { hidden: { opacity: 1, y: 0, scale: 1 }, show: { opacity: 1, y: 0, scale: 1 } }
    : {
        hidden: { opacity: 0, y: 140, scale: 0.84 },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: springReveal(0, 102, 15),
        },
      };

  const cardReveal = (delay = 0) =>
    reduce
      ? { initial: { opacity: 1, y: 0, scale: 1 }, whileInView: { opacity: 1, y: 0, scale: 1 } }
      : {
          initial: { opacity: 0, y: 160, scale: 0.82 },
          whileInView: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: springReveal(delay, 96, 15),
          },
        };

  /* Срабатываем раньше, пока блок только входит в экран */
  const viewOpts = { once: true, amount: 0.02, margin: '140px 0px 0px 0px' };

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="practices-landing practices-landing--airy fade-in">
      <div ref={heroRef} className="practices-landing-hero practices-landing-hero--airy">
        <motion.div className="practices-landing-hero-flowers" style={{ y: heroFlowersY }} aria-hidden>
          <span className="practices-flower practices-flower--1" />
          <span className="practices-flower practices-flower--2" />
          <span className="practices-flower practices-flower--3" />
          <span className="practices-flower practices-flower--4" />
        </motion.div>
        <motion.div
          className="practices-landing-hero-photo"
          style={{ y: heroPhotoY, scale: heroPhotoScale }}
          aria-hidden
        >
          {reduce ? (
            <img
              src={SPACE_NATURE_HERO_REF}
              alt=""
              className="practices-landing-hero-photo-media"
              decoding="async"
            />
          ) : (
            <video
              className="practices-landing-hero-photo-media"
              autoPlay
              muted
              loop
              playsInline
              poster={SPACE_NATURE_HERO_REF}
            >
              <source src={SPACE_PRACTICES_HERO_VIDEO} type="video/mp4" />
            </video>
          )}
        </motion.div>
        <motion.div
          className="practices-landing-hero-airwash"
          style={{ opacity: heroWashOpacity }}
          aria-hidden
        />
        <motion.div
          className="practices-landing-hero-inner practices-landing-hero-inner--airy"
          style={{ opacity: heroInnerOpacity, y: heroInnerY }}
        >
          <h1 className="practices-hero-title practices-hero-title--airy">
            {t('pages.practicesSpaceHeroLine1')}{' '}
            <span className="practices-hero-script">{t('pages.practicesSpaceHeroScript')}</span>
            {t('pages.practicesSpaceHeroLine2')}
          </h1>
          <p className="practices-landing-lead practices-landing-lead--airy">{t('pages.practicesSpaceHeroLead')}</p>
          <button type="button" className="practices-space-cta" onClick={scrollToGrid}>
            <span className="practices-space-cta-label">{t('pages.practicesSpaceCta')}</span>
            <span className="practices-space-cta-icon" aria-hidden>
              <ArrowRight size={20} strokeWidth={2.5} />
            </span>
          </button>
        </motion.div>
      </div>

      <div className="practices-landing-testimonials">
        <PracticesSpaceAnnaFloatCard revealProps={cardReveal(0)} viewport={viewOpts} />
        <PracticesSpaceAnnaFloatCard
          revealProps={cardReveal(0.18)}
          viewport={viewOpts}
          nameKey="pages.practicesSpaceT2Name"
          quoteKey="pages.practicesSpaceT2Quote"
        />
        <PracticesSpaceAnnaFloatCard
          revealProps={cardReveal(0.32)}
          viewport={viewOpts}
          nameKey="pages.practicesSpaceT3Name"
          quoteKey="pages.practicesSpaceT3Quote"
        />
      </div>

      <section className="practices-landing-services" ref={gridRef} id="practices-space-grid">
        <div className="practices-landing-services-deco" aria-hidden>
          <svg className="practices-wave-doodle" viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 100 C 200 40 400 160 600 100 S 1000 40 1200 100"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeDasharray="3 12"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <motion.h2
          className="practices-landing-section-head--dream"
          initial={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 104, scale: 0.88 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduce ? { duration: 0 } : springReveal(0, 94, 14)}
          viewport={viewOpts}
        >
          <span className="practices-section-head-lines">
            <span className="practices-section-line">{t('pages.practicesSpaceHeadL1')}</span>
            <span className="practices-section-line">
              {t('pages.practicesSpaceHeadL2a')}
              {reduce ? (
                <span
                  className="practices-space-pill practices-space-pill--sky practices-space-pill--sky-static"
                  aria-hidden
                />
              ) : (
                <span className="practices-space-pill practices-space-pill--sky" aria-hidden>
                  <video
                    className="practices-space-pill-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={SPACE_PRACTICES_PILL_SKY_POSTER}
                  >
                    <source src={SPACE_PRACTICES_PILL_SKY_VIDEO} type="video/mp4" />
                  </video>
                </span>
              )}
              {t('pages.practicesSpaceHeadL2b')}
            </span>
            <span className="practices-section-line">
              {t('pages.practicesSpaceHeadL3a')}
              {reduce ? (
                <span
                  className="practices-space-pill practices-space-pill--mist practices-space-pill--mist-static"
                  aria-hidden
                />
              ) : (
                <span className="practices-space-pill practices-space-pill--mist" aria-hidden>
                  <video
                    className="practices-space-pill-video practices-space-pill-video--mist"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={SPACE_PRACTICES_PILL_MIST_POSTER}
                  >
                    <source src={SPACE_PRACTICES_PILL_MIST_VIDEO} type="video/mp4" />
                  </video>
                </span>
              )}
              {t('pages.practicesSpaceHeadL3b')}
            </span>
            <span className="practices-section-line practices-section-line--serif">{t('pages.practicesSpaceHeadL4')}</span>
          </span>
        </motion.h2>

        <motion.div
          className="practices-landing-stagger"
          variants={tileContainerMotion}
          initial="hidden"
          whileInView="show"
          viewport={viewOpts}
        >
          {CATEGORIES.map((cat) => {
            const L = POCKET_LABEL[cat.id];
            const ariaTitle = t(`pages.practicesPocket${L}Title`);
            const ariaDesc = t(`pages.practicesPocket${L}Desc`);
            return (
              <motion.div
                key={cat.id}
                className={`practices-landing-tile practices-landing-tile--pocket practices-landing-tile--theme-${cat.id}${
                  cat.featured ? ' practices-landing-tile--featured' : ''
                }`}
                variants={tileMotion}
                onClick={() => navigate(cat.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(cat.path);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${ariaTitle}. ${ariaDesc}`}
              >
                <PracticesPocketTileFace cat={cat} t={t} />
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}

export default PracticesHome;
