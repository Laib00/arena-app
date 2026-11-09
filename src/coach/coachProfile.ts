export type CoachCredential = {
  id: string;
  title: string;
  institution: string;
  year?: string;
  link?: string;
  /** Reserved for Arena-checked credentials later */
  verified?: boolean;
};

export type CoachProfileRow = {
  profile_id: string;
  display_name: string | null;
  /** “How I coach” — approach to practice and feedback */
  bio: string | null;
  headline: string | null;
  experience_role: string | null;
  experience_org: string | null;
  experience_summary: string | null;
  qualifications: CoachCredential[];
  who_i_coach: string | null;
  industries: string[];
  practice_skills: string[];
  avatar_path: string | null;
  /** Legacy chip list — kept in sync for older rows */
  specialties?: string[] | unknown;
  created_at?: string;
  updated_at?: string;
};

export const COACH_INDUSTRY_OPTIONS = [
  "Property",
  "Financial Planning",
  "Education / Interview",
] as const;

export const COACH_PRACTICE_SKILL_OPTIONS = [
  "Discovery calls",
  "Objection handling",
  "Closing",
  "Buyer consultations",
  "Negotiation",
  "Needs analysis",
] as const;

const INDUSTRY_SET = new Set<string>(COACH_INDUSTRY_OPTIONS);

export function parseStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((s) => String(s).trim()).filter(Boolean);
      }
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function parseCredentials(raw: unknown): CoachCredential[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const title = String(o.title || "").trim();
      if (!title) return null;
      return {
        id: String(o.id || `cred-${i}-${title}`),
        title,
        institution: String(o.institution || "").trim(),
        year: o.year != null ? String(o.year).trim() : "",
        link: o.link != null ? String(o.link).trim() : "",
        verified: Boolean(o.verified),
      } satisfies CoachCredential;
    })
    .filter((c): c is CoachCredential => Boolean(c));
}

/** Split legacy specialties chips into industry vs practice skills. */
export function splitLegacySpecialties(raw: unknown): {
  industries: string[];
  practice_skills: string[];
} {
  const list = parseStringList(raw);
  const industries: string[] = [];
  const practice_skills: string[] = [];
  for (const item of list) {
    if (INDUSTRY_SET.has(item)) industries.push(item);
    else practice_skills.push(item);
  }
  return { industries, practice_skills };
}

export function normalizeCoachProfile(raw: Record<string, unknown> | null | undefined): CoachProfileRow | null {
  if (!raw || !raw.profile_id) return null;
  let industries = parseStringList(raw.industries);
  let practice_skills = parseStringList(raw.practice_skills);
  if (!industries.length && !practice_skills.length && raw.specialties != null) {
    const split = splitLegacySpecialties(raw.specialties);
    industries = split.industries;
    practice_skills = split.practice_skills;
  }
  return {
    profile_id: String(raw.profile_id),
    display_name: raw.display_name != null ? String(raw.display_name) : null,
    bio: raw.bio != null ? String(raw.bio) : null,
    headline: raw.headline != null ? String(raw.headline) : null,
    experience_role: raw.experience_role != null ? String(raw.experience_role) : null,
    experience_org: raw.experience_org != null ? String(raw.experience_org) : null,
    experience_summary: raw.experience_summary != null ? String(raw.experience_summary) : null,
    qualifications: parseCredentials(raw.qualifications),
    who_i_coach: raw.who_i_coach != null ? String(raw.who_i_coach) : null,
    industries,
    practice_skills,
    avatar_path: raw.avatar_path != null ? String(raw.avatar_path) : null,
    specialties: [...industries, ...practice_skills],
    created_at: raw.created_at != null ? String(raw.created_at) : undefined,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : undefined,
  };
}

export function isCoachProfileComplete(row: CoachProfileRow | null | undefined): boolean {
  return Boolean(row?.display_name && String(row.display_name).trim());
}

export function coachInitials(name: string | null | undefined): string {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function newCredentialId(): string {
  return `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const COACH_PROFILE_SELECT =
  "profile_id, display_name, bio, headline, experience_role, experience_org, experience_summary, qualifications, who_i_coach, industries, practice_skills, avatar_path, specialties, created_at, updated_at";
