/** Чтение: статьи (темы) и книги (жанровые категории) */
import { natureAt, spaceNature } from './spaceNatureImagery';

/** Для вкладки «Статьи» — плашки фильтрации */
export const ARTICLE_CATEGORY_IDS = [
  'burnout',
  'stress',
  'anxiety',
  'motivation',
  'rest',
  'balance',
  'emotions',
  'communication',
];

/** Для вкладки «Книги» */
export const BOOK_CATEGORY_IDS = [
  'psychology',
  'selfgrowth',
  'readsmotive',
  'lightread',
  'restreads',
  'fiction',
  'biography',
  'inspire',
];

/** Для админки — фильтры статей */
export const ARTICLE_FILTER_OPTIONS = [
  { id: 'burnout', labelKey: 'articlesFilterBurnout' },
  { id: 'stress', labelKey: 'articlesFilterStress' },
  { id: 'anxiety', labelKey: 'articlesFilterAnxiety' },
  { id: 'motivation', labelKey: 'articlesFilterMotivation' },
  { id: 'rest', labelKey: 'articlesFilterRest' },
  { id: 'balance', labelKey: 'articlesFilterBalance' },
  { id: 'emotions', labelKey: 'articlesFilterEmotions' },
  { id: 'communication', labelKey: 'articlesFilterCommunication' },
];

/** Для админки — фильтры книг */
export const BOOK_FILTER_OPTIONS = [
  { id: 'psychology', labelKey: 'booksFilterPsychology' },
  { id: 'selfgrowth', labelKey: 'booksFilterSelfgrowth' },
  { id: 'readsmotive', labelKey: 'booksFilterReadsmotive' },
  { id: 'lightread', labelKey: 'booksFilterLightread' },
  { id: 'restreads', labelKey: 'booksFilterRestreads' },
  { id: 'fiction', labelKey: 'booksFilterFiction' },
  { id: 'biography', labelKey: 'booksFilterBiography' },
  { id: 'inspire', labelKey: 'booksFilterInspire' },
];

export const READING_KIND_OPTIONS = [
  { id: 'article', label: 'Статья' },
  { id: 'book', label: 'Книга' },
];

export function isRemoteArticleId(id) {
  return /^article-\d+$/.test(String(id || ''));
}

export function isRemoteBookId(id) {
  return /^book-\d+$/.test(String(id || ''));
}

export function mapRemoteArticlePayload(row, toUrl) {
  const urlFn = toUrl || ((p) => p);
  return {
    id: row.id,
    kind: 'article',
    category: row.category || 'burnout',
    title: row.title || '',
    titleKey: null,
    descriptionShort: row.descriptionShort || '',
    bodyFull: row.bodyFull || '',
    url: row.sourceUrl || '',
    image: urlFn(row.coverImage),
    isRemoteReading: true,
  };
}

export function mapRemoteBookPayload(row, toUrl) {
  const urlFn = toUrl || ((p) => p);
  return {
    id: row.id,
    kind: 'book',
    bookCategory: row.category || 'psychology',
    title: row.title || '',
    titleKey: null,
    descriptionShort: row.descriptionShort || '',
    url: row.readUrl || '',
    image: urlFn(row.coverImage),
    isRemoteReading: true,
  };
}

export function readingItemTitle(item, t) {
  if (item.title) return item.title;
  if (item.titleKey) return t(`pages.${item.titleKey}`);
  return '';
}

export function readingItemCategoryLabel(item, t) {
  if (item.kind === 'book' || item.bookCategory) {
    const cat = item.bookCategory || item.category;
    return cat ? t(`pages.booksCat${cat}`) : '';
  }
  const cat = item.category;
  return cat ? t(`pages.articlesCat${cat}`) : '';
}

