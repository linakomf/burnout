function normalizeRegisterAvatar(avatar) {
  if (avatar == null || avatar === '') return null;
  const s = String(avatar).trim();
  if (!/^\/(avatars|photos)\//.test(s) || s.length > 200) return null;
  return s;
}

function normalizeGender(gender) {
  if (gender == null || gender === '') return null;
  const g = String(gender).trim().toLowerCase();
  if (g === 'boy' || g === 'girl') return g;
  return null;
}

module.exports = { normalizeRegisterAvatar, normalizeGender };
