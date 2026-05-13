import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Cloud,
  Heart,
  Send,
  Star
} from 'lucide-react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { mergeTestRu } from '../../config/testDisplayRu';
import testsHeroImg from '../../assets/tests-page-blossoms-hero.png';
import './Tests.css';

/** Порядок: более узкие категории раньше, чтобы подпись на карточке была однозначной */
const CATEGORY_LABEL_ORDER = ['burnout', 'anxiety', 'sleep', 'motivation', 'mood', 'stress', 'resource'];

const FEATURED_PREVIEW_CATEGORY_IDS = ['stress', 'mood', 'burnout'];

function pickTest(tests, preferIds) {
  if (!tests?.length) return null;
  for (const id of preferIds) {
    const t = tests.find((x) => Number(x.test_id) === id);
    if (t) return t;
  }
  return tests[0];
}

const TEST_PATHS = [
{
  key: 'heal',
  preferIds: [2, 5, 4],
  title: 'Вдохновение',
  lead: 'Короткий опрос о перегрузке и восстановлении — с прогрессом по шагам.',
  accent: 'heal'
},
{
  key: 'discover',
  preferIds: [6, 3],
  title: 'Импульс',
  lead: 'Тревога и внутреннее напряжение — взглянуть на то, что происходит сейчас.',
  accent: 'discover'
},
{
  key: 'insight',
  preferIds: [7, 5],
  title: 'Баланс дня',
  lead: 'Короткий чек-ин: настроение и ресурс — для регулярной динамики.',
  accent: 'insight'
}];

export function bucketToAccent(bucket) {
  if (bucket === 'stress') return 'heal';
  if (bucket === 'anxiety') return 'discover';
  if (bucket === 'mood') return 'insight';
  if (bucket === 'esteem') return 'heal';
  return 'plain';
}

const THEME_FILTER_IDS = ['all', 'stress', 'mood', 'burnout', 'anxiety', 'resource', 'sleep', 'motivation'];

export function matchThemeFilter(test, filterId) {
  if (filterId === 'all') return true;
  const s = `${test.title || ''} ${test.category_name || ''} ${test.description || ''}`.toLowerCase();
  const isBurnout = /выгоран|mbi|burnout|академическ|истощ|академ|exhaust/i.test(s);
  const isAnxiety = /gad-7|\bgad\b|тревог|тревож|паник|беспокой|anxi|panic/i.test(s);
  const isMood =
    getTestBucket(test) === 'mood' || /настроен|эмоцион|чек-ин|ежедневн|mood|emotion/i.test(s);
  const isResource =
    /ресурс|восстанов|практик|медитац|релакс|дыхан|mindful|resource|recover|meditat/i.test(s) ||
    getCatalogFilter(test) === 'practices';
  const isStress =
    (getTestBucket(test) === 'stress' || /стресс|pss|перегруз|напряжен|stress|overload/i.test(s)) &&
    !isBurnout;
  const isSleep =
    /сон|sleep|insomnia|бессон|засып|недосып|утомл.*сон|psqi|шкала.*сна/i.test(s);
  const isMotivation =
    /мотивац|motivat|интерес|вовлеч|апати|прокраст|goal|целеполаг|амбиц|энерг.*цел/i.test(s);

  switch (filterId) {
    case 'stress':
      return isStress && !isSleep;
    case 'burnout':
      return isBurnout;
    case 'anxiety':
      return isAnxiety;
    case 'mood':
      return isMood && !isAnxiety && !isSleep;
    case 'resource':
      return isResource;
    case 'sleep':
      return isSleep;
    case 'motivation':
      return isMotivation && !isBurnout;
    default:
      return false;
  }
}

export function primaryThemeCategoryId(test) {
  for (const id of CATEGORY_LABEL_ORDER) {
    if (matchThemeFilter(test, id)) return id;
  }
  return null;
}

function primaryCategoryLabel(test, tr) {
  const id = primaryThemeCategoryId(test);
  if (id) return tr(`testsThemeFilter.${id}`);
  return tr('testsUi.categoryGeneral');
}

function estimateMinutes(qc) {
  const n = Number(qc) || 0;
  return Math.max(1, Math.round(n * 0.38));
}

