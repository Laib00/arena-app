import { useEffect, useState } from "react";
import type { CSSProperties, ElementType, MouseEventHandler, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CircleArrowDown,
  CircleHelp,
  Clock,
  FileKey,
  Flame,
  GraduationCap,
  Heart,
  Landmark,
  Layers,
  MapPin,
  MessageCircleOff,
  Percent,
  RotateCcw,
  Shield,
  ShieldCheck,
  Star,
  Tag,
  Target,
  Timer,
  TrendingUp,
  User,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NAVY, GOLD, CREAM, GRADE_COLOR } from "../theme";
import { SETTINGS, GRADE_ORDER, CHALLENGES } from "../data/personas";
import { formatStreakLabel } from "../streak";
import { getLevelProgress } from "../xp";
import GradeBadge from "../components/GradeBadge";
import PersonaCard from "../components/PersonaCard";
import type {
  AgentProfile,
  Aim,
  Challenge,
  ConversationSession,
  Grade,
  Persona,
} from "../types/domain";

const CHALLENGE_GREEN = "#3D8B6E";
const CHALLENGE_FALLBACK = "#E8F3EE";
const CALL_FALLBACK = "#F8EEE4";
const CARD_SANS = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type PracticeEntryCardProps = {
  as?: "button" | "div";
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  comingSoon?: boolean;
  className?: string;
  background?: string;
  backgroundImage?: string;
  dark?: boolean;
  accent: string;
  logo: ReactNode;
  label: string;
  title: string;
  body: string;
  cta: string;
  extra?: ReactNode;
};

function PracticeEntryCard({
  as: Tag = "button",
  onClick,
  disabled,
  comingSoon,
  className,
  background,
  backgroundImage,
  dark,
  accent,
  logo,
  label,
  title,
  body,
  cta,
  extra,
}: PracticeEntryCardProps) {
  const CardTag: ElementType = Tag;
  const text = dark ? "#fff" : NAVY;
  const muted = dark ? "rgba(255,255,255,0.88)" : "#3F4A5A";
  const isInactive = Boolean(disabled || comingSoon);

  return (
    <CardTag
      type={Tag === "button" ? "button" : undefined}
      onClick={isInactive ? undefined : onClick}
      className={className}
      aria-disabled={isInactive || undefined}
      style={{
        textAlign: "left",
        border: "none",
        cursor: isInactive ? "default" : onClick ? "pointer" : "default",
        borderRadius: 24,
        padding: 28,
        minHeight: 292,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundColor: background || "#fff",
        color: text,
        boxShadow: "0 8px 24px rgba(10,22,40,0.06)",
        fontFamily: CARD_SANS,
      }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            transform: "scale(1.22)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}
      {extra}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          filter: comingSoon ? "blur(2.5px)" : undefined,
          opacity: comingSoon ? 0.72 : 1,
        }}
      >
        {logo}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: accent,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            margin: "16px 0 10px",
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.3, color: text, marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ width: 40, height: 3, background: accent, borderRadius: 2, marginBottom: 14 }} />
        <p style={{ fontSize: 14, color: muted, lineHeight: 1.55, margin: 0, maxWidth: 260, fontWeight: 400 }}>
          {body}
        </p>
        <div
          style={{
            marginTop: "auto",
            paddingTop: 22,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            color: dark ? "#fff" : accent,
          }}
        >
          {cta}
          <ArrowRight size={15} strokeWidth={2.2} color={accent} />
        </div>
      </div>
      {comingSoon && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(248, 246, 241, 0.38)",
            backdropFilter: "blur(1px)",
            WebkitBackdropFilter: "blur(1px)",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#6B7280",
              letterSpacing: 0.2,
            }}
          >
            Coming Soon
          </span>
        </div>
      )}
    </CardTag>
  );
}

function CardLogoImg({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        overflow: "hidden",
        background: "#fff",
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        width={48}
        height={48}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.5)",
          display: "block",
        }}
      />
    </div>
  );
}

