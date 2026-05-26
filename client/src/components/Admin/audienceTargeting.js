/** Настройки показа карточек в админке (не показываются конечным пользователям). */

export const AUDIENCE_ROLE_OPTIONS = [
  { id: 'all', label: 'Подходит всем' },
  { id: 'student', label: 'Студент' },
  { id: 'teacher', label: 'Преподаватель' },
];

export const AUDIENCE_GENDER_OPTIONS = [
  { id: 'all', label: 'Универсально' },
  { id: 'female', label: 'Женщинам' },
  { id: 'male', label: 'Мужчинам' },
];

export const AUDIENCE_ROLE_LABELS = Object.fromEntries(
  AUDIENCE_ROLE_OPTIONS.map((o) => [o.id, o.label])
);

export const AUDIENCE_GENDER_LABELS = Object.fromEntries(
  AUDIENCE_GENDER_OPTIONS.map((o) => [o.id, o.label])
);

export function emptyAudienceFields() {
  return { target_role: 'all', target_gender: 'all' };
}

export function formatAudienceSummary(row) {
  const role = AUDIENCE_ROLE_LABELS[row?.target_role] || 'Подходит всем';
  const gender = AUDIENCE_GENDER_LABELS[row?.target_gender] || 'Универсально';
  return `${role} · ${gender}`;
}
