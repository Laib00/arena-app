import React, { useState, useRef, useEffect } from "react";
import {
  DISC,
  SALES_STYLES,
  NATIONALITIES,
  EDU_LEVELS,
  certificationsForIndustry,
  occupationForIndustry,
} from "../constants";
import { NAVY, GOLD, CREAM, inputStyle } from "../theme";
import { STUDENT_GRADE_OPTIONS, TARGET_PATHS, isStudentGrade } from "../data/educationInterview";
import { packLabel } from "../data/practicePack";
import Field from "../components/Field";
import PageHeader from "../components/PageHeader";
import type { AgentProfile, DiscType, Industry, PracticePack, StudentGrade, UserProfile } from "../types/domain";
import { ENABLE_FINANCIAL_PLANNING } from "../constants";

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
  industry?: Industry;
  openChatCount?: number;
  onSave: (data: AgentProfile) => Promise<void> | void;
  onIndustryChange?: (industry: string) => Promise<void> | void;
  onBack: () => void;
  onSignOut: () => void;
  mode?: "edit" | "onboarding";
  onComplete?: () => void;
}) {
  const isOnboarding = mode === "onboarding";
  const isEducation = practicePack === "education";
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

  // Workspace switch loads the other industry's agent profile into this form.
  useEffect(() => {
    if (!initialized || !himselfLoaded) return;
    setForm(himself);
    setDirty(false);
    setSaved(false);
    setOpenChatNotice(null);
  }, [industry]);

  // Keep occupation/cert in sync when industry changes (e.g. Google onboarding).
  useEffect(() => {
    if (!initialized) return;
    const certs = certificationsForIndustry(industry);
    setForm((prev) => {
      const nextOcc = occupationForIndustry(industry);
      const nextCert = certs.includes(String(prev.certification || ""))
        ? prev.certification
        : certs[0];
      if (prev.occupation === nextOcc && prev.certification === nextCert) return prev;
      return { ...prev, occupation: nextOcc, certification: nextCert };
    });
  }, [industry, initialized]);

  function update(field: keyof AgentProfile | string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setSaved(false);
    setOpenChatNotice(null);
  }

  async function handleIndustryPick(next: "Property" | "Financial Planning") {
    if (!onIndustryChange || !ENABLE_FINANCIAL_PLANNING) return;
    if ((next === "Property" ? "Property" : "FP") === industry) return;
    setIndustrySaving(true);
    setError(null);
    try {
      // Preserve unsaved edits on the current workspace before flipping.
      if (dirty) await persist(form);
      await onIndustryChange(next);
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
            ? "Saved. You still have 1 open chat — that session keeps using the profile from when it started. Your updated profile will apply to new sessions after you end the open chat."
            : `Saved. You still have ${openChatCount} open chats — those sessions keep using the profile from when they started. Your updated profile will apply to new sessions after you end the open chats.`
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

  async function handleContinue() {
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: CREAM, color: NAVY, fontFamily: "-apple-system, sans-serif" }}>
        Loading your profile...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "-apple-system, sans-serif" }}>
      <PageHeader
        brand={isOnboarding ? "logo" : "back"}
        onHome={isOnboarding ? undefined : handleBack}
        title={isOnboarding ? "Complete your profile" : "Your Profile"}
        actions={
          <>
            {!isOnboarding && (
              <button type="button" onClick={handleBack} className="arena-topbar-link">Home</button>
            )}
            <button type="button" onClick={onSignOut} className="arena-topbar-link">Sign Out</button>
          </>
        }
      />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px 60px" }}>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>{profile?.email}</p>
        {ENABLE_FINANCIAL_PLANNING && onIndustryChange && isOnboarding && practicePack !== "education" ? (
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.5, marginBottom: 10 }}>
              What do you practise for?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(
                [
                  { key: "Property" as const, title: "Property", body: "Buyers, sellers, tenants, listings." },
                  { key: "Financial Planning" as const, title: "Financial Planning", body: "Protection, investment, retirement." },
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
                      textAlign: "left",
                      padding: "14px 12px",
                      borderRadius: 12,
                      border: selected ? `2px solid ${NAVY}` : "1px solid #E2DFD6",
                      background: selected ? NAVY : "#fff",
                      color: selected ? "#fff" : NAVY,
                      cursor: industrySaving ? "wait" : "pointer",
                      opacity: industrySaving ? 0.7 : 1,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.4, opacity: selected ? 0.9 : 0.7 }}>{opt.body}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : ENABLE_FINANCIAL_PLANNING && onIndustryChange ? (
          <div style={{ marginBottom: 16, maxWidth: 320 }}>
            <Field label="Switch workspace">
              <select
                value={industryLabel}
                disabled={industrySaving}
                onChange={(e) => {
                  const next = e.target.value as "Property" | "Financial Planning";
                  if (next !== industryLabel) handleIndustryPick(next);
                }}
                style={{
                  ...inputStyle,
                  cursor: industrySaving ? "wait" : "pointer",
                  opacity: industrySaving ? 0.7 : 1,
                }}
              >
                <option value="Property">Property</option>
                <option value="Financial Planning">Financial Planning</option>
              </select>
            </Field>
            <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.45, marginTop: 8 }}>
              Switching opens that profession’s dashboard — chats, history, and scenarios stay separate.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: isOnboarding ? 8 : 16 }}>
            Workspace: <span style={{ fontWeight: 700, color: NAVY }}>{industryLabel}</span>
          </p>
        )}
        {isOnboarding && (
          <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.5, marginBottom: 16 }}>
            Tell us about yourself so practice sessions can match you.