function relativeTime(iso?: string | null): string {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

const WIZARD_STEPS = ["grade", "client", "scenario"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

const GRADE_BLURBS: Record<Grade, string> = {
  Easy: "Warm, ready to move, no history with a bad agent. Good for finding your rhythm.",
  Medium: "A real complication — a tight budget, an emotional attachment, or no patience for your preamble.",
  Hard: "They've been burned before and they will test you early. Trust has to be earned in the conversation.",
  Impossible: "They want something no honest agent can deliver, and they won't accept no. You can't win. You can only handle it well.",
};

const STEP_COPY: Record<WizardStep, { title: string; subtitle: string }> = {
  grade: { title: "Choose difficulty", subtitle: "How tough should this client be?" },
  client: { title: "Choose your client", subtitle: "Pick who you'll practise with." },
  scenario: { title: "Choose scenario", subtitle: "Set the aim and the setting for this conversation." },
};

const CHALLENGE_BLURBS: Record<string, string> = {
  price_objection: "The client pushes back on price, value, or affordability — but only once the conversation gets there.",
  rejection: "The client grows reluctant and may try to end the conversation if you don't earn their interest.",
  ask_commitment: "The client keeps talking but won't commit to a next step until they feel genuinely ready.",
  commission_objection: "The client questions your fee and asks why they should not use a cheaper agent.",
  unrealistic_price: "A seller insists their property is worth significantly more than the market supports.",
  budget_mismatch: "The client's ideal property, location, and budget do not realistically align.",
  lowball_offer: "A buyer insists on submitting an offer that is unlikely to be accepted.",
  trust_after_bad_agent: "The client has been misled or pressured before and now doubts agents' motives.",
  competing_agents: "The client is comparing several agents and sees little difference between them.",
  exclusive_agreement: "The client refuses exclusive representation because they fear being locked in.",
  indecisive_client: "The client remains interested but repeatedly delays and asks for more options.",
  family_disagreement: "A spouse or family member has conflicting priorities and must agree to proceed.",
  financing_uncertainty: "The client is anxious and unclear about affordability, loans, CPF, or upfront costs.",
  market_timing: "The client wants to wait for prices or interest rates to move in their favour.",
  property_defect: "A suspected defect causes the client to lose confidence in the property and transaction.",
  location_compromise: "The preferred location matters deeply, but suitable homes there exceed the budget.",
  urgent_sale: "A seller faces a serious deadline and must balance speed, price, and personal pressure.",
  emotional_attachment: "Personal memories make pricing feedback and practical selling advice feel upsetting.",
  demanding_guarantees: "The client demands guaranteed appreciation, yield, or profit before proceeding.",
  information_overload: "A first-time client becomes overwhelmed by terminology, paperwork, and decisions.",
  silent_client: "The client gives short, guarded answers and makes discovery difficult.",
  expertise_challenge: "A knowledgeable client asks detailed questions and tests whether the agent will bluff.",
};

const CHALLENGE_ICONS: Record<string, LucideIcon> = {
  price_objection: Tag,
  rejection: Shield,
  ask_commitment: Target,
  commission_objection: Percent,
  unrealistic_price: TrendingUp,
  budget_mismatch: Wallet,
  lowball_offer: CircleArrowDown,
  trust_after_bad_agent: User,
  competing_agents: Users,
  exclusive_agreement: FileKey,
  indecisive_client: CircleHelp,
  family_disagreement: UsersRound,
  financing_uncertainty: Landmark,
  market_timing: Clock,
  property_defect: AlertTriangle,
  location_compromise: MapPin,
  urgent_sale: Timer,
  emotional_attachment: Heart,
  demanding_guarantees: ShieldCheck,
  information_overload: Layers,
  silent_client: MessageCircleOff,
  expertise_challenge: GraduationCap,
};

type ChallengeSetupModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectChallenge: (challenge: Challenge) => void;
};

function ChallengeSetupModal({ open, onClose, onSelectChallenge }: ChallengeSetupModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 16px", zIndex: 50, boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        className="arena-practice-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560,
          maxHeight: "calc(100vh - 96px)", overflowY: "auto", padding: "28px 24px 20px", position: "relative",
          boxShadow: "0 24px 64px rgba(10,22,40,0.28)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%",
            background: "#fff", border: "1px solid #E8E4DC", cursor: "pointer", color: "#9CA3AF",
            display: "grid", placeItems: "center",
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
          Targeted practice
        </div>
        <h2 style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 28, fontWeight: 700, margin: "0 0 8px", color: NAVY, letterSpacing: -0.4 }}>
          Choose a challenge
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginTop: 0, marginBottom: 18, lineHeight: 1.5, maxWidth: 420 }}>
          Pick one difficult moment to train. We'll match you with a random client and scenario focused on it.
        </p>

        <div className="arena-challenge-list">
          {CHALLENGES.map((c) => {
            const Icon = CHALLENGE_ICONS[c.id] || Target;
            return (
              <button
                key={c.id}
                type="button"
                className="arena-challenge-option"
                onClick={() => onSelectChallenge(c)}
              >
                <span className="arena-challenge-option-icon">
                  <Icon size={18} color={GOLD} strokeWidth={1.8} />
                </span>
                <span className="arena-challenge-option-copy">
                  <span className="arena-challenge-option-title">{c.label}</span>
                  <span className="arena-challenge-option-blurb">{CHALLENGE_BLURBS[c.id]}</span>
                </span>
                <ChevronRight size={18} color="#C4C0B6" strokeWidth={1.8} className="arena-challenge-option-chevron" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type PracticeSetupModalProps = {
  open: boolean;
  onClose: () => void;
  industry?: string;
  switchIndustry?: (industry: string) => void | Promise<void>;
  himself: AgentProfile;
  onEditProfile: () => void;
  industryPersonas: Persona[];
  metPersonaIds?: ReadonlySet<unknown>;
  clientId: string | null;
  pickFixedClient: (id: string | null) => void;
  randomClient: Persona | null;
  generateRandom: () => void;
  aims: Aim[];
  aimKey: string | null;
  setAimKey: (key: string) => void;
  settingKey: string | null;
  setSettingKey: (key: string) => void;
  challenge?: Challenge | null;
  setChallenge?: (challenge: Challenge | null) => void;
  canStart?: boolean;
  onStart: (challenge: Challenge | null) => void;
};

function PracticeSetupModal({
  open,
  onClose,
  himself,
  onEditProfile,
  industryPersonas,
  metPersonaIds,
  clientId,
  pickFixedClient,
  randomClient,
  generateRandom,
  aims,
  aimKey,
  setAimKey,
  settingKey,
  setSettingKey,
  onStart,
}: PracticeSetupModalProps) {
  const [wizardStep, setWizardStep] = useState<WizardStep>("grade");
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  useEffect(() => {
    if (!open) return;
    setWizardStep("grade");
    setSelectedGrade(null);
  }, [open]);

  if (!open) return null;

  const stepIndex = WIZARD_STEPS.indexOf(wizardStep);
  const copy = STEP_COPY[wizardStep];
  const gradeClients = selectedGrade
    ? industryPersonas.filter((p) => p.grade === selectedGrade)
    : [];
  const scenarioReady = Boolean(aimKey && settingKey);

  function goBack() {
    if (wizardStep === "client") {
      pickFixedClient(null);
      setWizardStep("grade");
      return;
    }
    if (wizardStep === "scenario") {
      setWizardStep("client");
    }
  }

  function chooseGrade(grade: Grade) {
    setSelectedGrade(grade);
    setWizardStep("client");
  }

  function chooseClient(id: string) {
    pickFixedClient(id);
    setWizardStep("scenario");
  }

  function chooseRandom() {
    generateRandom();
    setWizardStep("scenario");
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(10,22,40,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 16px", zIndex: 50, boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        className="arena-practice-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 920,
          maxHeight: "calc(100vh - 96px)", overflowY: "auto", padding: "28px 28px 32px", position: "relative",
          boxShadow: "0 24px 64px rgba(10,22,40,0.28)",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {wizardStep !== "grade" && (
          <button type="button" className="arena-wizard-back" onClick={goBack}>
            <ChevronLeft size={16} /> Back
          </button>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>
          Open practice
        </div>
        <h2 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 28, margin: "0 0 6px", color: NAVY }}>
          {copy.title}
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", marginTop: 0, marginBottom: 18 }}>
          {copy.subtitle}
        </p>

        <div className="arena-wizard-progress" aria-label={`Step ${stepIndex + 1} of ${WIZARD_STEPS.length}`}>
          {WIZARD_STEPS.map((s, i) => (
            <span key={s} className={`arena-wizard-dot${i <= stepIndex ? " is-on" : ""}`} />
          ))}
          <span className="arena-wizard-step-label">Step {stepIndex + 1} of {WIZARD_STEPS.length}</span>
        </div>

        {wizardStep === "grade" && (
          <>
            <div className="arena-agent-summary" style={{ background: CREAM, border: "1px solid #E8E4DC", borderRadius: 12, padding: "14px 16px", marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{himself.name || "(no name set)"}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  {himself.occupation}{himself.age ? ` · ${himself.age}` : ""} · DISC {himself.disc}
                </div>
              </div>
              <button
                onClick={onEditProfile}
                style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${GOLD}`, background: "#fff", color: NAVY, fontWeight: 600, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
              >
                Edit Profile
              </button>
            </div>

            <div className="arena-wizard-grades">
              {GRADE_ORDER.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className="arena-wizard-grade"
                  onClick={() => chooseGrade(grade)}
                  style={{ "--grade-color": GRADE_COLOR[grade] } as CSSProperties}
                >
                  <GradeBadge grade={grade} size="md" />
                  <p>{GRADE_BLURBS[grade]}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {wizardStep === "client" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <GradeBadge grade={selectedGrade ?? ""} size="md" />
              <button
                type="button"
                onClick={chooseRandom}
                style={{
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  border: `1px solid ${GOLD}`, background: "#fff", color: NAVY,
                }}
              >
                Generate Random Client
              </button>
            </div>
            <div className="arena-persona-grid">
              {gradeClients.map((p) => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  selected={!randomClient && clientId === p.id}
                  met={metPersonaIds?.has(p.id)}
                  onSelect={chooseClient}
                />
              ))}
            </div>
          </>
        )}

        {wizardStep === "scenario" && (
          <>
            <div style={{ background: CREAM, border: "1px solid #E8E4DC", borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Aim</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {aims.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAimKey(a.key)}
                    style={{
                      padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                      border: aimKey === a.key ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                      background: aimKey === a.key ? NAVY : "#fff",
                      color: aimKey === a.key ? "#fff" : NAVY, fontWeight: 500,
                    }}
                  >
                    {a.key}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Setting</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SETTINGS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSettingKey(s.key)}
                    style={{
                      padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                      border: settingKey === s.key ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                      background: settingKey === s.key ? NAVY : "#fff",
                      color: settingKey === s.key ? "#fff" : NAVY, fontWeight: 500,
                    }}
                  >
                    {s.key}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!scenarioReady}
              onClick={() => onStart(null)}
              style={{
                width: "100%", padding: "16px", borderRadius: 10, border: "none",
                cursor: scenarioReady ? "pointer" : "not-allowed",
                background: scenarioReady ? GOLD : "#E2DFD6",
                color: scenarioReady ? "#fff" : "#9CA3AF",
                fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Start conversation <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type RecentSessions = {
  items: ConversationSession[];
  totalEndedCount: number;
  practiceStreak: number;
  xp: number;
};

type SetupScreenProps = {
  industry: string;
  switchIndustry: (industry: string) => void | Promise<void>;
  himself: AgentProfile;
  onEditProfile: () => void;
  industryPersonas: Persona[];
  metPersonaIds?: ReadonlySet<unknown>;
  clientId: string | null;
  pickFixedClient: (id: string | null) => void;
  randomClient: Persona | null;
  generateRandom: () => void;
  aims: Aim[];
  aimKey: string | null;
  setAimKey: (key: string) => void;
  settingKey: string | null;
  setSettingKey: (key: string) => void;
  challenge: Challenge | null;
  setChallenge: (challenge: Challenge | null) => void;
  canStart: boolean;
  startRoleplay: (challenge: Challenge | null) => void | Promise<void>;
  onStartChallenge?: (challenge: Challenge) => void | Promise<void>;
  recentSessions?: RecentSessions;
  onReplay?: (session: ConversationSession) => void | Promise<void>;
  onExpandReplayList?: () => void | Promise<void>;
  onViewHistory: () => void;
};

export default function SetupScreen({
  industry, switchIndustry, himself, onEditProfile, industryPersonas, metPersonaIds,
  clientId, pickFixedClient, randomClient, generateRandom, aims, aimKey, setAimKey, settingKey, setSettingKey,
  challenge, setChallenge,
  canStart, startRoleplay, onStartChallenge, recentSessions, onReplay, onExpandReplayList, onViewHistory,
}: SetupScreenProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [replayExpanded, setReplayExpanded] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);

  const rounds = recentSessions?.totalEndedCount ?? 0;
  const practiceStreak = recentSessions?.practiceStreak ?? 0;
  const totalXp = recentSessions?.xp ?? 0;
  const progress = getLevelProgress(totalXp);
  const barWidth = `${Math.max(progress.percentToNext, progress.totalXp > 0 ? 2 : 0)}%`;
  const xpRemaining = progress.isMaxLevel
    ? 0
    : Math.max(0, (progress.nextLevelXp ?? 0) - progress.totalXp);
  const nextLabel = progress.isMaxLevel
    ? "Max level"
    : `${xpRemaining.toLocaleString()} XP to next level`;
  const replayItems = recentSessions?.items || [];
  const visibleReplayItems = replayExpanded ? replayItems : replayItems.slice(0, 3);
  const canExpandReplay = (recentSessions?.totalEndedCount ?? 0) > 3 || replayItems.length > 3;

  async function toggleReplayList() {
    if (replayExpanded) {
      setReplayExpanded(false);
      return;
    }
    setReplayLoading(true);
    try {
      await onExpandReplayList?.();
      setReplayExpanded(true);
    } finally {
      setReplayLoading(false);
    }
  }

  function openPracticeModal() {
    setChallenge(null);
    setModalOpen(true);
  }

  return (
    <div className="arena-setup-wrap" style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 24px 80px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>
            Welcome to your arena
          </div>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 36, letterSpacing: 0.2, margin: 0, color: NAVY, lineHeight: 1.15 }}>
            What will you practise today?
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#fff", border: "1px solid #E8E4DC" }}>
          <Flame size={18} color={GOLD} fill={GOLD} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{formatStreakLabel(practiceStreak)}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Current practice streak</div>
          </div>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          marginBottom: 14,
          fontFamily: CARD_SANS,
        }}
      >
        <span style={{ color: NAVY }}>Enter</span>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, display: "inline-block", flexShrink: 0 }} />
        <span style={{ color: "#9CA3AF" }}>Practice</span>
      </div>

      <div className="arena-home-practice-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 36 }}>
        <PracticeEntryCard
          onClick={openPracticeModal}
          className="arena-open-practice-card"
          background={NAVY}
          dark
          accent={GOLD}
          label="COMPLETE PRACTICE"
          title="Practice your deal"
          body="Meet realistic prospects with their own needs, fears and objections."
          cta="Start practicing"
          logo={(
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `1.5px solid ${GOLD}`,
                display: "grid",
                placeItems: "center",
                background: "rgba(10,22,40,0.55)",
              }}
            >
              <Star size={20} color={GOLD} strokeWidth={1.7} />
            </div>
          )}
          extra={(
            <div
              className="arena-open-practice-cta"
              style={{
                position: "absolute",
                right: 18,
                bottom: 18,
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: GOLD,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <span className="arena-open-practice-ripple" aria-hidden="true" />
              <span className="arena-open-practice-ripple arena-open-practice-ripple--delay" aria-hidden="true" />
              <ArrowRight size={20} strokeWidth={2.2} style={{ position: "relative", zIndex: 1 }} />
            </div>
          )}
        />

        <PracticeEntryCard
          onClick={() => setChallengeModalOpen(true)}
          className="arena-challenge-card"
          background={CHALLENGE_FALLBACK}
          backgroundImage="/Cards_background/Challenge_card_bg.png"
          accent={CHALLENGE_GREEN}
          label="Targeted practice"
          title="Take a Challenge"
          body="Train on difficult moments instead of running a full open conversation."
          cta="Browse challenges"
          logo={(
            <CardLogoImg
              src="/Cards_background/Cards_logo/challenge_card_logo.png"
              alt=""
            />
          )}
        />

        <PracticeEntryCard
          as="div"
          disabled
          comingSoon
          background={CALL_FALLBACK}
          backgroundImage="/Cards_background/Call_card_bg.png"
          accent={GOLD}
          label="Voice practice"
          title="Make Your First Call"
          body="No typing. Talk to a prospect and respond in real time."
          cta="Launch call"
          logo={(
            <CardLogoImg
              src="/Cards_background/Cards_logo/call_card_logo.png"
              alt=""
            />
          )}
        />
      </div>

      <div className="arena-home-bottom-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Replay */}
        <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, color: NAVY }}>Replay a round</h3>
            <button
              type="button"
              onClick={onViewHistory}
              style={{ background: "none", border: "none", color: GOLD, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              View history →
            </button>
          </div>
          {(recentSessions?.items || []).length === 0 ? (
            <div style={{ fontSize: 14, color: "#9CA3AF", padding: "12px 0" }}>No past sessions yet. Finish a practice to replay it here.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleReplayItems.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
                    borderRadius: 12, border: "1px solid #EFEBE3", background: CREAM,
                  }}
                >
                  <div style={{ fontWeight: 700, color: GOLD, fontSize: 15, width: 28 }}>{String(i + 1).padStart(2, "0")}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.challenge_snapshot?.label || s.client_name || "Session"}
                      {s.challenge_snapshot?.label ? "" : s.client_grade ? ` · ${s.client_grade}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      {s.client_name}{s.aim ? ` · ${s.aim}` : ""} · {relativeTime(s.ended_at || s.started_at)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onReplay?.(s)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 12px", borderRadius: 8, border: `1px solid ${GOLD}`,
                      background: "#fff", color: NAVY, fontWeight: 600, fontSize: 12, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    Again <RotateCcw size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {canExpandReplay && (
            <button
              type="button"
              onClick={toggleReplayList}
              disabled={replayLoading}
              style={{
                marginTop: 14, width: "100%", padding: "10px", borderRadius: 10,
                border: "1px solid #E8E4DC", background: "#fff", color: NAVY,
                fontWeight: 600, fontSize: 13, cursor: replayLoading ? "wait" : "pointer",
                opacity: replayLoading ? 0.7 : 1,
              }}
            >
              {replayLoading ? "Loading…" : replayExpanded ? "Less" : "More"}
            </button>
          )}
        </div>

        {/* Progress */}
        <div id="arena-progress" style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 18, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, color: NAVY }}>Your progress</h3>
            <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>
              Level {progress.level} · {progress.title}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: "ROUNDS", value: String(rounds) },
              { label: "STREAK", value: String(practiceStreak) },
              { label: "XP", value: String(totalXp) },
            ].map((stat) => (
              <div key={stat.label} style={{ background: CREAM, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 0.8 }}>{stat.label}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: NAVY, marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "#EFEBE3", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: barWidth, height: "100%", background: GOLD, borderRadius: 999 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280" }}>
            <span>{totalXp.toLocaleString()} XP</span>
            <span>{nextLabel}</span>
          </div>
        </div>
      </div>

      <ChallengeSetupModal
        open={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
        onSelectChallenge={(c) => {
          setChallengeModalOpen(false);
          onStartChallenge?.(c);
        }}
      />

      <PracticeSetupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        industry={industry}
        switchIndustry={switchIndustry}
        himself={himself}
        onEditProfile={onEditProfile}
        industryPersonas={industryPersonas}
        metPersonaIds={metPersonaIds}
        clientId={clientId}
        pickFixedClient={pickFixedClient}
        randomClient={randomClient}
        generateRandom={generateRandom}
        aims={aims}
        aimKey={aimKey}
        setAimKey={setAimKey}
        settingKey={settingKey}
        setSettingKey={setSettingKey}
        challenge={challenge}
        setChallenge={setChallenge}
        canStart={canStart}
        onStart={(nextChallenge) => {
          setModalOpen(false);
          startRoleplay(nextChallenge);
        }}
      />
    </div>
  );
}
