import { QUICK_SOUNDS } from './musicHubData';

export const PRACTICE_CATEGORIES = [
{ id: 'films', label: 'Фильмы' },
{ id: 'focus', label: 'Медитация' },
{ id: 'podcasts', label: 'Подкасты' },
{ id: 'music', label: 'Музыка' },
{ id: 'articles', label: 'Статьи' },
{ id: 'events', label: 'События' }];


const MEDITATION_SOUND_PRACTICES = QUICK_SOUNDS.map((sound) => ({
  id: `sound-${sound.id.replace('qs-', '')}`,
  titleKey: sound.labelKey,
  description: 'Фоновый звук для восстановления и концентрации.',
  durationMin: 10,
  format: 'Фоновый звук',
  category: 'focus',
  mood: 'Спокойствие',
  meditationTopics: ['sounds'],
  playLabel: 'Слушать',
  coverImage: sound.poster,
  embedUrl: sound.embedUrl,
  watchUrl: sound.watchUrl,
  steps: [
    'Устройся удобно, при необходимости надень наушники.',
    'Прислушайся к звуку и позволь дыханию замедлиться.',
    'Если внимание уходит, мягко возвращайся к звуку.',
  ],
}));

export const PRACTICES = [
{
  id: 'quiet-mode',
  title: 'Тихий режим внутри',
  description: 'Шум в голове стихнет, и дышать станет ощутимо легче.',
  durationMin: 2,
  format: 'Дыхание + фокус',
  category: 'focus',
  mood: 'Ясность',
  meditationTopics: ['anxiety', 'sleep', 'recovery'],
  playLabel: 'Убавить шум',
  emoji: '🫧',
  gradient: 'linear-gradient(135deg, #f8d7ff 0%, #dbeafe 45%, #c7f9f1 100%)',
  steps: [
  'Сядь удобнее, опусти плечи и сделай мягкий вдох через нос.',
  'На выдохе представь, как внутренний шум становится тише.',
  'Сохраняй ровный ритм: вдох на 4, выдох на 6.',
  'Поймай ощущение спокойного пространства вокруг себя.']

},
{
  id: 'focus-single',
  title: 'Одна мысль за раз',
  description: 'Когда всё летит одновременно, верни внимание в одну точку.',
  durationMin: 3,
  format: 'Фокус-пауза',
  category: 'focus',
  mood: 'Собранность',
  meditationTopics: ['focus', 'recovery'],
  playLabel: 'Поймать фокус',
  emoji: '🎯',
  gradient: 'linear-gradient(140deg, #dbeafe 0%, #dfe7ff 50%, #c8f1ff 100%)',
  steps: [
  'Определи одну задачу, которую важно сделать сейчас.',
  'Сделай вдох и мысленно назови только этот шаг.',
  'На выдохе отпусти все лишние задачи на потом.',
  'Удерживай внимание на одном действии до конца практики.']

},
{
  id: 'ground-here',
  title: 'Здесь, а не в тревоге',
  description: 'Мягко возвращает в реальность, когда накрывает накрутка.',
  durationMin: 4,
  format: 'Заземление 5-4-3-2-1',
  category: 'grounding',
  mood: 'Опора',
  meditationTopics: ['anxiety'],
  playLabel: 'Вернуться в момент',
  emoji: '🌿',
  gradient: 'linear-gradient(130deg, #d9fbe7 0%, #d7f8f1 45%, #e6ffd8 100%)',
  steps: [
  'Назови 5 вещей, которые видишь прямо сейчас.',
  'Отметь 4 звука вокруг себя без оценки.',
  'Почувствуй 3 телесных ощущения: опора, температура, ткань.',
  'Заметь 2 запаха и 1 вкус, затем выдохни медленно.']

},
{
  id: 'drop-shoulders',
  title: 'Фильм-пауза для восстановления',
  description: 'Короткий вдохновляющий ролик помогает мягко снизить напряжение и переключиться.',
  durationMin: 5,
  format: 'Осознанный просмотр',
  category: 'films',
  mood: 'Лёгкость',
  playLabel: 'Открыть подборку фильмов',
  emoji: '🎬',
  gradient: 'linear-gradient(145deg, #ffe5d4 0%, #ffe0ef 52%, #f7d6f9 100%)',
  steps: [
  'Выбери короткий фильм 5-10 минут с мягким темпом.',
  'Сделай 3 медленных вдоха и позволь телу расслабиться.',
  'Смотри осознанно: без скролла и лишних отвлечений.',
  'После просмотра запиши, что изменилось в состоянии.']

},
{
  id: 'micro-reset',
  title: 'Событие дня',
  description: 'Короткий выход из рутины: выбери одно небольшое событие для себя.',
  durationMin: 3,
  format: 'Планирование микрособытия',
  category: 'events',
  mood: 'Интерес',
  playLabel: 'Запланировать событие',
  emoji: '📅',
  gradient: 'linear-gradient(140deg, #fff0cc 0%, #ffe5da 48%, #ffd9e4 100%)',
  steps: [
  'Открой календарь и найди 20-30 минут свободного окна.',
  'Выбери одно простое событие: прогулка, встреча, выставка, мастер-класс.',
  'Зафиксируй время и место, чтобы решение стало конкретным.',
  'Сделай первый шаг: отправь сообщение или поставь напоминание.']

},
{
  id: 'warm-self',
  title: 'Тепло к себе',
  description: 'Короткий диалог с собой без давления и самокритики.',
  durationMin: 3,
  format: 'Self-compassion',
  category: 'grounding',
  mood: 'Поддержка',
  meditationTopics: ['anxiety', 'sleep', 'recovery'],
  playLabel: 'Поддержать себя',
  emoji: '💗',
  gradient: 'linear-gradient(145deg, #ffd8eb 0%, #f5dcff 44%, #e2ddff 100%)',
  steps: [
  'Положи ладонь на грудь и сделай мягкий вдох.',
  'Скажи себе: “Сейчас мне можно замедлиться”.',
  'На выдохе отпусти одну претензию к себе.',
  'Заверши фразой: “Я справляюсь шаг за шагом”.']

},
{
  id: 'stop-scroll',
  title: 'Стоп-скролл',
  description: 'Выводит из автопилота и возвращает ощущение присутствия.',
  durationMin: 2,
  format: 'Digital detox',
  category: 'focus',
  mood: 'Присутствие',
  meditationTopics: ['focus', 'recovery'],
  playLabel: 'Выйти из ленты',
  emoji: '📵',
  gradient: 'linear-gradient(135deg, #d8efff 0%, #e2e4ff 50%, #f0dfff 100%)',
  steps: [
  'Отложи телефон и зафиксируй взгляд в одной точке.',
  'Сделай два глубоких вдоха через нос.',
  'Почувствуй опору под ногами и в спине.',
  'Выбери одно осознанное действие вместо скролла.']

},
{
  id: 'night-exhale',
  title: 'Короткий фильм-пауза',
  description: 'Мягкое переключение через короткий фильм, когда нужно перезагрузить голову.',
  durationMin: 5,
  format: 'Осознанный просмотр',
  category: 'films',
  mood: 'Переключение',
  playLabel: 'Выбрать фильм',
  emoji: '🎬',
  gradient: 'linear-gradient(145deg, #dbe0ff 0%, #e7ddff 45%, #d9f0ff 100%)',
  steps: [
  'Выбери ролик или короткометражку до 10 минут без тревожного сюжета.',
  'Перед просмотром отметь текущее состояние по шкале от 1 до 10.',
  'Смотри без параллельного скролла и уведомлений.',
  'После просмотра оцени состояние снова и запиши разницу.']

},
{
  id: 'pre-important',
  title: 'Перед важным',
  description: 'Собирает перед звонком, экзаменом или сложным разговором.',
  durationMin: 3,
  format: 'Центрирование',
  category: 'focus',
  mood: 'Уверенность',
  meditationTopics: ['focus', 'anxiety'],
  playLabel: 'Собраться сейчас',
  emoji: '✨',
  gradient: 'linear-gradient(140deg, #e7dcff 0%, #dbe9ff 52%, #dbf8ef 100%)',
  steps: [
  'Сделай ровный вдох и выпрями спину.',
  'Назови про себя: “Я могу быть спокойным и чётким”.',
  'На выдохе убери дрожь из тела, расслабь плечи.',
  'Представь, как уверенно произносишь первую фразу.']

},
{
  id: 'energy-spark',
  title: 'Искра энергии',
  description: 'Когда тяжело начать — запускает мягкий внутренний тонус.',
  durationMin: 2,
  format: 'Активирующее дыхание',
  category: 'focus',
  mood: 'Бодрость',
  meditationTopics: ['recovery', 'focus'],
  playLabel: 'Включиться',
  emoji: '🍋',
  gradient: 'linear-gradient(135deg, #e4ffd7 0%, #d9fdf5 45%, #dcedff 100%)',
  steps: [
  'Три коротких вдоха носом и длинный выдох ртом.',
  'Слегка разомни кисти и шею.',
  'Добавь один активный вдох, будто включаешь свет.',
  'Зафиксируй импульс: выбери и начни первый шаг.']

},
...MEDITATION_SOUND_PRACTICES];