function clipText(s, max = 118) {
  if (s == null || s === '') return '';
  const t = String(s).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}


export function getTestBucket(test) {
  const s = `${test.title || ''} ${test.category_name || ''} ${test.description || ''}`.toLowerCase();
  if (/gad-7|\bgad\b|тревог|тревож|паник|беспокой|социальн/i.test(s)) return 'anxiety';
  if (/ежедневн|чек-ин|9 вопросов/i.test(s)) return 'mood';
  if (/стресс|выгоран|устал|перегруз|mbi|pss|напряжен|академическ/i.test(s)) return 'stress';
  if (/настроен|счаст|эмоцион|стабильн|радост/i.test(s)) return 'mood';
  if (/самооцен/i.test(s)) return 'esteem';
  return 'other';
}


export function getCatalogFilter(test) {
  const qc = Number(test.question_count) || 0;
  const blob = `${test.title || ''} ${test.description || ''} ${test.category_name || ''}`.toLowerCase();

  if (/практик|медитац|дыхани|релакс|mindful/i.test(blob)) return 'practices';

  if (
  /gad-7|\bgad\b|mbi|phq|pss|клиническ|диагностическ|шкал|выгоран|синдром|тревожн.*расстрой/i.test(blob))
  {
    return 'clinical';
  }

  if (qc > 0 && qc <= 9) return 'quick';
  if (/ежедневн|чек-ин|9 вопросов|быстр|коротк/i.test(blob)) return 'quick';

  if (qc >= 8 && qc <= 24) return 'basic';
  if (qc > 0) return 'basic';
  return 'other';
}

function audienceLabel(test) {
  const r = String(test.target_role || '').toLowerCase();
  if (/student|студент/i.test(r)) return 'Для студентов';
  if (/staff|персонал|препод|teacher/i.test(r)) return 'Для преподавателей';
  if (test.category_name && String(test.category_name).trim()) return String(test.category_name).trim();
  return 'Общий доступ';
}

function questionCountLabel(qc) {
  const n = Number(qc) || 0;
  const m = n % 10;
  const f = n % 100;
  let word = 'вопросов';
  if (m === 1 && f !== 11) word = 'вопрос';else
  if (m >= 2 && m <= 4 && (f < 12 || f > 14)) word = 'вопроса';
  return `${n} ${word}`;
}

function resultAccentColor(level) {
  const l = String(level || '').toLowerCase();
  if (/высок|сильн|выражен|нужен отдых|повышенн/i.test(l)) return '#e85d5d';
  if (/средн|риск|умеренн/i.test(l)) return '#e8a84a';
  if (/низк|нет признаков|стабильн|благополуч|хорош|ресурс/i.test(l)) return '#7db05a';
  const legacy = { Низкий: '#B8D48A', Средний: '#F9C74F', Высокий: '#FF6B6B' };
  return legacy[level] || '#9CAF88';
}

