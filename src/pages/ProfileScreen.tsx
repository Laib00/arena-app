import React, { useState, useRef, useEffect, type CSSProperties, type ReactNode } from "react";
import {
  DISC,
  SALES_STYLES,
  NATIONALITIES,
  EDU_LEVELS,
  certificationsForIndustry,
  occupationForIndustry,
} from "../constants";
import { NAVY, CREAM } from "../theme";
import { STUDENT_GRADE_OPTIONS, TARGET_PATHS, isStudentGrade } from "../data/educationInterview";
import { packLabel } from "../data/practicePack";
import { ENABLE_FINANCIAL_PLANNING } from "../data/personas";
import PageHeader from "../components/PageHeader";
import type { AgentProfile, DiscType, PracticePack, StudentGrade, UserProfile } from "../types/domain";
import type { SalesIndustry } from "../agentWorkspaces";

type OnboardStep = "industry" | "details";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const quietInput: CSSProperties = {
  width: "100%",
  padding: "10px 0",
  border: "none",
  borderBottom: "1px solid #D8D4CC",
  borderRadius: 0,
  fontSize: 15,
  fontFamily: SANS,
  color: NAVY,
  background: "transparent",
  boxSizing: "border-box",
  outline: "none",
};

const sectionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "#9A948A",
  margin: "0 0 18px",
};

function QuietField({
  label,
  full = false,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: "block", gridColumn: full ? "1 / -1" : undefined, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "#8A847A", marginBottom: 2, fontWeight: 500 }}>{label}</div>
      {children}
    </label>
  );
}

