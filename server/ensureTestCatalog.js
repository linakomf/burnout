const pool = require('./db');
const { BY_ID, META_FOR_ENSURE } = require('./testCanonical');

const LIKERT5_NEVER_ALWAYS = ['Никогда', 'Редко', 'Иногда', 'Часто', 'Всегда'];
const GAD7_OPTS = ['Ни разу', 'Несколько дней', 'Более половины дней', 'Почти каждый день'];

const TEST_META = META_FOR_ENSURE.map(({ id, scoring_type }) => ({
  id,
  title: BY_ID[id].title,
  description: BY_ID[id].description,
  scoring_type
}));

function optsJson(arr) {
  return JSON.stringify(arr);
}

function optionsEqual(dbOpts, expectedArr) {
  let parsed = dbOpts;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return false;
    }
  }
  if (!Array.isArray(parsed) || parsed.length !== expectedArr.length) return false;
  return parsed.every((v, i) => String(v) === String(expectedArr[i]));
}

async function replaceQuestionsFromSeed(testId) {
  const block = EXTRA_QUESTION_SEEDS.find((b) => b.testId === testId);
  if (!block) return;
  await pool.query('DELETE FROM questions WHERE test_id = $1', [testId]);
  let order = 1;
  for (const [text, options] of block.questions) {
    await pool.query(
      `INSERT INTO questions (test_id, question_text, options, order_num)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [testId, text, optsJson(options), order]
    );
    order += 1;
  }
  console.log(`✅ Синхронизированы вопросы test_id=${testId} (${block.questions.length} шт.)`);
}

async function ensureQuestionsMatchSeed(testId) {
  const block = EXTRA_QUESTION_SEEDS.find((b) => b.testId === testId);
  if (!block) return;
  const { rows } = await pool.query(
    'SELECT question_text, options FROM questions WHERE test_id = $1 ORDER BY order_num',
    [testId]
  );
  const expected = block.questions;
  if (rows.length !== expected.length) {
    await replaceQuestionsFromSeed(testId);
    return;
  }
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].question_text !== expected[i][0] || !optionsEqual(rows[i].options, expected[i][1])) {
      await replaceQuestionsFromSeed(testId);
      return;
    }
  }
}

const TEST_CATEGORY_ID = {
  2: 2,
  3: 2,
  4: 3,
  5: 1,
  6: 1,
  7: 1
};

async function ensureCoreTestsExist() {
  for (const { id, scoring_type } of META_FOR_ENSURE) {
    const row = BY_ID[id];
    if (!row) continue;
    const cid = TEST_CATEGORY_ID[id] ?? 2;
    try {
      await pool.query(
        `INSERT INTO tests (test_id, title, description, category_id, scoring_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (test_id) DO NOTHING`,
        [id, row.title, row.description, cid, scoring_type]
      );
    } catch (e) {
      console.warn(`ensureCoreTestsExist (test_id=${id}):`, e.message);
    }
  }
}

const EXTRA_QUESTION_SEEDS = [
{
  testId: 2,
  questions: [
  ['Я чувствую себя эмоционально истощённым от учёбы', LIKERT5_NEVER_ALWAYS],
  ['К концу учебного дня я чувствую себя опустошённым', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую усталость, когда думаю о необходимости идти на занятия', LIKERT5_NEVER_ALWAYS],
  ['Мне стало безразлично, успею ли я сдать задание в срок', LIKERT5_NEVER_ALWAYS],
  ['Я сомневаюсь в важности учёбы', LIKERT5_NEVER_ALWAYS],
  ['Я эффективно решаю учебные задачи', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую вдохновение от учёбы', LIKERT5_NEVER_ALWAYS],
  ['Мне удаётся создавать спокойную атмосферу на занятиях', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую стимул и заряжен после выполнения заданий', LIKERT5_NEVER_ALWAYS]]

},
{
  testId: 3,
  questions: [
  ['Мне трудно заставить себя открыть учебные материалы', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую, что выгорел от дедлайнов и контрольных', LIKERT5_NEVER_ALWAYS],
  ['После учёбы у меня не остаётся сил на отдых и общение', LIKERT5_NEVER_ALWAYS],
  ['Я откладываю задания, даже когда понимаю их важность', LIKERT5_NEVER_ALWAYS],
  ['Мне кажется, что я отстаю от программы', LIKERT5_NEVER_ALWAYS],
  ['Я раздражаюсь из-за мелочей, связанных с учёбой', LIKERT5_NEVER_ALWAYS],
  ['Мне трудно концентрироваться на лекциях и текстах', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую вину, если отдыхаю вместо учёбы', LIKERT5_NEVER_ALWAYS],
  ['Мне трудно верить, что смогу стабильно тянуть учёбу до конца семестра', LIKERT5_NEVER_ALWAYS]]

},
{
  testId: 4,
  questions: [
  ['Я чувствую себя эмоционально опустошённым из-за работы', LIKERT5_NEVER_ALWAYS],
  ['Утром мне тяжело идти на работу', LIKERT5_NEVER_ALWAYS],
  ['После рабочего дня я чувствую себя «выжатым»', LIKERT5_NEVER_ALWAYS],
  ['Я стал меньше сопереживать проблемам студентов/коллег', LIKERT5_NEVER_ALWAYS],
  ['Мне трудно сохранять энтузиазм в профессии', LIKERT5_NEVER_ALWAYS],
  ['Я эффективно решаю рабочие задачи', LIKERT5_NEVER_ALWAYS],
  ['В моей работе много интересного и смысла', LIKERT5_NEVER_ALWAYS],
  ['Я умею отключаться от работы вне рабочего времени', LIKERT5_NEVER_ALWAYS],
  ['Я доволен тем, чего достигаю на работе', LIKERT5_NEVER_ALWAYS]]

},
{
  testId: 5,
  questions: [
  ['Мне кажется, что на меня свалилось слишком много задач', LIKERT5_NEVER_ALWAYS],
  ['Я не успеваю восстанавливаться между рабочими или учебными днями', LIKERT5_NEVER_ALWAYS],
  ['Мне трудно сказать «нет» новым обязанностям', LIKERT5_NEVER_ALWAYS],
  ['Из-за нагрузки я жертвую сном', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую постоянное ощущение спешки', LIKERT5_NEVER_ALWAYS],
  ['Мне не хватает времени на семью, друзей и хобби', LIKERT5_NEVER_ALWAYS],
  ['Я раздражаюсь, когда меня отвлекают от дел', LIKERT5_NEVER_ALWAYS],
  ['В конце недели я чувствую себя полностью вымотанным', LIKERT5_NEVER_ALWAYS],
  ['Я чувствую, что теряю интерес к тому, что раньше мотивировало', LIKERT5_NEVER_ALWAYS]]

},
{
  testId: 6,
  questions: [
  [
  'За последние 2 недели как часто вас беспокоило ощущение нервозности, тревоги или напряжённости?',
  GAD7_OPTS],

  ['Как часто вам было трудно остановить беспокойство или контролировать его?', GAD7_OPTS],
  ['Как часто вы слишком сильно беспокоились о разных вещах?', GAD7_OPTS],
  ['Как часто вам было трудно расслабиться?', GAD7_OPTS],
  ['Как часто вы были настолько беспокойны, что трудно усидеть на месте?', GAD7_OPTS],
  ['Как часто вы легко раздражались или злились?', GAD7_OPTS],
  ['Как часто вам казалось, что может случиться что-то плохое?', GAD7_OPTS]]

},
{
  testId: 7,
  questions: [
  ['Я чувствую усталость (физическую и эмоциональную)', LIKERT5_NEVER_ALWAYS],
  ['Мне трудно сосредоточиться на задачах', LIKERT5_NEVER_ALWAYS],
  ['Я испытываю тревогу или напряжение', LIKERT5_NEVER_ALWAYS],
  ['Я откладываю дела или избегаю их', LIKERT5_NEVER_ALWAYS],
  ['День ощущается тяжёлым или неприятным', LIKERT5_NEVER_ALWAYS],
  ['Мне трудно расслабиться', LIKERT5_NEVER_ALWAYS],
  ['Я раздражителен или легко выхожу из себя', LIKERT5_NEVER_ALWAYS],
  ['Мне не хватает сил на то, что раньше давалось легче', LIKERT5_NEVER_ALWAYS],
  ['К вечеру я чувствую опустошённость', LIKERT5_NEVER_ALWAYS]]

}];


async function ensureQuestionsUpToSeed(testId) {
  const block = EXTRA_QUESTION_SEEDS.find((b) => b.testId === testId);
  if (!block) return;
  const full = block.questions;
  try {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM questions WHERE test_id = $1', [testId]);
    const c = rows[0]?.c ?? 0;
    if (c >= full.length) return;
    const { rows: mx } = await pool.query(
      'SELECT COALESCE(MAX(order_num), 0)::int AS m FROM questions WHERE test_id = $1',
      [testId]
    );
    let order = (mx[0]?.m ?? 0) + 1;
    let added = 0;
    for (let idx = c; idx < full.length; idx++) {
      const [text, options] = full[idx];
      await pool.query(
        `INSERT INTO questions (test_id, question_text, options, order_num)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [testId, text, optsJson(options), order]
      );
      order += 1;
      added += 1;
    }
    if (added > 0) {
      console.log(`✅ Дополнены вопросы test_id=${testId}: +${added} (было ${c})`);
    }
  } catch (e) {
    console.warn(`ensureQuestionsUpToSeed(${testId}):`, e.message);
  }
}