function parseQuestionOptions(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function resultsInPeriod(results, period) {
  if (!Array.isArray(results) || results.length === 0) return [];
  if (period !== 'month') return results;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  return results.filter((r) => {
    const ts = r?.created_at ? new Date(r.created_at).getTime() : 0;
    return ts >= t0;
  });
}

export const TestsList = () => {
  const { t } = useLanguage();
  const [tests, setTests] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [progressPeriod, setProgressPeriod] = useState('month');
  const navigate = useNavigate();

  useEffect(() => {
    api.
    get('/tests').
    then((res) => setTests(res.data || [])).
    catch(() => setTests([])).
    finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get('/tests/results/my').then((r) => setMyResults(r.data || [])).catch(() => setMyResults([]));
  }, []);

  const enriched = tests.map((row) => ({
    ...row,
    bucket: getTestBucket(row),
    catalogFilter: getCatalogFilter(row)
  }));

  const filtered =
  filter === 'all' ? enriched : enriched.filter((row) => matchThemeFilter(row, filter));

  const sortedFiltered = [...filtered].sort((a, b) => Number(a.test_id) - Number(b.test_id));

  const featuredTest = pickTest(tests, TEST_PATHS[0].preferIds);
  const featuredReady =
  featuredTest &&
  sortedFiltered.some((row) => Number(row.test_id) === Number(featuredTest.test_id));

  const ctaTest = featuredReady ? featuredTest : sortedFiltered[0] || null;
  const ctaQc = ctaTest && ctaTest.question_count != null ? Number(ctaTest.question_count) : 0;

  const gridTests =
  sortedFiltered.filter((row) => !ctaTest || Number(row.test_id) !== Number(ctaTest.test_id));

  const testsById = Object.fromEntries(enriched.map((row) => [String(row.test_id), row]));
  const periodResults = resultsInPeriod(myResults, progressPeriod);
  const progressUniqueTests = new Set(periodResults.map((r) => r.test_id)).size;
  const progressSessions = periodResults.length;
  let progressMinutes = 0;
  periodResults.forEach((r) => {
    const row = testsById[String(r.test_id)];
    const qc = row?.question_count != null ? Number(row.question_count) : 0;
    progressMinutes += estimateMinutes(qc || 10);
  });
  const progressAwards = Math.min(99, Math.max(0, Math.floor(progressSessions / 3)));

  if (loading) {
    return (
      <div className="tests-mock-page tests-mock-page--v2 tests-mock-page--loading fade-in">
        <div
          className="tests-mock-hero-photo tests-mock-hero-photo--loading"
          style={{ backgroundImage: `url(${testsHeroImg})` }}
          aria-hidden
        />
        <div className="tests-mock-sheet">
          <div className="tests-mock-sheet-notch" aria-hidden />
          <div className="tests-mock-content tests-mock-content--v2">
            <div className="tests-loading tests-loading--v2">
              <div className="loading-spinner" />
            </div>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="tests-mock-page tests-mock-page--v2 fade-in">
      <div
        className="tests-mock-hero-photo"
        style={{ backgroundImage: `url(${testsHeroImg})` }}
        role="img"
        aria-label={t('pages.testsHeroPhotoAlt')}
      />
      <div className="tests-mock-sheet">
        <div className="tests-mock-sheet-notch" aria-hidden />
        <div className="tests-mock-content tests-mock-content--v2">
          <p className="tests-mock-care">
            <Heart className="tests-mock-care-icon" size={18} strokeWidth={2} aria-hidden />
            {t('pages.testsCareLine')}
          </p>

          <header className="tests-mock-header-v2">
            <div className="tests-mock-header-main">
              <h1 className="tests-mock-title tests-mock-title--v2">
                {t('pages.testsTitle')}
                <Cloud className="tests-mock-title-cloud" size={28} strokeWidth={1.65} aria-hidden />
              </h1>
              <p className="tests-mock-lead tests-mock-lead--v2">{t('pages.testsLead')}</p>
            </div>
            <p className="tests-mock-hero-aside tests-mock-hero-aside--v2">{t('pages.testsHeroAside')}</p>
          </header>

          <div className="tests-mock-chips tests-mock-chips--v2" role="tablist" aria-label={t('pages.testsFilter')}>
            {THEME_FILTER_IDS.map((id) => {
              const active = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`tests-mock-chip tests-mock-chip--v2 ${active ? 'tests-mock-chip--active tests-mock-chip--v2-active' : ''}`}
                  onClick={() => setFilter(id)}>
                  {t(`testsThemeFilter.${id}`)}
                </button>);
            })}
          </div>

          {!tests.length &&
          <p className="tests-mock-fallback tests-mock-fallback--v2">{t('testsUi.noTests')}</p>
          }

          {tests.length > 0 &&
          <section className="tests-mock-featured tests-mock-featured--split" aria-label={t('pages.testsFeaturedAria')}>
            <div className={`tests-mock-featured-row ${!ctaTest ? 'tests-mock-featured-row--progress-only' : ''}`}>
              {ctaTest &&
              <div className="tests-mock-featured-interests">
                <div className="tests-mock-featured-interests__copy">
                  <span className="tests-mock-featured-badge">
                    <Heart className="tests-mock-featured-badge-ic" size={14} strokeWidth={2.4} aria-hidden />
                    {t('pages.testsFeaturedBadge')}
                  </span>
                  <h2 className="tests-mock-featured-title tests-mock-featured-title--interests">{t('pages.testsFeaturedTitle')}</h2>
                  <p className="tests-mock-featured-desc tests-mock-featured-desc--interests">{t('pages.testsFeaturedInterestsLead')}</p>
                  <div className="tests-mock-featured-interests__chips">
                    {FEATURED_PREVIEW_CATEGORY_IDS.map((catId) => (
                      <span key={catId} className="tests-mock-featured-interests-chip tests-mock-featured-interests-chip--text">
                        {t(`testsThemeFilter.${catId}`)}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="tests-mock-featured-btn tests-mock-featured-btn--interests"
                    disabled={ctaQc === 0}
                    onClick={() => ctaQc !== 0 && navigate(`/tests/${ctaTest.test_id}`)}>
                    {ctaQc === 0 ? t('testsUi.unavailable') : t('testsUi.findDirection')}
                    {ctaQc !== 0 && <ChevronRight className="tests-mock-featured-btn-ico" size={18} strokeWidth={2.25} aria-hidden />}
                  </button>
                </div>
              </div>
              }
              <div className="tests-mock-progress-card">
                <div className="tests-mock-progress-head">
                  <h3 className="tests-mock-progress-title">{t('pages.testsProgressTitle')}</h3>
                  <label className="tests-mock-progress-select-wrap">
                    <span className="tests-mock-visually-hidden">{t('pages.testsProgressPeriod')}</span>
                    <select
                      className="tests-mock-progress-select"
                      value={progressPeriod}
                      onChange={(e) => setProgressPeriod(e.target.value)}>
                      <option value="month">{t('pages.testsProgressMonth')}</option>
                      <option value="all">{t('pages.testsProgressAll')}</option>
                    </select>
                  </label>
                </div>
                <div className="tests-mock-progress-stats">
                  <div className="tests-mock-progress-stat tests-mock-progress-stat--tests">
                    <ClipboardList className="tests-mock-progress-stat-ico" size={22} strokeWidth={1.85} aria-hidden />
                    <strong className="tests-mock-progress-stat-value">{progressSessions}</strong>
                    <span className="tests-mock-progress-stat-label">{t('pages.testsProgressStatSessions')}</span>
                  </div>
                  <div className="tests-mock-progress-stat tests-mock-progress-stat--time">
                    <Clock className="tests-mock-progress-stat-ico" size={22} strokeWidth={1.85} aria-hidden />
                    <strong className="tests-mock-progress-stat-value">
                      {progressMinutes < 60 ?
                        `${progressMinutes}\u00a0${t('pages.testsMinShort')}` :
                        `${Math.floor(progressMinutes / 60)}\u00a0${t('pages.testsProgressHourShort')}${
                          progressMinutes % 60 ? `\u00a0${progressMinutes % 60}\u00a0${t('pages.testsMinShort')}` : ''
                        }`}
                    </strong>
                    <span className="tests-mock-progress-stat-label">{t('pages.testsProgressStatTime')}</span>
                  </div>
                  <div className="tests-mock-progress-stat tests-mock-progress-stat--awards">
                    <Star className="tests-mock-progress-stat-ico" size={22} strokeWidth={1.85} aria-hidden />
                    <strong className="tests-mock-progress-stat-value">{progressAwards}</strong>
                    <span className="tests-mock-progress-stat-label">{t('pages.testsProgressStatAwards')}</span>
                  </div>
                </div>
                <p className="tests-mock-progress-hint">{t('pages.testsProgressHint', { n: progressUniqueTests })}</p>
              </div>
            </div>
          </section>
          }

          {tests.length > 0 &&
          <section className="tests-mock-catalog-v2" aria-label={t('pages.testsCatalog')}>
            <h2 className="tests-mock-section-heading">{t('pages.testsRecommended')}</h2>
            {gridTests.length === 0 ?
              <p className="tests-mock-empty tests-mock-empty--v2">{t('testsUi.emptyFilter')}</p> :

              <div className="tests-mock-catalog-grid tests-mock-catalog-grid--v2">
                {gridTests.map((row, i) => {
                  const qc = row.question_count != null ? Number(row.question_count) : 0;
                  const disabled = qc === 0;
                  const desc =
                    clipText(row.description || '') ||
                    clipText(audienceLabel(row), 140);
                  const categoryLabel = primaryCategoryLabel(row, t);
                  return (
                    <article
                      key={row.test_id}
                      className="tests-mock-catalog-card tests-mock-catalog-card--v2"
                      style={{ animationDelay: `${0.04 + i % 12 * 0.035}s` }}>
                      <button
                        type="button"
                        className="tests-mock-catalog-inner tests-mock-catalog-inner--v2"
                        disabled={disabled}
                        onClick={() => !disabled && navigate(`/tests/${row.test_id}`)}>
                        <div className="tests-mock-card-body">
                          <span className="tests-mock-card-category">{categoryLabel}</span>
                          <h3 className="tests-mock-catalog-title tests-mock-catalog-title--v2">{row.title}</h3>
                          <p className="tests-mock-card-desc">{desc}</p>
                          <div className="tests-mock-card-footer">
                            <div className="tests-mock-card-foot-meta">
                              <span>
                                {disabled ? t('testsUi.questionsNotLoaded') : questionCountLabel(qc)}
                              </span>
                              <span className="tests-mock-card-dot" aria-hidden>
                                ·
                              </span>
                              <span>
                                ≈ {estimateMinutes(qc)} {t('pages.testsMinShort')}
                              </span>
                            </div>
                            <span className={`tests-mock-card-cta-pill ${disabled ? 'tests-mock-card-cta-pill--disabled' : ''}`}>
                              {disabled ? t('testsUi.unavailable') : t('testsUi.goTest')}
                            </span>
                          </div>
                        </div>
                      </button>
                    </article>);
                })}
              </div>
            }
          </section>
          }
        </div>
      </div>

      <footer className="tests-mock-quote-footer">
        <div className="tests-mock-quote-decor" aria-hidden>
          <span className="tests-mock-quote-path" />
          <Send className="tests-mock-quote-plane" size={22} strokeWidth={1.75} />
          <Heart className="tests-mock-quote-heart" size={20} strokeWidth={2} fill="currentColor" />
        </div>
        <div className="tests-mock-quote-inner">
          <p className="tests-mock-quote-text">{t('pages.testsQuote')}</p>
        </div>
      </footer>
    </div>);

};

export const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.
    get(`/tests/${id}`).
    then((res) => setTest(mergeTestRu(res.data))).
    finally(() => setLoading(false));
  }, [id]);

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/tests/${id}/submit`, { answers });
      setResult(res.data);
      setStep(test.questions.length + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="tests-loading"><div className="loading-spinner" /></div>;
  if (!test) return <div className="tests-empty"><p>Тест не найден</p></div>;

  const questions = Array.isArray(test.questions) ? test.questions : [];
  if (questions.length === 0) {
    return (
      <div className="take-test take-test--empty fade-in">
        <button type="button" className="btn btn-ghost back-btn" onClick={() => navigate('/tests')}>
          <ChevronLeft size={16} /> К тестам
        </button>
        <div className="test-intro card test-intro--psych test-intro--warn">
          <h1>{test.title}</h1>
          <p className="test-intro-lead">
            Для этого теста в базе нет вопросов. Перезапустите сервер (подтянется каталог) или обратитесь к администратору.
          </p>
        </div>
      </div>);

  }

  const currentQ = questions[step - 1];
  const nQ = questions.length;
  const progress =
  step > 0 && step <= nQ ? step / nQ * 100 : 0;
  const allAnswered = questions.every((q) => answers[q.question_id] !== undefined);

  if (step === 0) {
    return (
      <div className="take-test take-test--intro fade-in">
        <button type="button" className="btn btn-ghost back-btn" onClick={() => navigate('/tests')}>
          <ChevronLeft size={16} /> К тестам
        </button>
        <div
          className="test-progress-bar test-progress-bar--shine test-progress-bar--intro"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-label="Прогресс опроса">
          
          <div className="test-progress-fill" style={{ width: '0%' }} />
        </div>
        <p className="test-progress-hint">После «Начать тест» полоса покажет ход опроса по вопросам.</p>
        <div className="test-intro card test-intro--psych">
          <h1>{test.title}</h1>
          <p className="test-intro-lead">{test.description}</p>
          <div className="test-intro-meta">
            <span>{questionCountLabel(questions.length)}</span>
            <span>~{Math.ceil(questions.length * 0.5)} мин</span>
          </div>
          <button
            type="button"
            className="btn btn-primary test-intro-start"
            disabled={questions.length === 0}
            onClick={() => setStep(1)}>
            
            Начать тест
          </button>
        </div>
      </div>);

  }

  if (step === questions.length + 1 && result) {
    const level = result.level || result.result.level;
    const color = resultAccentColor(level);
    const interp = result.interpretation;
    const scoreLabel =
    result.scale === 'gad7' ?
    `балл GAD-7: ${result.result.score} / ${result.maxScore ?? 21}` :
    result.scale === 'daily5' ?
    `индекс дня: ${result.percentage}%` :
    result.scale === 'mbi_student' ?
    `индекс: ${result.percentage}%` :
    'интенсивность по шкале';

    const showCrisisHint =
    /высокая тревож|выраженное выгорание|сильн|нужен отдых и поддержк/i.test(level || '') ||
    result.result.level === 'Высокий';

    return (
      <div className="take-test fade-in">
        <div className="test-result card test-result--rich test-result--pop">
          <div className="result-icon" style={{ background: `${color}22`, color }}>
            {level}
          </div>
          <h1>Тест завершён</h1>
          <p className="result-test-title">{test.title}</p>
          <div className="result-score-circle" style={{ borderColor: color }}>
            <span className="result-score-num">{result.percentage}%</span>
            <span className="result-score-label">{scoreLabel}</span>
          </div>
          {interp &&
          <div className="result-interpret">
              <h2 className="result-interpret-title">{interp.title}</h2>
              <p className="result-interpret-text">{interp.text}</p>
              <p className="result-interpret-rec">
                <strong>Рекомендация:</strong> {interp.recommendation}
              </p>
            </div>
          }
          {showCrisisHint &&
          <div className="result-warning">
              При сильном дискомфорте обратитесь к специалисту. ИИ и приложение не заменяют очную помощь.
            </div>
          }
          <div className="result-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/tests')}>
              Все тесты
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/practices')}>
              {t('pages.practicesForMe')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/stats')}>
              Аналитика
            </button>
          </div>
        </div>
      </div>);

  }

  const opts = parseQuestionOptions(currentQ?.options);

  return (
    <div className="take-test take-test--questions take-test--survey-mock fade-in">
      <div className="take-test-survey-shell">
        <div className="test-survey-progress-block">
          <div
            className="test-survey-progress-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={`${t('testsUi.surveyLabel')}: ${Math.round(progress)}%`}>
            <div className="test-survey-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="test-survey-progress-meta">
            <span className="test-survey-meta-label">{t('testsUi.surveyLabel')}</span>
            <span className="test-survey-meta-counter">
              {t('testsUi.questionOf', { current: step, total: questions.length })}
            </span>
          </div>
        </div>

        <div className="test-survey-body">
          <div className="test-survey-col">
            <div className="test-survey-nav">
              <button
                type="button"
                className="test-survey-back"
                disabled={step <= 1}
                onClick={() => setStep((s) => s - 1)}
                aria-label={t('testsUi.backQuestion')}>
                <ChevronLeft size={20} strokeWidth={2.2} />
              </button>
            </div>

            <div key={step} className="test-survey-card tests-q-slide">
              <p className="test-survey-qtext">{currentQ?.question_text}</p>
              <div className="test-survey-options">
                {opts.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    style={{ animationDelay: `${0.04 + i * 0.055}s` }}
                    className={`test-survey-option q-option--enter ${answers[currentQ.question_id] === i ? 'test-survey-option--selected' : ''}`}
                    onClick={() => handleAnswer(currentQ.question_id, i)}>
                    <span className="test-survey-radio" aria-hidden />
                    <span className="test-survey-option-text">{opt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="test-survey-actions">
              {step < questions.length ? (
                <button
                  type="button"
                  className="test-survey-next"
                  disabled={answers[currentQ.question_id] === undefined}
                  onClick={() => setStep((s) => s + 1)}>
                  {t('testsUi.next')}
                </button>
              ) : (
                <button type="button" className="test-survey-next" disabled={!allAnswered || submitting} onClick={handleSubmit}>
                  {submitting ? t('testsUi.submitting') : t('testsUi.finishTest')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>);

};