/** Calendar date key in a timezone, e.g. "2026-08-13". */
export function toDateKey(
  isoOrDate: string | Date | null | undefined,
  timeZone = "Asia/Singapore"
): string | null {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate as string);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, day!));
  utc.setUTCDate(utc.getUTCDate() + deltaDays);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Current practice streak from finished-session timestamps.
 * Counts one day per calendar day with ≥1 ended session.
 * Streak holds if last practice was today or yesterday; else 0.
 */
export function computePracticeStreak(
  endedAtList: Array<string | null | undefined> | null | undefined,
  now: Date = new Date(),
  timeZone = "Asia/Singapore"
): number {
  const days = new Set<string>();
  for (const iso of endedAtList || []) {
    const key = toDateKey(iso, timeZone);
    if (key) days.add(key);
  }
  if (days.size === 0) return 0;

  const today = toDateKey(now, timeZone);
  if (!today) return 0;
  const yesterday = shiftDateKey(today, -1);

  let cursor: string | null = null;
  if (days.has(today)) cursor = today;
  else if (days.has(yesterday)) cursor = yesterday;
  else return 0;

  let streak = 0;
  while (cursor && days.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function formatStreakLabel(streak: number | string | null | undefined): string {
  const n = Number(streak) || 0;
  return n === 1 ? "1 day" : `${n} days`;
}
