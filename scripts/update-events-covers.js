/**
 * Обновляет cover_url и hero_url для событий с локальными обложками.
 * Запуск: node scripts/update-events-covers.js
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const pool = require('../server/db');
const { ensureEventsSchema } = require('../server/ensureEventsSchema');

const EVENT_COVERS = {
  // Один
  'Мастер-класс по гончарному делу': '/images/events/solo-pottery.png',
  'Арт-вечер Carpe Diem': '/images/events/solo-art-evening.png',
  'Лекции в Art Society': '/images/events/solo-art-society.png',
  'Stand Up концерт': '/images/events/solo-standup.png',
  'Мастер-класс по живописи': '/images/events/solo-painting.png',
  'Балет «Лебединое озеро»': '/images/events/solo-ballet.png',
  'Органная музыка в филармонии': '/images/events/solo-organ.png',
  'Спектакль в ARTiШОК': '/images/events/solo-artishok.png',
  // В компании
  'Игровой вечер Catan Almaty': '/images/events/group-catan.png',
  'Белые вина нового света': '/images/events/group-white-wine.png',
  'New Vision Forum 2026': '/images/events/group-forum.png',
  'Sparkling Wine Evening': '/images/events/group-sparkling.png',
  'SATISFACTION Festival': '/images/events/group-festival.png',
};

async function main() {
  await ensureEventsSchema();

  let updated = 0;
  for (const [title, cover] of Object.entries(EVENT_COVERS)) {
    const result = await pool.query(
      `UPDATE events SET cover_url = $1, hero_url = $1, updated_at = NOW()
       WHERE title = $2`,
      [cover, title]
    );
    if (result.rowCount > 0) {
      updated += result.rowCount;
      console.log(`✅ ${title}`);
    } else {
      console.log(`⏭  не найдено: ${title}`);
    }
  }

  console.log(`\nГотово: обновлено ${updated} записей.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
