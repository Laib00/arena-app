import { certificationsForIndustry, occupationForIndustry } from "./constants";
import type { AgentProfile, Industry } from "./types/domain";

/** Property / FP workspaces only (Education pack uses a flat student profile). */
export type SalesIndustry = "Property" | "FP";

/** Persisted shape: one agent profile per practice workspace. */
export type WorkspaceBag = {
  version: 1;
  Property?: AgentProfile;
  FP?: AgentProfile;
};

export function isWorkspaceBag(value: unknown): value is WorkspaceBag {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return obj.version === 1 && ("Property" in obj || "FP" in obj);
}

export function toSalesIndustry(value: unknown): SalesIndustry {
  return value === "Property" || value === "property" ? "Property" : "FP";
}

/** @deprecated use toSalesIndustry — kept name for call sites that expect Industry. */
export function normalizeIndustry(value: unknown): SalesIndustry {
  return toSalesIndustry(value);
}

export function industryDbValue(industry: SalesIndustry): "Property" | "Financial Planning" {
  return industry === "Property" ? "Property" : "Financial Planning";
}

export function industryLabel(industry: SalesIndustry | Industry): string {
  return industry === "Property" ? "Property" : "Financial Planning";
}

export function defaultProfileForIndustry(
  industry: SalesIndustry,
  from?: AgentProfile | null
): AgentProfile {
  return {
    name: from?.name || "",
    age: from?.age ?? "",
    occupation: occupationForIndustry(industry),
    nationality: from?.nationality || "Singaporean",
    experience: from?.experience ?? "",
    education: from?.education || "Bachelor's Degree",
    disc: from?.disc || "I",
    salesStyle: from?.salesStyle || "Consultative",
    certification: certificationsForIndustry(industry)[0],
  };
}

/** Read legacy flat profile or workspace bag into a bag + active profile. */
export function parseAgentWorkspaces(
  raw: unknown,
  industry: SalesIndustry
): { bag: WorkspaceBag; current: AgentProfile | null } {
  if (!raw || typeof raw !== "object") {
    return { bag: { version: 1 }, current: null };
  }

  if (isWorkspaceBag(raw)) {
    const current = raw[industry] || null;
    return { bag: { version: 1, Property: raw.Property, FP: raw.FP }, current };
  }

  const flat = raw as AgentProfile;
  return {
    bag: { version: 1, [industry]: flat },
    current: flat,
  };
}

export function putWorkspaceProfile(
  bag: WorkspaceBag,
  industry: SalesIndustry,
  profile: AgentProfile
): WorkspaceBag {
  return {
    version: 1,
    Property: industry === "Property" ? profile : bag.Property,
    FP: industry === "FP" ? profile : bag.FP,
  };
}

export function hasUsableAgentProfile(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  if (isWorkspaceBag(raw)) {
    return Boolean(raw.Property?.name || raw.FP?.name);
  }
  return Boolean((raw as AgentProfile).name);
}
