import {
  CHALLENGES,
  FIELD_LABELS,
  FP_AIMS,
  PROPERTY_AIMS,
  SETTINGS,
  ALL_PERSONAS,
} from "./personas";
import {
  EDUCATION_FIELD_LABELS,
  getEducationAims,
  getEducationChallenges,
  getEducationPersonas,
  getEducationSettings,
  isStudentGrade,
  studentGradeLabel,
} from "./educationInterview";
import type {
  AgentProfile,
  Aim,
  Challenge,
  Persona,
  PracticePack,
  Setting,
  StudentGrade,
} from "../types/domain";

export const PRACTICE_PACK_STORAGE_KEY = "arena_practice_pack";

/**
 * Education / interview pack. Off by default (Property trial).
 * Local: set VITE_ENABLE_EDUCATION_PACK=true in .env, then restart `npm run dev`.
 * Live student trial: set the same env on the VPS (or flip default to true) and rebuild.
 */
export const ENABLE_EDUCATION_PACK =
  import.meta.env.VITE_ENABLE_EDUCATION_PACK === "true";

export function normalizePracticePack(value: unknown): PracticePack {
  if (!ENABLE_EDUCATION_PACK) return "property";
  return value === "education" ? "education" : "property";
}

/** Best-effort pack from DB row, auth metadata, saved profile, or signup session. */
export function resolvePracticePack(input: {
  dbPack?: unknown;
  authMetaPack?: unknown;
  agentProfile?: AgentProfile | null;
  sessionStoragePack?: string | null;
}): PracticePack {
  if (!ENABLE_EDUCATION_PACK) return "property";
  if (normalizePracticePack(input.dbPack) === "education") return "education";
  if (normalizePracticePack(input.authMetaPack) === "education") return "education";
  if (normalizePracticePack(input.sessionStoragePack) === "education") return "education";
  if (isStudentGrade(input.agentProfile?.studentGrade)) return "education";
  return "property";
}

export function packLabel(pack: PracticePack): string {
  return pack === "education" ? "Education" : "Property";
}

export function getStudentGradeFromProfile(himself: AgentProfile | null | undefined): StudentGrade | null {
  if (!himself) return null;
  return isStudentGrade(himself.studentGrade) ? himself.studentGrade : null;
}

export function isEducationProfileComplete(himself: AgentProfile | null | undefined): boolean {
  if (!himself) return false;
  if (!String(himself.name || "").trim()) return false;
  return isStudentGrade(himself.studentGrade);
}

export function isPropertyProfileComplete(himself: AgentProfile | null | undefined): boolean {
  if (!himself) return false;
  return Boolean(String(himself.name || "").trim());
}

export type PackContent = {
  personas: Persona[];
  aims: Aim[];
  settings: Setting[];
  challenges: Challenge[];
  fieldLabels: [string, string, string];
  counterpartyLabel: string; // Client | Interviewer
  traineeLabel: string; // Agent | Candidate
  practiceHeadline: string;
};

export function getPackContent(
  practicePack: PracticePack,
  himself: AgentProfile | null | undefined
): PackContent {
  if (ENABLE_EDUCATION_PACK && practicePack === "education") {
    const grade = getStudentGradeFromProfile(himself) || "university";
    return {
      personas: getEducationPersonas(grade),
      aims: getEducationAims(grade),
      settings: getEducationSettings(grade),
      challenges: getEducationChallenges(grade),
      fieldLabels: EDUCATION_FIELD_LABELS,
      counterpartyLabel: "Interviewer",
      traineeLabel: "Candidate",
      practiceHeadline: `Interview practice · ${studentGradeLabel(grade)}`,
    };
  }

  const industryKey = "Property" as const;
  return {
    personas: ALL_PERSONAS.filter((p) => p.industry === industryKey),
    aims: PROPERTY_AIMS,
    settings: SETTINGS,
    challenges: CHALLENGES,
    fieldLabels: FIELD_LABELS.Property,
    counterpartyLabel: "Client",
    traineeLabel: "Agent",
    practiceHeadline: "What will you practise today?",
  };
}

/** Property still supports FP content if flag enabled later — kept for App switchIndustry. */
export function getPropertyOrFpContent(industry: "Property" | "FP"): Pick<PackContent, "personas" | "aims"> {
  return {
    personas: ALL_PERSONAS.filter((p) => p.industry === (industry === "Property" ? "Property" : "FP")),
    aims: industry === "Property" ? PROPERTY_AIMS : FP_AIMS,
  };
}
