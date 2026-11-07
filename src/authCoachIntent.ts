/**
 * Google OAuth does not reliably store `signInWithOAuth({ data: { account_type } })`
 * in user_metadata, and the return URL query can be dropped. This flag is set on the
 * coach signup page immediately before the Google redirect, then consumed after login.
 */
const KEY = "arena_coach_google_intent_v1";
const MAX_AGE_MS = 15 * 60 * 1000;

export function markCoachGoogleIntent(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function clearCoachGoogleIntent(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function hasCoachGoogleIntent(): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const started = Number(raw);
    if (!Number.isFinite(started) || Date.now() - started > MAX_AGE_MS) {
      sessionStorage.removeItem(KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
