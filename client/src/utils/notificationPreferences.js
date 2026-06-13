export const NOTIF_STORAGE_KEY = 'burnout_notifications';

export const NOTIF_CHANGED_EVENT = 'burnout:notifications-changed';

export function readLocalNotificationsEnabled() {
  try {
    return localStorage.getItem(NOTIF_STORAGE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function writeLocalNotificationsEnabled(enabled) {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(NOTIF_CHANGED_EVENT, { detail: { enabled: Boolean(enabled) } })
    );
  }
}


export function areNotificationsEnabled(user) {
  if (user && typeof user.notifications_enabled === 'boolean') {
    return user.notifications_enabled;
  }
  return readLocalNotificationsEnabled();
}
