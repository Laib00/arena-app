/** Logged-in product base path (not the marketing site). */
export const APP_BASE = "/dashboard";

export function appPath(suffix = ""): string {
  if (!suffix || suffix === "/") return APP_BASE;
  return `${APP_BASE}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}