async function ensureTestCatalog() {
  try {
    const removed = await pool.query('DELETE FROM tests WHERE test_id = 1');
    if (removed.rowCount > 0) {
      console.log('✅ Удалён тест PSS (test_id=1) из каталога');
    }

    await pool.query(`UPDATE categories SET name = $1, description = $2 WHERE category_id = 1`, [
    'Базовые тесты',
    'Общие тесты для всех пользователей']
    );
    await pool.query(`UPDATE categories SET name = $1, description = $2 WHERE category_id = 2`, [
    'Для студентов',
    'Тесты на выгорание и учебную нагрузку']
    );
    await pool.query(`UPDATE categories SET name = $1, description = $2 WHERE category_id = 3`, [
    'Для преподавателей',
    'Профессиональное выгорание и нагрузка']
    );

    await ensureCoreTestsExist();

    await pool.query(`UPDATE tests SET category_id = $1 WHERE test_id = 5`, [1]);

    for (const t of TEST_META) {
      await pool.query(
        `UPDATE tests
         SET title = $1,
             description = $2,
             scoring_type = $3
         WHERE test_id = $4`,
        [t.title, t.description, t.scoring_type, t.id]
      );
    }

    for (const block of EXTRA_QUESTION_SEEDS) {
      const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS c FROM questions WHERE test_id = $1',
        [block.testId]
      );
      if (rows[0].c > 0) continue;

      let order = 1;
      for (const [text, options] of block.questions) {
        await pool.query(
          `INSERT INTO questions (test_id, question_text, options, order_num)
           VALUES ($1, $2, $3::jsonb, $4)`,
          [block.testId, text, optsJson(options), order]
        );
        order += 1;
      }
      console.log(`✅ Добавлены вопросы для test_id=${block.testId} (${block.questions.length} шт.)`);
    }

    for (const id of [2, 3, 4, 5, 6, 7]) {
      await ensureQuestionsUpToSeed(id);
    }

    for (const id of [2, 3, 4, 5, 6, 7]) {
      await ensureQuestionsMatchSeed(id);
    }
  } catch (e) {
    console.warn('ensureTestCatalog:', e.message);
  }
}

module.exports = { ensureTestCatalog };