const ARTICLES_LIBRARY_CORE = [
  {
    id: 'ab1',
    category: 'burnout',
    titleKey: 'articlesBook1Title',
    url: 'https://www.who.int/news-room/questions-and-answers/item/burn-out-an-occupational-phenomenon',
  },
  {
    id: 'ab2',
    category: 'communication',
    titleKey: 'articlesBook2Title',
    url: 'https://www.apa.org/monitor/2021/11/young-people-burnout',
  },
  {
    id: 'ab3',
    category: 'rest',
    titleKey: 'articlesBook3Title',
    url: 'https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/burnout/art-20046642',
  },
  {
    id: 'ab4',
    category: 'burnout',
    titleKey: 'articlesBook4Title',
    url: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/burnout/what-is-burnout/',
  },
  {
    id: 'ab5',
    category: 'stress',
    titleKey: 'articlesBook5Title',
    url: 'https://www.apa.org/topics/job-stress',
  },
  {
    id: 'ab6',
    category: 'emotions',
    titleKey: 'articlesBook6Title',
    url: 'https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/student-mental-health',
  },
  {
    id: 'ab7',
    category: 'rest',
    titleKey: 'articlesBook7Title',
    url: 'https://www.sleepfoundation.org/mental-health/burnout-and-insomnia',
  },
  {
    id: 'ab8',
    category: 'emotions',
    titleKey: 'articlesBook8Title',
    url: 'https://www.nimh.nih.gov/health/topics/depression',
  },
  {
    id: 'ab9',
    category: 'burnout',
    titleKey: 'articlesBook9Title',
    url: 'https://www.cdc.gov/vitalsigns/burnout-syndrome/index.html',
  },
  {
    id: 'ab10',
    category: 'motivation',
    titleKey: 'articlesBook10Title',
    url: 'https://www.apa.org/gradpsych/2011/11/cover-perfectionism',
  },
  {
    id: 'ab11',
    category: 'balance',
    titleKey: 'articlesBook11Title',
    url: 'https://www.helpguide.org/articles/stress/burnout-prevention-and-recovery.htm',
  },
  {
    id: 'ab12',
    category: 'stress',
    titleKey: 'articlesBook12Title',
    url: 'https://www.health.harvard.edu/blog/stress-damages-the-brain-and-body-even-young-adults-201406096499',
  },
  {
    id: 'ab13',
    category: 'burnout',
    titleKey: 'articlesBook13Title',
    url: 'https://www.apa.org/monitor/2021/01/trends-burnout',
  },
  {
    id: 'ab14',
    category: 'stress',
    titleKey: 'articlesBook14Title',
    url: 'https://www.apa.org/topics/stress/tips',
  },
  {
    id: 'ab15',
    category: 'balance',
    titleKey: 'articlesBook15Title',
    url: 'https://www.apa.org/pi/about/newsletter/articles/stress-resilience',
  },
  {
    id: 'ab16',
    category: 'balance',
    titleKey: 'articlesBook16Title',
    url: 'https://www.helpguide.org/articles/addictions/phone-computer-internet-addiction.htm',
  },
  {
    id: 'ab17',
    category: 'motivation',
    titleKey: 'articlesBook17Title',
    url: 'https://www.apa.org/gradpsych/2015/11/cover-burnout',
  },
  {
    id: 'ab18',
    category: 'burnout',
    titleKey: 'articlesBook18Title',
    url: 'https://www.who.int/standards/classifications/frequently-asked-questions/burn-out-an-occupational-phenomenon/',
  },
  {
    id: 'ab19',
    category: 'anxiety',
    titleKey: 'articlesBook19Title',
    url: 'https://www.apa.org/topics/anxiety',
  },
];

export const ARTICLES_LIBRARY = ARTICLES_LIBRARY_CORE.map((row, index) => ({
  ...row,
  kind: 'article',
  image: natureAt(index + 80),
}));

