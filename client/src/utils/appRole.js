/** Роль интерфейса после входа: admin | user (student/teacher в API → user). */
export const APP_ROLE_KEY = 'appRole';

export function setAppRoleFromUser(user) {
  if (!user) {
    try {
      localStorage.removeItem(APP_ROLE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  const role = user.role === 'admin' ? 'admin' : 'user';
  try {
    localStorage.setItem(APP_ROLE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function clearAppRole() {
  try {
    localStorage.removeItem(APP_ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export function getAppRole() {
  try {
    return localStorage.getItem(APP_ROLE_KEY);
  } catch {
    return null;
  }
}
