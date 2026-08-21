import type { Challenge, Grade } from "./types/domain";

/** Total XP required to *reach* this level (cumulative). */
export const LEVELS = [
  { level: 1, title: "Rookie", xpRequired: 0 },
  { level: 2, title: "Trainee", xpRequired: 1000 },
  { level: 3, title: "Practitioner", xpRequired: 2500 },
  { level: 4, title: "Contender", xpRequired: 4500 },
  { level: 5, title: "Pro", xpRequired: 7000 },
  { level: 6, title: "Specialist", xpRequired: 10000 },
  { level: 7, title: "Closer", xpRequired: 14000 },
  { level: 8, title: "Veteran", xpRequired: 19000 },
  { level: 9, title: "Elite", xpRequired: 25000 },
  { level: 10, title: "Arena Master", xpRequired: 32000 },
] as const;

export const XP_BASE = 25;
export const XP_CHALLENGE_BONUS = 15;
export const XP_HARD_BONUS = 15;
export const XP_IMPOSSIBLE_BONUS = 25;

export type SessionXpInput = {
  grade?: Grade | string | null;
  hasChallenge?: boolean;
};

export function xpForSession({ grade, hasChallenge }: SessionXpInput): number {
  let xp = XP_BASE;
  if (hasChallenge) xp += XP_CHALLENGE_BONUS;
  if (grade === "Hard") xp += XP_HARD_BONUS;
  if (grade === "Impossible") xp += XP_IMPOSSIBLE_BONUS;
  return xp;
}

export function sessionHasChallenge(conv: {
  challenge_snapshot?: Challenge | null;
  client_snapshot?: { _challenge?: Challenge | null } | null;
}): boolean {
  return Boolean(conv.challenge_snapshot || conv.client_snapshot?._challenge);
}

export type LevelProgress = {
  level: number;
  title: string;
  totalXp: number;
  /** XP at the start of the current level */
  levelStartXp: number;
  /** XP needed to reach the next level (same as totalXp at max level) */
  nextLevelXp: number | null;
  /** 0–100 progress within the current level */
  percentToNext: number;
  isMaxLevel: boolean;
};

export function getLevelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(Number(totalXp) || 0));
  let current = LEVELS[0];
  for (const row of LEVELS) {
    if (xp >= row.xpRequired) current = row;
    else break;
  }
  const idx = LEVELS.findIndex((r) => r.level === current.level);
  const next = LEVELS[idx + 1] ?? null;
  const levelStartXp = current.xpRequired;
  if (!next) {
    return {
      level: current.level,
      title: current.title,
      totalXp: xp,
      levelStartXp,
      nextLevelXp: null,
      percentToNext: 100,
      isMaxLevel: true,
    };
  }
  const span = next.xpRequired - levelStartXp;
  const into = xp - levelStartXp;
  const percentToNext = span <= 0 ? 100 : Math.min(100, Math.max(0, (into / span) * 100));
  return {
    level: current.level,
    title: current.title,
    totalXp: xp,
    levelStartXp,
    nextLevelXp: next.xpRequired,
    percentToNext,
    isMaxLevel: false,
  };
}