>>>>>>> 54d67ab (Enable Financial Planning as a separate practice workspace.)
          </p>
        )}

        {hasOpenChats && (
          <div
            style={{
              background: "#FFF8E8",
              border: "1px solid #E8D4A8",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: 13,
              lineHeight: 1.5,
              color: NAVY,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {openChatCount === 1 ? "You have 1 open chat" : `You have ${openChatCount} open chats`}
            </div>
            Profile changes are saved to your account, but open chats keep the profile from when that session started. End those chats (End Session) if you want new practice to use your updated profile.
          </div>
        )}

        {openChatNotice && (
          <div
            style={{
              background: "#EAF5EA",
              border: "1px solid #B7D8B7",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: 13,
              lineHeight: 1.5,
              color: "#1F4D2A",
            }}
          >
            {openChatNotice}
          </div>
        )}

        <div className="arena-profile-grid" style={{ background: "#fff", border: "1px solid #E2DFD6", borderRadius: 12, padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Name">
            <input value={form.name || ""} onChange={(e) => update("name", e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Age">
            <input type="number" value={form.age ?? ""} onChange={(e) => update("age", e.target.value)} style={inputStyle} />
          </Field>

          {isEducation ? (
            <>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Grade">
                  <select
                    value={isStudentGrade(form.studentGrade) ? form.studentGrade : ""}
                    onChange={(e) => {
                      const next = e.target.value as StudentGrade;
                      update("studentGrade", next);
                      update("targetPath", TARGET_PATHS[next][0]);
                    }}
                    style={inputStyle}
                  >
                    <option value="" disabled>Select grade</option>
                    {STUDENT_GRADE_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Field of study / stream">
                  <input
                    value={form.fieldOfStudy || ""}
                    onChange={(e) => update("fieldOfStudy", e.target.value)}
                    placeholder="e.g. Business, Computing, Science"
                    style={inputStyle}
                  />
                </Field>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="What are you practising for?">
                  <select
                    value={form.targetPath || targetOptions[0]}
                    onChange={(e) => update("targetPath", e.target.value)}
                    style={inputStyle}
                  >
                    {targetOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Nationality">
                <input
                  list="profile-nationality-options"
                  value={form.nationality || ""}
                  onChange={(e) => update("nationality", e.target.value)}
                  style={inputStyle}
                />
                <datalist id="profile-nationality-options">
                  {NATIONALITIES.map((n) => <option key={n} value={n} />)}
                </datalist>
              </Field>
              <Field label="Personality (DISC)">
                <select value={form.disc || "I"} onChange={(e) => update("disc", e.target.value)} style={inputStyle}>
                  {Object.keys(DISC).map((d) => <option key={d} value={d}>{d} — {DISC[d as DiscType].name}</option>)}
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field label="Occupation">
                <input value={form.occupation || ""} onChange={(e) => update("occupation", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Nationality">
                <input
                  list="profile-nationality-options"
                  value={form.nationality || ""}
                  onChange={(e) => update("nationality", e.target.value)}
                  style={inputStyle}
                />
                <datalist id="profile-nationality-options">
                  {NATIONALITIES.map((n) => <option key={n} value={n} />)}
                </datalist>
              </Field>
              <Field label="Experience (months)">
                <input type="number" value={form.experience ?? ""} onChange={(e) => update("experience", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Educational Level">
                <select value={form.education || EDU_LEVELS[2]} onChange={(e) => update("education", e.target.value)} style={inputStyle}>
                  {EDU_LEVELS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Personality (DISC)">
                <select value={form.disc || "I"} onChange={(e) => update("disc", e.target.value)} style={inputStyle}>
                  {Object.keys(DISC).map((d) => <option key={d} value={d}>{d} — {DISC[d as DiscType].name}</option>)}
                </select>
              </Field>
              <Field label="Sales Style">
                <select value={form.salesStyle || SALES_STYLES[0]} onChange={(e) => update("salesStyle", e.target.value)} style={inputStyle}>
                  {SALES_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Professional Certification">
                  <select value={form.certification || industryCerts[0]} onChange={(e) => update("certification", e.target.value)} style={inputStyle}>
                    {industryCerts.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </>
          )}
        </div>

        {error && <div style={{ background: "#FCE4E4", color: "#7A2E3A", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginTop: 16 }}>{error}</div>}

        {isOnboarding ? (
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            style={{
              marginTop: 20, padding: "12px 24px", borderRadius: 8, border: "none",
              background: GOLD, color: "#fff", fontWeight: 700, fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 20, padding: "12px 24px", borderRadius: 8, border: "none",
              background: GOLD, color: NAVY, fontWeight: 700, fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Profile"}
          </button>
        )}
      </div>
    </div>
  );
}
