/** Категории: понимание выгорания, студенты, взрослые/работа, восстановление */
import { natureAt, spaceNature } from './spaceNatureImagery';

export const ARTICLE_CATEGORY_IDS = ['science', 'students', 'adults', 'recovery'];

const ARTICLES_LIBRARY_CORE = [
  {
    id: 'ab1',
    category: 'science',
    titleKey: 'articlesBook1Title',
    url: 'https://www.who.int/news-room/questions-and-answers/item/burn-out-an-occupational-phenomenon',
  },
  {
    id: 'ab2',
    category: 'students',
    titleKey: 'articlesBook2Title',
    url: 'https://www.apa.org/monitor/2021/11/young-people-burnout',
  },
  {
    id: 'ab3',
    category: 'recovery',
    titleKey: 'articlesBook3Title',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/burnout/art-20046642',
  },
  {
    id: 'ab4',
    category: 'science',
    titleKey: 'articlesBook4Title',
    url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/burnout/what-is-burnout/',
  },
  {
    id: 'ab5',
    category: 'adults',
    titleKey: 'articlesBook5Title',
    url: 'https://www.apa.org/topics/job-stress',
  },
  {
    id: 'ab6',
    category: 'students',
    titleKey: 'articlesBook6Title',
    url: 'https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/student-mental-health',
  },
  {
    id: 'ab7',
    category: 'recovery',
    titleKey: 'articlesBook7Title',
    url: 'https://www.sleepfoundation.org/mental-health/burnout-and-insomnia',
  },
  {
    id: 'ab8',
    category: 'adults',
    titleKey: 'articlesBook8Title',
    url: 'https://www.nimh.nih.gov/health/topics/depression',
  },
  {
    id: 'ab9',
    category: 'adults',
    titleKey: 'articlesBook9Title',
    url: 'https://www.cdc.gov/vitalsigns/burnout-syndrome/index.html',
  },
  {
    id: 'ab10',
    category: 'students',
    titleKey: 'articlesBook10Title',
    url: 'https://www.apa.org/gradpsych/2011/11/cover-perfectionism',
  },
  {
    id: 'ab11',
    category: 'recovery',
    titleKey: 'articlesBook11Title',
    url: 'https://www.helpguide.org/articles/stress/burnout-prevention-and-recovery.htm',
  },
  {
    id: 'ab12',
    category: 'science',
    titleKey: 'articlesBook12Title',
    url: 'https://www.health.harvard.edu/blog/stress-damages-the-brain-and-body-even-young-adults-201406096499',
  },
  {
    id: 'ab13',
    category: 'adults',
    titleKey: 'articlesBook13Title',
    url: 'https://www.apa.org/monitor/2021/01/trends-burnout',
  },
  {
    id: 'ab14',
    category: 'recovery',
    titleKey: 'articlesBook14Title',
    url: 'https://www.apa.org/topics/stress/tips',
  },
  {
    id: 'ab15',
    category: 'adults',
    titleKey: 'articlesBook15Title',
    url: 'https://www.apa.org/pi/about/newsletter/articles/stress-resilience',
  },
  {
    id: 'ab16',
    category: 'recovery',
    titleKey: 'articlesBook16Title',
    url: 'https://www.helpguide.org/articles/addictions/phone-computer-internet-addiction.htm',
  },
  {
    id: 'ab17',
    category: 'students',
    titleKey: 'articlesBook17Title',
    url: 'https://www.apa.org/gradpsych/2015/11/cover-burnout',
  },
  {
    id: 'ab18',
    category: 'science',
    titleKey: 'articlesBook18Title',
    url: 'https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon/',
  },
];

/**
 * Материалы о выгорании и восстановлении (взрослые и студенты).
 * @type {Array<{ id: string, category: string, titleKey: string, image: string, url: string }>}
 */
export const ARTICLES_LIBRARY = ARTICLES_LIBRARY_CORE.map((row, index) => ({
  ...row,
  image: natureAt(index + 80),
}));

/** Фон героя страницы статей */
export const HERO_BG = spaceNature.articlesHero;

export function getFilteredArticles(categoryId) {
  if (categoryId === 'all') return [...ARTICLES_LIBRARY];
  return ARTICLES_LIBRARY.filter((a) => a.category === categoryId);
}

/** Сколько «книг» на одной полке */
export const BOOKS_PER_SHELF = 6;

export function buildShelves(list) {
  if (!list.length) return [[], [], []];
  const per = BOOKS_PER_SHELF;
  const need = per * 3;
  const extended = [];
  for (let i = 0; i < need; i += 1) {
    extended.push(list[i % list.length]);
  }
  return [extended.slice(0, per), extended.slice(per, per * 2), extended.slice(per * 2, per * 3)];
}
