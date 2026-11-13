export const LOGIN_PATH = '/login';
export const HOME_PATH = '/employees';
/** Mirrors the API's cookie name; only its presence is checked here; the API verifies it. */
export const SESSION_COOKIE = 'acme_session';

/**
 * Where to go after signing in. Only same-site paths are allowed, so a crafted
 * `/login?next=https://evil.example` link cannot bounce the user off-site (open redirect).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return HOME_PATH;
  }
  if (next === LOGIN_PATH || next.startsWith(`${LOGIN_PATH}?`)) {
    return HOME_PATH;
  }
  return next;
}

export function loginUrl(next: string): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

let redirecting = false;

/**
 * Called when the API answers 401 (expired or revoked session): clears the stale cookie, then
 * sends the user to sign in and back to where they were. Concurrent 401s redirect only once.
 */
export async function handleExpiredSession(): Promise<void> {
  if (redirecting || window.location.pathname === LOGIN_PATH) return;
  redirecting = true;
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  window.location.assign(loginUrl(window.location.pathname + window.location.search));
}
