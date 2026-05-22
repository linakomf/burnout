export const REQUEST_STATUS_LABELS = {
  new: 'Новое',
  contacted: 'Связался',
  online_consultation: 'Онлайн-консультация',
  in_progress: 'В процессе',
  completed: 'Завершено'
};

export const ACCOUNT_STATUS_LABELS = {
  pending_review: 'На проверке',
  approved: 'Подтверждён',
  rejected: 'Отклонён',
  blocked: 'Заблокирован'
};

export const ROLE_LABELS = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Админ',
  psychologist: 'Психолог'
};

export const BURNOUT_LEVEL_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  unknown: 'Нет данных'
};

export function contactHref(raw) {
  const t = String(raw || '').trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.includes('@')) return `mailto:${encodeURIComponent(t)}`;
  if (/^\+?\d[\d\s()-]{6,}$/.test(t)) return `tel:${t.replace(/\s/g, '')}`;
  return `mailto:${encodeURIComponent(t)}`;
}

export function whatsappHref(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}