export default function ProfileScreen({
  profile,
  himself,
  himselfLoaded,
  practicePack = "property",
  industry = "Property",
  openChatCount = 0,
  onSave,
  onIndustryChange,
  onBack,
  onSignOut,
  mode = "edit",
  onComplete,
}: {
  profile: UserProfile | null;
  himself: AgentProfile;
  himselfLoaded: boolean;
  practicePack?: PracticePack;
  industry?: SalesIndustry;
  openChatCount?: number;
  onSave: (data: AgentProfile) => Promise<void> | void;
  onIndustryChange?: (industry: string, opts?: { navigateHome?: boolean }) => Promise<void> | void;
  onBack: () => void;
  onSignOut: () => void;
  mode?: "edit" | "onboarding";
  onComplete?: () => void;
}) {
  const isOnboarding = mode === "onboarding";
  const isEducation = practicePack === "education";
  const needsIndustryStep = isOnboarding && ENABLE_FINANCIAL_PLANNING && !isEducation && Boolean(onIndustryChange);

  const [onboardStep, setOnboardStep] = useState<OnboardStep>(
    needsIndustryStep ? "industry" : "details"
  );
  const [form, setForm] = useState<AgentProfile>(himself);
  const [initialized, setInitialized] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openChatNotice, setOpenChatNotice] = useState<string | null>(null);
  const [industrySaving, setIndustrySaving] = useState(false);
  const formRef = useRef(form);
  const dirtyRef = useRef(false);

  formRef.current = form;
  dirtyRef.current = dirty;

  const hasOpenChats = !isOnboarding && openChatCount > 0;
  const studentGrade = isStudentGrade(form.studentGrade) ? form.studentGrade : "university";
  const targetOptions = TARGET_PATHS[studentGrade] || TARGET_PATHS.university;
  const industryCerts = certificationsForIndustry(industry);
  const industryLabel = !ENABLE_FINANCIAL_PLANNING || industry === "Property" ? "Property" : "Financial Planning";

  useEffect(() => {
    if (himselfLoaded && !initialized) {
      setForm(himself);
      setInitialized(true);
      setDirty(false);
    }
  }, [himselfLoaded, initialized, himself]);

  useEffect(() => {
    if (!initialized || !himselfLoaded) return;
    setForm(himself);
    setDirty(false);
    setSaved(false);
    setOpenChatNotice(null);
  }, [industry]);

  useEffect(() => {
    if (!initialized || isEducation) return;
    const certs = certificationsForIndustry(industry);
    setForm((prev) => {
      const nextOcc = occupationForIndustry(industry);
      const nextCert = certs.includes(String(prev.certification || ""))
        ? prev.certification
        : certs[0];
      if (prev.occupation === nextOcc && prev.certification === nextCert) return prev;
      return { ...prev, occupation: nextOcc, certification: nextCert };
    });
  }, [industry, initialized, isEducation]);

  function update(field: keyof AgentProfile | string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
    setOpenChatNotice(null);
  }

  async function handleIndustryPick(next: "Property" | "Financial Planning") {
    if (!onIndustryChange || !ENABLE_FINANCIAL_PLANNING) return;
    const same = (next === "Property" ? "Property" : "FP") === industry;
    setIndustrySaving(true);
    setError(null);
    try {
      if (!same) {
        if (dirty && !isOnboarding) await persist(form);
        await onIndustryChange(next, { navigateHome: !isOnboarding });
      }
      if (isOnboarding) setOnboardStep("details");
      setDirty(false);
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to switch workspace");
    } finally {
      setIndustrySaving(false);
    }
  }

  async function persist(data: AgentProfile) {
    setSaving(true);
    setError(null);
    try {
      await onSave(data);
      setDirty(false);
      setSaved(true);
      if (hasOpenChats) {
        setOpenChatNotice(
          openChatCount === 1
            ? "Saved. Open chats still use the profile from when they started."
            : `Saved. Your ${openChatCount} open chats still use the profile from when they started.`
        );
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
      setOpenChatNotice(null);
      return false;
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (isOnboarding || !initialized || !dirty) return;
    const timeout = setTimeout(() => persist(form), 800);
    return () => clearTimeout(timeout);
  }, [form, initialized, dirty, isOnboarding]);

  async function handleSave() {
    await persist(form);
  }

  async function handleProceed() {
    if (!String(form.name || "").trim()) {
      setError("Please enter your name.");
      return;
    }
    if (isEducation && !isStudentGrade(form.studentGrade)) {
      setError("Please select your grade.");
      return;
    }
    const ok = await persist(form);
    if (ok && onComplete) onComplete();
  }

  async function handleBack() {
    if (isOnboarding) return;
    if (dirtyRef.current) {
      const ok = await persist(formRef.current);
      if (!ok) return;
    }
    onBack();
  }

  if (!himselfLoaded || !initialized) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: SANS }}>
        Loading your profile...
      </div>
    );
  }

  const pageTitle = isOnboarding
    ? onboardStep === "industry"
      ? "Choose your practice"
      : "Your details"
    : "Profile";

  const pageSub = isOnboarding
    ? onboardStep === "industry"
      ? "Pick where you want to start practising."
      : isEducation
        ? "A few details so interviews can match you."
        : `For your ${industryLabel} practice sessions.`
    : profile?.email || "";

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: SANS, color: NAVY }}>
      <PageHeader
        brand={isOnboarding ? "logo" : "back"}
        onHome={isOnboarding ? undefined : handleBack}
        title={undefined}
        actions={
          <>
            {!isOnboarding && (
              <button type="button" onClick={handleBack} className="arena-topbar-link">Home</button>
            )}
            <button type="button" onClick={onSignOut} className="arena-topbar-link">Sign Out</button>
          </>
        }
      />

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 72px" }}>
        <header style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, margin: 0, letterSpacing: -0.3, lineHeight: 1.15 }}>
            {pageTitle}
          </h1>
          {pageSub && (
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "#7A746A", lineHeight: 1.5 }}>
              {pageSub}
            </p>
          )}
        </header>

        {/* Onboarding: industry choice */}
        {isOnboarding && needsIndustryStep && onboardStep === "industry" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {(
                [
                  { key: "Property" as const, title: "Property", body: "Buyers, sellers, tenants, listings." },
                  { key: "Financial Planning" as const, title: "Financial Planning", body: "Protection, investment, retirement." },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={industrySaving}
                  onClick={() => handleIndustryPick(opt.key)}
                  style={{
                    textAlign: "left",
                    padding: "28px 22px",
                    borderRadius: 0,
                    border: "1px solid #D8D4CC",
                    background: "transparent",
                    color: NAVY,
                    cursor: industrySaving ? "wait" : "pointer",
                    opacity: industrySaving ? 0.65 : 1,
                    fontFamily: SANS,
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = NAVY;
                    e.currentTarget.style.background = "rgba(255,255,255,0.55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#D8D4CC";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ fontFamily: SERIF, fontSize: 20, marginBottom: 10 }}>{opt.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: "#7A746A" }}>{opt.body}</div>
                </button>
              ))}
            </div>
            {error && <p style={{ color: "#7A2E3A", fontSize: 13, marginTop: 18 }}>{error}</p>}
          </div>
        )}

        {/* Details / edit */}
        {(!isOnboarding || onboardStep === "details" || !needsIndustryStep) && (
          <>
            {/* Workspace switch — more prominent control */}
            {!isOnboarding && ENABLE_FINANCIAL_PLANNING && onIndustryChange && !isEducation ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  padding: "16px 18px",
                  marginBottom: 32,
                  background: "#fff",
                  border: `1px solid ${NAVY}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#9A948A", marginBottom: 4 }}>
                    Workspace
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: 20, color: NAVY, lineHeight: 1.2 }}>
                    {industryLabel}
                  </div>
                  <div style={{ fontSize: 12, color: "#7A746A", marginTop: 4 }}>
                    Chats, history, and scenarios stay separate
                  </div>
                </div>
                <div
                  role="group"
                  aria-label="Switch workspace"
                  style={{
                    display: "inline-flex",
                    padding: 3,
                    background: CREAM,
                    border: "1px solid #D8D4CC",
                    opacity: industrySaving ? 0.7 : 1,
                  }}
                >
                  {(
                    [
                      { key: "Property" as const, label: "Property" },
                      { key: "Financial Planning" as const, label: "Financial Planning" },
                    ] as const
                  ).map((opt) => {
                    const selected = industryLabel === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        disabled={industrySaving}
                        onClick={() => handleIndustryPick(opt.key)}
                        style={{
                          border: "none",
                          cursor: industrySaving ? "wait" : "pointer",
                          padding: "9px 14px",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: SANS,
                          background: selected ? NAVY : "transparent",
                          color: selected ? "#fff" : NAVY,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : !isOnboarding && isEducation ? (
              <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #E5E1D8", fontSize: 14, color: "#7A746A" }}>
                Field · <span style={{ color: NAVY, fontWeight: 600 }}>{packLabel(practicePack)}</span>
              </div>
            ) : null}

            {isOnboarding && needsIndustryStep && (
              <button
                type="button"
                onClick={() => { setError(null); setOnboardStep("industry"); }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  marginBottom: 28,
                  color: "#7A746A",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: SANS,
                }}
              >
                ← {industryLabel}
              </button>
            )}

            {hasOpenChats && (
              <p style={{ fontSize: 13, color: "#8A6A3A", lineHeight: 1.5, marginBottom: 24 }}>
                You have {openChatCount} open {openChatCount === 1 ? "chat" : "chats"}. Changes apply to new sessions after you end them.
              </p>
            )}

            {openChatNotice && (
              <p style={{ fontSize: 13, color: "#3D6B45", lineHeight: 1.5, marginBottom: 24 }}>{openChatNotice}</p>
            )}

            <section style={{ marginBottom: 36 }}>
              <h2 style={sectionLabel}>About you</h2>
              <div className="arena-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 28px" }}>
                <QuietField label="Name">
                  <input value={form.name || ""} onChange={(e) => update("name", e.target.value)} style={quietInput} />
                </QuietField>
                <QuietField label="Age">
                  <input type="number" value={form.age ?? ""} onChange={(e) => update("age", e.target.value)} style={quietInput} />
                </QuietField>

                {isEducation ? (
                  <>
                    <QuietField label="Grade" full>
                      <select
                        value={isStudentGrade(form.studentGrade) ? form.studentGrade : ""}
                        onChange={(e) => {
                          const next = e.target.value as StudentGrade;
                          update("studentGrade", next);
                          update("targetPath", TARGET_PATHS[next][0]);
                        }}
                        style={quietInput}
                      >
                        <option value="" disabled>Select grade</option>
                        {STUDENT_GRADE_OPTIONS.map((g) => (
                          <option key={g.id} value={g.id}>{g.label}</option>
                        ))}
                      </select>
                    </QuietField>
                    <QuietField label="Field of study / stream" full>
                      <input
                        value={form.fieldOfStudy || ""}
                        onChange={(e) => update("fieldOfStudy", e.target.value)}
                        placeholder="e.g. Business, Computing"
                        style={quietInput}
                      />
                    </QuietField>
                    <QuietField label="Practising for" full>
                      <select
                        value={form.targetPath || targetOptions[0]}
                        onChange={(e) => update("targetPath", e.target.value)}
                        style={quietInput}
                      >
                        {targetOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </QuietField>
                    <QuietField label="Nationality">
                      <input
                        list="profile-nationality-options"
                        value={form.nationality || ""}
                        onChange={(e) => update("nationality", e.target.value)}
                        style={quietInput}
                      />
                      <datalist id="profile-nationality-options">
                        {NATIONALITIES.map((n) => <option key={n} value={n} />)}
                      </datalist>
                    </QuietField>
                    <QuietField label="Personality (DISC)">
                      <select value={form.disc || "I"} onChange={(e) => update("disc", e.target.value)} style={quietInput}>
                        {Object.keys(DISC).map((d) => <option key={d} value={d}>{d} — {DISC[d as DiscType].name}</option>)}
                      </select>
                    </QuietField>
                  </>
                ) : (
                  <>
                    <QuietField label="Occupation">
                      <input value={form.occupation || ""} onChange={(e) => update("occupation", e.target.value)} style={quietInput} />
                    </QuietField>
                    <QuietField label="Nationality">
                      <input
                        list="profile-nationality-options"
                        value={form.nationality || ""}
                        onChange={(e) => update("nationality", e.target.value)}
                        style={quietInput}
                      />
                      <datalist id="profile-nationality-options">
                        {NATIONALITIES.map((n) => <option key={n} value={n} />)}
                      </datalist>
                    </QuietField>
                  </>
                )}
              </div>
            </section>

            {!isEducation && (
              <section style={{ marginBottom: 36 }}>
                <h2 style={sectionLabel}>Practice style</h2>
                <div className="arena-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 28px" }}>
                  <QuietField label="Experience (months)">
                    <input type="number" value={form.experience ?? ""} onChange={(e) => update("experience", e.target.value)} style={quietInput} />
                  </QuietField>
                  <QuietField label="Education">
                    <select value={form.education || EDU_LEVELS[2]} onChange={(e) => update("education", e.target.value)} style={quietInput}>
                      {EDU_LEVELS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </QuietField>
                  <QuietField label="Personality (DISC)">
                    <select value={form.disc || "I"} onChange={(e) => update("disc", e.target.value)} style={quietInput}>
                      {Object.keys(DISC).map((d) => <option key={d} value={d}>{d} — {DISC[d as DiscType].name}</option>)}
                    </select>
                  </QuietField>
                  <QuietField label="Sales style">
                    <select value={form.salesStyle || SALES_STYLES[0]} onChange={(e) => update("salesStyle", e.target.value)} style={quietInput}>
                      {SALES_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </QuietField>
                  <QuietField label="Professional certification" full>
                    <select value={form.certification || industryCerts[0]} onChange={(e) => update("certification", e.target.value)} style={quietInput}>
                      {industryCerts.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </QuietField>
                </div>
              </section>
            )}

            {error && <p style={{ color: "#7A2E3A", fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              {isOnboarding ? (
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={saving}
                  style={{
                    padding: "13px 26px",
                    borderRadius: 999,
                    border: "none",
                    background: NAVY,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                    fontFamily: SANS,
                  }}
                >
                  {saving ? "Saving…" : "Proceed to dashboard"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "13px 26px",
                    borderRadius: 999,
                    border: "none",
                    background: NAVY,
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.6 : 1,
                    fontFamily: SANS,
                  }}
                >
                  {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
                </button>
              )}
              {!isOnboarding && dirty && !saving && (
                <span style={{ fontSize: 12, color: "#9A948A" }}>Unsaved changes</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
