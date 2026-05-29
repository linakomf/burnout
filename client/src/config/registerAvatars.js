/**
 * Аватар в БД: путь /avatars/onb-char-*.png (без PUBLIC_URL).
 * Для UI — те же файлы; при ошибке загрузки — av-* (крупный портрет в круге).
 */
const publicBase = () => (process.env.PUBLIC_URL || '').replace(/\/$/, '');

function publicUrl(path) {
  return `${publicBase()}${path}`;
}

const BY_KEY = {
  'student:boy': '/avatars/onb-char-boy.png',
  'student:girl': '/avatars/onb-char-girl.png',
  'teacher:boy': '/avatars/onb-char-man.png',
  'teacher:girl': '/avatars/onb-char-woman.png'
};

const FALLBACK_BY_KEY = {
  'student:boy': '/avatars/av-student-boy.png',
  'student:girl': '/avatars/av-student-girl.png',
  'teacher:boy': '/avatars/av-teacher-boy.png',
  'teacher:girl': '/avatars/av-teacher-woman.png'
};

/** Все 4 персонажа для выбора на экране после регистрации */
export const PROFILE_AVATAR_OPTIONS = [
  { key: 'student:boy', profileRole: 'student', gender: 'boy' },
  { key: 'student:girl', profileRole: 'student', gender: 'girl' },
  { key: 'teacher:boy', profileRole: 'teacher', gender: 'boy' },
  { key: 'teacher:girl', profileRole: 'teacher', gender: 'girl' }
];

/**
 * @param {'student'|'teacher'} profileRole
 * @param {'boy'|'girl'} gender
 */
export function getAvatarForRoleGender(profileRole, gender) {
  const r = profileRole === 'teacher' ? 'teacher' : 'student';
  const g = gender === 'girl' ? 'girl' : 'boy';
  const key = `${r}:${g}`;
  const path = BY_KEY[key];
  const fallbackPath = FALLBACK_BY_KEY[key];
  return {
    id: key,
    path,
    src: publicUrl(path),
    fallbackSrc: publicUrl(fallbackPath)
  };
}
