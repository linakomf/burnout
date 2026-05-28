/**
 * Одноразовое наполнение каталога «События» (Алматы, июнь 2026).
 * Запуск из корня: node scripts/seed-events-almaty.js
 * Повторный запуск пропускает события с тем же title.
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const pool = require('../server/db');
const { ensureEventsSchema } = require('../server/ensureEventsSchema');
const { buildCardTags } = require('../server/utils/eventFilters');

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1519681393024-ddf20733a98b?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b66?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=85',
];

function tagsFor({ when, kind }) {
  return buildCardTags(
    {
      location_text: 'Алматы',
      when_text: when,
      is_offline: '1',
      offline_label: 'Офлайн',
      in_company_label: kind === 'group' ? 'В компании' : '',
    },
    kind
  );
}

const EVENTS = [
  {
    title: 'Игровой вечер Catan Almaty',
    kind: 'solo',
    filter_cat: 'other',
    category_label: 'Настолки',
    price_key: 'от 5000 ₸',
    tf_mood: 'social',
    when: 'Каждое воскресенье июня',
    ticket_url: 'https://ticketon.kz/entertainment/event/tckt2-igrovoy-vecher-catan-almaty',
    venue_line: 'Kavkaz Bar, Бухар Жырау 66',
    venue_pin_text: 'Kavkaz Bar',
    teaser: 'Настольный вечер для новых знакомств и живого общения в Алматы.',
    about_text:
      'Участники собираются в команды и играют в Catan, Mafia и другие настольные игры. Можно прийти одному — команды формируются на месте.',
    duration_label: '3 ч',
    age_label: '18+',
    genre_label: 'Настолки / Нетворкинг',
    suit_tags: ['Тем, кто хочет новых друзей', 'Любителям настолок', 'Тем, кто хочет провести вечер вне дома'],
    important_notes: [
      'Можно приходить одному',
      'Правила объясняют на месте',
      'Количество мест ограничено',
    ],
  },
  {
    title: 'Мастер-класс по гончарному делу',
    kind: 'solo',
    filter_cat: 'workshops',
    category_label: 'Керамика',
    price_key: 'от 7000 ₸',
    tf_mood: 'calm',
    when: '18–27 июня',
    ticket_url: 'https://ticketon.kz/event/tckt2-master-klass-po-goncharnomu-delu-almaty',
    venue_line: 'Студия «Гончаръ», Айтиева 154/1',
    venue_pin_text: 'Студия «Гончаръ»',
    teaser: 'Творческий вечер с глиной, общением и спокойной атмосферой.',
    about_text:
      'Участники создают изделия из глины под руководством мастера. Отличный формат для расслабленного общения и новых знакомств.',
    duration_label: '2 ч',
    age_label: '18+',
    genre_label: 'Керамика / Арт',
    suit_tags: ['Любителям творчества', 'Тем, кто хочет спокойный вечер', 'Новичкам'],
    important_notes: ['Нужна предварительная запись', 'Все материалы включены', 'Можно без опыта'],
  },
  {
    title: 'Арт-вечер Carpe Diem',
    kind: 'solo',
    filter_cat: 'workshops',
    category_label: 'Арт-вечер',
    price_key: 'от 25000 ₸',
    tf_mood: 'calm',
    when: 'По выходным',
    ticket_url: 'https://ticketon.kz/almaty/master-classes',
    venue_line: 'Carpe Diem Studio',
    venue_pin_text: 'Carpe Diem Studio',
    teaser: 'Вечер рисования и знакомств в уютной атмосфере.',
    about_text: 'Гости рисуют картины под музыку и знакомятся в неформальной обстановке.',
    duration_label: '2–3 ч',
    age_label: '16+',
    genre_label: 'Рисование',
    suit_tags: ['Тем, кто хочет расслабиться', 'Любителям искусства', 'Тем, кто ищет новые знакомства'],
    important_notes: ['Все материалы включены', 'Подходит новичкам'],
  },
  {
    title: 'Белые вина нового света',
    kind: 'group',
    filter_cat: 'workshops',
    category_label: 'Дегустация',
    price_key: 'от 20000 ₸',
    tf_mood: 'calm',
    when: '6 июня',
    tf_time: 'evening',
    ticket_url: 'https://ticketon.kz/almaty/master-classes',
    venue_line: 'Школа сомелье IWINE',
    venue_pin_text: 'IWINE School',
    teaser: 'Дегустация вин и новые знакомства в камерной атмосфере.',
    about_text: 'Гости пробуют вина и общаются в формате гастро-вечера.',
    duration_label: '2 ч',
    age_label: '21+',
    genre_label: 'Дегустация',
    suit_tags: ['Любителям вина', 'Тем, кто хочет новые знакомства', 'Парам и друзьям'],
    important_notes: ['21+', 'Количество мест ограничено'],
  },
  {
    title: 'New Vision Forum 2026',
    kind: 'group',
    filter_cat: 'lectures',
    category_label: 'Форум',
    price_key: 'от 15000 ₸',
    tf_mood: 'active',
    tf_time: 'afternoon',
    when: '11–13 июня',
    ticket_url: 'https://www.instagram.com/p/DYof09CNqPj/',
    venue_line: 'Novotel Almaty City Center',
    venue_pin_text: 'Novotel Almaty',
    teaser: 'Большой форум про технологии, AI и нетворкинг.',
    about_text:
      'Форум объединяет предпринимателей, digital-специалистов и креативное комьюнити Алматы.',
    duration_label: '3 дня',
    age_label: '18+',
    genre_label: 'Форум / Нетворкинг',
    suit_tags: ['Предпринимателям', 'IT-специалистам', 'Тем, кто хочет нетворкинг'],
    important_notes: ['Нужна регистрация', 'Есть мастер-классы и networking zone'],
  },
  {
    title: 'Sparkling Wine Evening',
    kind: 'group',
    filter_cat: 'workshops',
    category_label: 'Вино',
    price_key: 'от 20000 ₸',
    tf_mood: 'social',
    when: '27 июня',
    ticket_url: 'https://ticketon.kz/almaty/master-classes',
    venue_line: 'Школа сомелье IWINE',
    venue_pin_text: 'IWINE',
    teaser: 'Игристые вина и уютный вечер знакомств.',
    about_text: 'Дегустация игристых вин в камерной атмосфере с общением и новыми знакомствами.',
    duration_label: '2 ч',
    age_label: '21+',
    genre_label: 'Гастро-вечер',
    suit_tags: ['Парам', 'Компаниям друзей', 'Любителям вина'],
    important_notes: ['21+', 'Количество мест ограничено'],
  },
  {
    title: 'SATISFACTION Festival',
    kind: 'group',
    filter_cat: 'other',
    category_label: 'Фестиваль',
    price_key: 'от 10000 ₸',
    tf_mood: 'active',
    when: '27 июня',
    ticket_url: 'https://www.instagram.com/reel/DYRTlbws2SK/',
    venue_line: 'Open Air площадка Алматы',
    venue_pin_text: 'Open Air',
    teaser: 'Музыка, мастер-классы и летний open-air фестиваль.',
    about_text:
      'Большой летний фестиваль с музыкой, играми и активностями для знакомств и отдыха.',
    duration_label: 'Весь день',
    age_label: '18+',
    genre_label: 'Фестиваль',
    suit_tags: ['Компаниям друзей', 'Любителям open-air', 'Тем, кто любит музыку'],
    important_notes: ['18+', 'Рекомендуем взять воду и удобную обувь'],
  },
];

async function main() {
  await ensureEventsSchema();

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < EVENTS.length; i += 1) {
    const ev = EVENTS[i];
    const exists = await pool.query('SELECT 1 FROM events WHERE title = $1 LIMIT 1', [ev.title]);
    if (exists.rows.length > 0) {
      skipped += 1;
      console.log(`⏭  уже есть: ${ev.title}`);
      continue;
    }

    const cover = COVER_IMAGES[i % COVER_IMAGES.length];
    const tf_time = ev.tf_time || 'evening';
    const card_tags = tagsFor({ when: ev.when, kind: ev.kind });

    await pool.query(
      `INSERT INTO events (
        title, kind, filter_cat, category_label, price_key, tf_loc, tf_date, tf_time, tf_mood,
        card_tags, cover_url, hero_url, ticket_url, venue_line, teaser, about_text, duration_label,
        age_label, genre_label, refund_label, venue_image_url, venue_pin_text, organizer_name,
        organizer_desc, suit_tags, important_notes, gallery_urls, target_role, target_gender
      ) VALUES (
        $1,$2,$3,$4,$5,'almaty','this_month',$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23::jsonb,$24::jsonb,'[]'::jsonb,'all','all'
      )`,
      [
        ev.title,
        ev.kind,
        ev.filter_cat,
        ev.category_label,
        ev.price_key,
        tf_time,
        ev.tf_mood,
        JSON.stringify(card_tags),
        cover,
        cover,
        ev.ticket_url,
        ev.venue_line,
        ev.teaser,
        ev.about_text,
        ev.duration_label,
        ev.age_label,
        ev.genre_label,
        '',
        '',
        ev.venue_pin_text,
        '',
        '',
        JSON.stringify(ev.suit_tags),
        JSON.stringify(ev.important_notes),
      ]
    );

    inserted += 1;
    console.log(`✅ добавлено: ${ev.title}`);
  }

  console.log(`\nГотово: ${inserted} новых, ${skipped} пропущено (дубликаты по названию).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
