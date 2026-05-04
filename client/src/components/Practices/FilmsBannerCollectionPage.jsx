import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { natureAt } from './spaceNatureImagery';

const COLLECTIONS = {
  'banner-1': {
    kicker: 'Мягкий вечер',
    title: 'Мягкий вечер',
    lead: 'Фильмы, которые помогают переключиться после насыщенного дня, немного выдохнуть и провести вечер в спокойной атмосфере.',
    cards: [
      {
        title: 'Амели',
        sub: 'История мечтательной девушки из Парижа, которая незаметно помогает людям вокруг себя и учится открываться собственным чувствам.',
        image: natureAt(110),
      },
      {
        title: '1+1',
        sub: 'Богатый мужчина после несчастного случая нанимает помощника, и между ними появляется неожиданная дружба, меняющая жизнь обоих.',
        image: natureAt(111),
      },
      {
        title: 'Отпуск по обмену',
        sub: 'Две женщины из разных стран меняются домами на время отпуска, чтобы отвлечься от проблем и начать жизнь с нового настроения.',
        image: natureAt(112),
      },
      {
        title: 'Паддингтон',
        sub: 'Добрый медвежонок приезжает в Лондон и попадает в семью, где его ждут смешные ситуации, приключения и тепло.',
        image: natureAt(113),
      },
      {
        title: 'Полночь в Париже',
        sub: 'Лёгкая и уютная история о поиске вдохновения, которая мягко переключает мысли и возвращает ощущение внутреннего покоя.',
        image: natureAt(114),
      },
      {
        title: 'Джули и Джулия',
        sub: 'Тёплый фильм о маленьких шагах и поддержке себя в повседневности, когда хочется вернуть вкус к жизни.',
        image: natureAt(115),
      },
    ],
  },
  'banner-2': {
    kicker: 'Вернуть силы',
    title: 'Вернуть силы',
    lead: 'Подборка для дней, когда чувствуешь усталость и выгорание.',
    cards: [
      {
        title: 'Душа',
        sub: 'Учитель музыки мечтает стать джазовым музыкантом, но неожиданно попадает в необычный мир, где начинает по-новому понимать жизнь и её смысл.',
        image: natureAt(120),
      },
      {
        title: 'Стажёр',
        sub: 'Пожилой мужчина становится стажёром в современной компании и помогает молодой руководительнице справляться с работой, усталостью и давлением.',
        image: natureAt(121),
      },
      {
        title: 'Всегда говори «Да»',
        sub: 'Мужчина, привыкший отказываться от всего нового, решает говорить «да» любым возможностям и постепенно меняет свою жизнь.',
        image: natureAt(122),
      },
      {
        title: 'Форрест Гамп',
        sub: 'История доброго и простого человека, который проходит через важные события жизни, не теряя искренности, любви и веры в лучшее.',
        image: natureAt(123),
      },
      {
        title: 'Невероятная жизнь Уолтера Митти',
        sub: 'Фильм о внутреннем перезапуске и смелости выйти из рутины, когда кажется, что силы на нуле.',
        image: natureAt(124),
      },
      {
        title: 'Вселенная Стивена Хокинга',
        sub: 'История стойкости и силы духа, которая помогает по-новому взглянуть на трудности и сохранить мотивацию.',
        image: natureAt(125),
      },
    ],
  },
};

function FilmsBannerCollectionPage() {
  const navigate = useNavigate();
  const { bannerId } = useParams();
  const { t } = useLanguage();
  const data = COLLECTIONS[bannerId] || COLLECTIONS['banner-1'];

  return (
    <section className="films-collection-page fade-in">
      <button type="button" className="flix-back" onClick={() => navigate('/practices/films')}>
        <ArrowLeft size={18} strokeWidth={2} aria-hidden />
        {t('pages.practicesBackToHub')}
      </button>

      <section className="practices-landing-services films-collection-services">
        <div className="films-collection-hero" aria-hidden>
          <svg className="films-collection-heart-svg" viewBox="0 0 320 250" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M160 228 C 45 146 8 114 8 70 C 8 36 35 10 68 10 C 103 10 128 30 160 62 C 192 30 217 10 252 10 C 285 10 312 36 312 70 C 312 114 275 146 160 228 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="8 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            className="films-collection-wave-svg"
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 112 C 220 42 420 192 610 132 C 820 72 1030 190 1200 148"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="7 11"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            className="films-collection-wave-svg films-collection-wave-svg--lower"
            viewBox="0 0 1200 220"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 124 C 220 182 430 56 620 112 C 840 168 1050 70 1200 122"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="7 11"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <header className="films-collection-headline">
          <h2 className="films-collection-headline-title">
            {data.title}
            <span className="films-collection-headline-cloud" aria-hidden>
              ☁
            </span>
          </h2>
          <p className="films-collection-headline-lead">{data.lead}</p>
        </header>

        <div className="practices-landing-stagger">
          {data.cards.map((card, index) => (
            <article key={`${card.title}-${index}`} className="practices-landing-tile">
              <span
                className="practices-landing-tile-media"
                style={{ backgroundImage: `url(${card.image})` }}
                aria-hidden
              />
              <span className="practices-landing-tile-body">
                <strong>{card.title}</strong>
                <span className="practices-landing-tile-desc">{card.sub}</span>
              </span>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default FilmsBannerCollectionPage;
