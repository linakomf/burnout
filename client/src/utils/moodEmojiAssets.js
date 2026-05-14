/** Apple-style emoji PNGs - единый вид на всех ОС (как в макете). */
export const MOOD_EMOJI_CDN =
  'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.1/img/apple/64';

export function moodEmojiUrl(fileBase) {
  const normalized = String(fileBase).toLowerCase().replace(/\.png$/i, '');
  return `${MOOD_EMOJI_CDN}/${normalized}.png`;
}

/** Порядок как в легенде дневника: отлично … раздражён */
export const DIARY_MOOD_TWEMOJI_BY_MOODS_IDX = ['1f604', '1f642', '1f610', '1f614', '1f625', '1f624'];

/** Индексы чекина 0-4 */
export const CHECKIN_MOOD_TWEMOJI_FILES = ['1f604', '1f642', '1f610', '1f614', '1f625'];

export const EMOJI_CHAR_TO_TWEMOJI_FILE = {
  '😰': '1f630',
  '😊': '1f60a',
  '😌': '1f60c',
  '🙂': '1f642',
  '😐': '1f610',
  '😡': '1f621',
  '😄': '1f604',
  '😢': '1f622',
  '😥': '1f625',
  '😔': '1f614',
  '😕': '1f615',
  '😤': '1f624',
};

export function twemojiFileForUnicode(emoji) {
  return EMOJI_CHAR_TO_TWEMOJI_FILE[emoji] || '1f610';
}
