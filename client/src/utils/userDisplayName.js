
export function formatUserDisplayName(user) {
  const first = String(user?.name ?? '').trim();
  const last = String(user?.last_name ?? user?.lastName ?? '').trim();
  if (first && last) return `${first} ${last}`;
  return first || last || '';
}