const BOOKS_LIBRARY_CORE = [
  {
    id: 'bk1',
    bookCategory: 'psychology',
    titleKey: 'booksItemPsych1Title',
    url: 'https://www.goodreads.com/book/show/1134367.Man_s_Search_for_Meaning',
  },
  {
    id: 'bk2',
    bookCategory: 'selfgrowth',
    titleKey: 'booksItemSelf1Title',
    url: 'https://en.wikipedia.org/wiki/How_to_Win_Friends_and_Influence_People',
  },
  {
    id: 'bk3',
    bookCategory: 'readsmotive',
    titleKey: 'booksItemMotive1Title',
    url: 'https://en.wikipedia.org/wiki/Atomic_Habits',
  },
  {
    id: 'bk4',
    bookCategory: 'lightread',
    titleKey: 'booksItemLight1Title',
    url: 'https://en.wikipedia.org/wiki/The_Little_Prince',
  },
  {
    id: 'bk5',
    bookCategory: 'restreads',
    titleKey: 'booksItemRest1Title',
    url: 'https://en.wikipedia.org/wiki/The_Guernsey_Literary_and_Potato_Peel_Pie_Society',
  },
  {
    id: 'bk6',
    bookCategory: 'fiction',
    titleKey: 'booksItemFic1Title',
    url: 'https://www.gutenberg.org/ebooks/1342',
  },
  {
    id: 'bk7',
    bookCategory: 'biography',
    titleKey: 'booksItemBio1Title',
    url: 'https://en.wikipedia.org/wiki/Becoming_(book)',
  },
  {
    id: 'bk8',
    bookCategory: 'inspire',
    titleKey: 'booksItemInsp1Title',
    url: 'https://en.wikipedia.org/wiki/Educated_(memoir)',
  },
  {
    id: 'bk9',
    bookCategory: 'psychology',
    titleKey: 'booksItemPsych2Title',
    url: 'https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow',
  },
  {
    id: 'bk10',
    bookCategory: 'selfgrowth',
    titleKey: 'booksItemSelf2Title',
    url: 'https://en.wikipedia.org/wiki/The_7_Habits_of_Highly_Effective_People',
  },
  {
    id: 'bk11',
    bookCategory: 'readsmotive',
    titleKey: 'booksItemMotive2Title',
    url: 'https://en.wikipedia.org/wiki/Drive_(Pink_book)',
  },
  {
    id: 'bk12',
    bookCategory: 'lightread',
    titleKey: 'booksItemLight2Title',
    url: 'https://www.gutenberg.org/ebooks/11',
  },
  {
    id: 'bk13',
    bookCategory: 'restreads',
    titleKey: 'booksItemRest2Title',
    url: 'https://en.wikipedia.org/wiki/The_Alchemist_(novel)',
  },
  {
    id: 'bk14',
    bookCategory: 'fiction',
    titleKey: 'booksItemFic2Title',
    url: 'https://www.gutenberg.org/ebooks/2554',
  },
  {
    id: 'bk15',
    bookCategory: 'biography',
    titleKey: 'booksItemBio2Title',
    url: 'https://en.wikipedia.org/wiki/The_Diary_of_a_Young_Girl',
  },
  {
    id: 'bk16',
    bookCategory: 'inspire',
    titleKey: 'booksItemInsp2Title',
    url: 'https://en.wikipedia.org/wiki/Wild:_From_Lost_to_Found_on_the_Pacific_Crest_Trail',
  },
];

export const BOOKS_LIBRARY = BOOKS_LIBRARY_CORE.map((row, index) => ({
  ...row,
  kind: 'book',
  image: natureAt(index + 200),
}));

export const READING_LIBRARY = [...ARTICLES_LIBRARY, ...BOOKS_LIBRARY];

/** @param {Array} pool @param {'article' | 'book'} contentKind @param {string} pillId */
export function filterReadingList(pool, contentKind, pillId) {
  const items = pool.filter((item) => item.kind === contentKind);
  if (pillId === 'all') return items;
  if (contentKind === 'article') return items.filter((item) => item.category === pillId);
  return items.filter((item) => item.bookCategory === pillId);
}

/** @param {'article' | 'book'} contentKind @param {string} pillId */
export function filterReadingHub(contentKind, pillId) {
  return filterReadingList(READING_LIBRARY, contentKind, pillId);
}

export function getFilteredArticles(categoryId) {
  return filterReadingHub('article', categoryId);
}

export function getArticleById(rawId) {
  const id = String(rawId || '').trim();
  return ARTICLES_LIBRARY.find((a) => a.id === id) || null;
}

export function getBookById(rawId) {
  const id = String(rawId || '').trim();
  return BOOKS_LIBRARY.find((b) => b.id === id) || null;
}

/** По ключу заголовка: pages.articlesBook1Title → articlesBook1Summary */
export function articleSummaryLocaleKey(titleKey) {
  if (!titleKey || typeof titleKey !== 'string') return '';
  return titleKey.endsWith('Title') ? `${titleKey.slice(0, -5)}Summary` : '';
}

/** pages.booksItemPsych1Title → booksItemPsych1Desc */
export function bookDescLocaleKey(titleKey) {
  if (!titleKey || typeof titleKey !== 'string') return '';
  return titleKey.endsWith('Title') ? `${titleKey.slice(0, -5)}Desc` : '';
}

export const HERO_BG = spaceNature.articlesHero;

export const BOOKS_PER_SHELF = 5;

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
