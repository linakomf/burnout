import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Heart, Play } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { natureAt, SPACE_NATURE_HERO_REF } from './spaceNatureImagery';

const MEDITATION_VIDEO = `${process.env.PUBLIC_URL}/media/meditation-spotlight.mp4`;

const CATEGORIES = [
  {
    id: 'films',
    path: '/practices/films',
    title: 'Фильмы',
    description:
      'Подборки для тревожности, выгорания и восстановления — смотрите сразу в приложении.',
    image: natureAt(10),
  },
  {
    id: 'meditation',
    path: '/practices/meditation',
    title: 'Медитации',
    description: 'Короткие практики дыхания, фокуса и заземления для ежедневного баланса.',
    videoSrc: MEDITATION_VIDEO,
  },
  {
    id: 'podcasts',
    path: '/practices/podcasts',
    title: 'Подкасты',
    description: 'Спокойные выпуски про тревогу, выгорание и мягкую саморегуляцию.',
    image: natureAt(11),
  },
  {
    id: 'music',
    path: '/practices/music',
    title: 'Музыка',
    description: 'Плейлисты для фокуса, сна и спокойствия — слушайте прямо в разделе.',
    image: natureAt(12),
  },
  {
    id: 'events',
    path: '/practices/events',
    title: 'События',
    description: 'Идеи микрособытий и планов, которые возвращают ощущение жизни вне рутины.',
    image: natureAt(13),
  },
  {
    id: 'articles',
    path: '/practices/articles',
    title: 'Статьи',
    description: 'Выгорание на работе и в учёбе: признаки, восстановление и профилактика — для взрослых и студентов.',
    image: natureAt(14),
  },
];

const HERO_PHOTO = SPACE_NATURE_HERO_REF;

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
          style={{ backgroundImage: `url(${HERO_PHOTO})`, y: heroPhotoY, scale: heroPhotoScale }}
          aria-hidden
        />
        <motion.div
          className="practices-landing-hero-airwash"
          style={{ opacity: heroWashOpacity }}
          aria-hidden
        />
        <motion.div
          className="practices-landing-hero-inner practices-landing-hero-inner--airy"
          style={{ opacity: heroInnerOpacity, y: heroInnerY }}
        >
          <p className="practices-landing-kicker practices-landing-kicker--airy">{t('pages.practicesHubKicker')}</p>
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
        <motion.article
          className="practices-hero-float-card practices-hero-float-card--plain"
          {...cardReveal(0)}
          viewport={viewOpts}
        >
          <h3 className="practices-hero-float-script">{t('pages.practicesSpaceT1Name')}</h3>
          <p className="practices-hero-float-text">{t('pages.practicesSpaceT1Quote')}</p>
        </motion.article>
        <motion.button
          type="button"
          className="practices-hero-float-card practices-hero-float-card--spotlight"
          onClick={() => navigate('/practices/meditation')}
          aria-label={t('pages.practicesSpaceSpotlightAria')}
          {...cardReveal(0.18)}
          viewport={viewOpts}
        >
          <div className="practices-spotlight-scene" aria-hidden>
            <video
              className="practices-spotlight-video"
              src={MEDITATION_VIDEO}
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
          <p className="practices-spotlight-title">{t('pages.practicesSpaceSpotlightTitle')}</p>
          <p className="practices-spotlight-sub">{t('pages.practicesSpaceSpotlightSub')}</p>
          <span className="practices-spotlight-play" aria-hidden>
            <Play size={22} strokeWidth={2.4} fill="currentColor" />
          </span>
        </motion.button>
        <motion.article
          className="practices-hero-float-card practices-hero-float-card--plain"
          {...cardReveal(0.32)}
          viewport={viewOpts}
        >
          <h3 className="practices-hero-float-script">{t('pages.practicesSpaceT3Name')}</h3>
          <p className="practices-hero-float-text">{t('pages.practicesSpaceT3Quote')}</p>
        </motion.article>
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
          <span className="practices-section-eyebrow">
            <Heart className="practices-section-heart" size={15} strokeWidth={2.4} aria-hidden />
            {t('pages.practicesSpaceSectionEyebrow')}
          </span>
          <span className="practices-section-head-lines">
            <span className="practices-section-line">{t('pages.practicesSpaceHeadL1')}</span>
            <span className="practices-section-line">
              {t('pages.practicesSpaceHeadL2a')}
              <span className="practices-space-pill practices-space-pill--sky" aria-hidden />
              {t('pages.practicesSpaceHeadL2b')}
            </span>
            <span className="practices-section-line">
              {t('pages.practicesSpaceHeadL3a')}
              <span className="practices-space-pill practices-space-pill--mist" aria-hidden />
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
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.id}
              type="button"
              className="practices-landing-tile"
              variants={tileMotion}
              onClick={() => navigate(cat.path)}
              aria-label={`${cat.title}. ${cat.description}`}
            >
              <span className="practices-landing-tile-media" aria-hidden>
                {cat.videoSrc ? (
                  <video
                    className="practices-landing-tile-video"
                    src={cat.videoSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <span
                    className="practices-landing-tile-cover"
                    style={{ backgroundImage: `url(${cat.image})` }}
                    aria-hidden
                  />
                )}
              </span>
              <span className="practices-landing-tile-body">
                <strong>{cat.title}</strong>
                <span className="practices-landing-tile-desc">{cat.description}</span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </section>
    </div>
  );
}

export default PracticesHome;
