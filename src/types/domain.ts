export type DiscType = "D" | "I" | "S" | "C";

export type Grade = "Easy" | "Medium" | "Hard" | "Impossible";

/** Locked at signup: Property (sales) or Education (interview module first). */
export type PracticePack = "property" | "education";

export type StudentGrade = "high_school" | "polytechnic" | "university" | "fresh_grad";

export type Industry = "Property" | "FP" | "Education";

export type ChipTone = "amber" | "rose" | "green" | "lavender" | "teal" | "blue";

export interface DiscChip {
  label: string;
  tone: ChipTone;
}

export interface Aim {
  key: string;
  desc: string;
}

export interface Setting {
  key: string;
  desc: string;
  /** If set, only shown for these student grades (Education pack). */
  studentGrades?: StudentGrade[];
}

export interface Challenge {
  id: string;
  label: string;
  promptHint: string;
  /** If set, only shown for these student grades (Education pack). */
  studentGrades?: StudentGrade[];
  /** Which industry this challenge belongs to. Defaults to Property if omitted. */
  industry?: Industry | "both";
}

export interface Persona {
  id: string;
  grade: Grade;
  name: string;
  age: number;
  occupation: string;
  nationality: string;
  edu: string;
  disc: DiscType;
  badExp: string;
  badExpReason: string;
  needLevel: string;
  lifeStage: string;
  field1: string;
  field2: string;
  field3: string;
  notes: string;
  industry: Industry;
  /** Education interview personas: which student grade band can see them. */
  studentGrade?: StudentGrade;
  isRandom?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentProfile {
  name: string;
  age?: number | string;
  occupation?: string;
  nationality?: string;
  experience?: number | string;
  education?: string;
  disc?: DiscType | string;
  salesStyle?: string;
  certification?: string;
  yearsExp?: number | string;
  certifications?: string;
  /** Education pack: high_school | polytechnic | university | fresh_grad */
  studentGrade?: StudentGrade | string;
  /** Education pack: field of study / stream */
  fieldOfStudy?: string;
  /** Education pack: what they are practising toward */
  targetPath?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  xp?: number | null;
  [key: string]: unknown;
}

export interface ConversationSession {
  id: string;
  user_id: string;
  client_name?: string | null;
  client_grade?: Grade | string | null;
  industry?: Industry | string | null;
  aim?: string | null;
  setting?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  himself_snapshot?: AgentProfile | null;
  client_snapshot?: (Persona & { _challenge?: Challenge | null }) | null;
  challenge_snapshot?: Challenge | null;
  xp_awarded?: number | null;
  [key: string]: unknown;
}

export type OpenConversation = Pick<
  ConversationSession,
  "id" | "client_name" | "client_grade" | "industry"
>;
