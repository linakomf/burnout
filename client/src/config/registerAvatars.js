const p = (path) => `${(process.env.PUBLIC_URL || '').replace(/\/$/, '')}${path}`;

/**
 * Аватар в БД: путь /avatars/... (без PUBLIC_URL).
 * 1 — студент + мальчик, 2 — студент + девочка, 3 — преподаватель + мальчик, 4 — преподаватель + девочка.
 */
const BY_KEY = {
  'student:boy': '/avatars/av-student-boy.png',
  'student:girl': '/avatars/av-student-girl.png',
  'teacher:boy': '/avatars/av-teacher-boy.png',
  'teacher:girl': '/avatars/av-teacher-woman.png'
};

/**
 * @param {'student'|'teacher'} profileRole
 * @param {'boy'|'girl'} gender
 */
export function getAvatarForRoleGender(profileRole, gender) {
  const r = profileRole === 'teacher' ? 'teacher' : 'student';
  const g = gender === 'girl' ? 'girl' : 'boy';
  const key = `${r}:${g}`;
  const path = BY_KEY[key];
  return {
    id: key,
    path,
    src: p(path)
  };
}
