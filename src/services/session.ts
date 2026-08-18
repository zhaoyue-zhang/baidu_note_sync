const SESSION_KEY = 'baidu-notes-session';

export function getSessionToken() {
  return localStorage.getItem(SESSION_KEY) || '';
}

export function setSessionToken(token: string) {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthed() {
  return Boolean(getSessionToken());
}
