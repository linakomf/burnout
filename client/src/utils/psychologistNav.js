export function psychologistHomePath(user) {
  if (!user || user.role !== 'psychologist') return '/dashboard';
  if (user.psychologist_account_status === 'approved') return '/psychologist';
  return '/psychologist/pending';
}
